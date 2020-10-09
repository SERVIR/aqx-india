"""Helper Functions for the Controllers Module"""
import os
import xml.etree.ElementTree as ET
from collections import defaultdict
import calendar
import numpy as np
import shapely.geometry
import shapely
import netCDF4
from tethysapp.aqx_india.config import THREDDS_CATALOG, THREDDS_wms, DATA_DIR, LOG_DIR, GIF_DIR
from shapely.geometry import Polygon
import logging
from datetime import datetime,timedelta
import psycopg2
import json
import requests
from PIL import Image,ImageFile,ImageFont,ImageDraw,ImageChops,ImageOps
import imageio
from django.views.decorators.csrf import csrf_exempt
import tethysapp.aqx_india.config as cfg
from geopy.distance import great_circle
from geopy.distance import geodesic
from itertools import *
import logging

log = logging.getLogger(__name__)

logger = logging.getLogger('utils.py')
logger.setLevel(logging.DEBUG)
handler = logging.handlers.RotatingFileHandler(LOG_DIR+'/AQX_India.log', maxBytes=104857600, backupCount=5)
logger.addHandler(handler)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('"%(asctime)s" , "%(name)s" , "%(levelname)s" , "%(message)s"')
ch.setFormatter(formatter)
handler.setFormatter(formatter)
logger.addHandler(ch)


def generate_variables_meta():
    """Generate Variables Metadata from the Var Info text"""
    db_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'public/data/var_info.txt')
    variable_list = []
    with open(db_file, mode='r') as f:
        f.readline()  # Skip first line

        lines = f.readlines()

    for line in lines:
        if line != '':
            line = line.strip()
            linevals = line.split('|')
            variable_id = linevals[0]
            category = linevals[1]
            display_name = linevals[2]
            units = linevals[3]
            vmin = linevals[4]
            vmax = linevals[5]

            try:
                variable_list.append({
                    'id': variable_id,
                    'category': category,
                    'display_name': display_name,
                    'units': units,
                    'min': vmin,
                    'max': vmax,
                })
            except Exception:
                continue
    return variable_list


def get_styles():
    """Returns a list of style tuples"""
    date_obj = {}

    color_opts = [
        ('Rainbow', 'rainbow'),
        ('TMP 1', 'tmp_2maboveground'),
        ('TMP 2', 'dpt_2maboveground'),
        ('SST-36', 'sst_36'),
        ('Greyscale', 'greyscale'),

        ('OCCAM', 'occam'),
        ('OCCAM Pastel', 'occam_pastel-30'),
        ('Red-Blue', 'redblue'),
        ('NetCDF Viewer', 'ncview'),
        ('ALG', 'alg'),
        ('ALG 2', 'alg2'),
        ('Ferret', 'ferret'),
        ('Reflectivity', 'enspmm-refc'),
        ('PM25', 'pm25'),
        ('PM25 RAMP', 'pm25ramp'),
        # ('Probability', 'prob'),
        # ('White-Blue', whiteblue'),
        # ('Grace', 'grace'),
    ]

    date_obj["colors"] = color_opts

    return date_obj


def gen_style_legend(style):
    style_f = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'public/data/palettes/'+str(style)+'.pal')
    scale = []
    if os.path.exists(style_f):
        with open(style_f, mode='r') as f:
            lines = f.readlines()
        for line in lines:
            lval = line.split()
            if len(lval)>0:
                rgb = (lval[0], lval[1], lval[2])
                scale.append(rgb)
    return scale


def gen_thredds_options():
    """Generate THREDDS options for the dropdowns"""
    catalog_url = THREDDS_CATALOG

    catalog_wms = THREDDS_wms
    tinf = defaultdict()
    json_obj = {}


    if catalog_url[-1] != "/":
        catalog_url = catalog_url + '/'

    if catalog_wms[-1] != "/":
        catalog_wms = catalog_wms + '/'
    catalog_xml_url = catalog_url + 'catalog.xml'
    cat_response = requests.get(catalog_xml_url, verify=False)
    cat_tree = ET.fromstring(cat_response.content)
    currentDay = datetime.now().strftime('%d')
    currentMonth = datetime.now().strftime('%m')
    currentYear = datetime.now().strftime('%Y')
    d=currentYear+currentMonth+currentDay
    for elem in cat_tree.iter():
        for k, v in elem.attrib.items():
            if 'title' in k and ("geos" in v or "fire" in v or "aod" in v):
                run_xml_url = catalog_url + str(v) +'/catalog.xml'
                run_response = requests.get(run_xml_url, verify=False)
                run_tree = ET.fromstring(run_response.content)
                for ele in run_tree.iter():
                    for ke, va in ele.attrib.items():
                        if 'urlPath' in ke:
                            if va.endswith('.nc') and d in va  and "geos" in va:
                                tinf.setdefault(v, {}).setdefault('3daytoday', []).append(va)
                                tinf.setdefault(v, {}).setdefault('3dayrecent', []).append(va)
                            elif va.endswith('.nc') and d not in va and "geos" in va:
                                tinf.setdefault(v, {}).setdefault('3dayrecent', []).append(va)
                            elif va.endswith('.nc') and "geos" not in va:
                                tinf.setdefault(v, {}).setdefault('monthly', []).append(va)
                        if 'title' in ke and ("combined" in va):
                            mo_xml_url = catalog_url + str(v) + '/'+str(va)+'/catalog.xml'
                            print(mo_xml_url)
                            mo_response = requests.get(mo_xml_url, verify=False)
                            mo_tree = ET.fromstring(mo_response.content)
                            for el in mo_tree.iter():
                                for key, val in el.attrib.items():
                                    if 'urlPath' in key:
                                        tinf.setdefault(v, {}).setdefault(va, []).append(val)
    json_obj['catalog'] = tinf
    return json_obj

def get_time(freq, run_type, run_date):
    # Empty list to store the timeseries values
    ts = []
    json_obj = {}

    """Make sure you have this path for all the run_types(/home/tethys/aq_dir/fire/combined/combined.nc)"""
    infile = os.path.join(DATA_DIR, run_type, run_date)
    nc_fid = netCDF4.Dataset(infile, 'r')  # Reading the netCDF file
    lis_var = nc_fid.variables
    time = nc_fid.variables['time'][:]
    for timestep, v in enumerate(time):
        dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                  calendar=lis_var['time'].calendar)
        #time_stamp = calendar.timegm(dt_str.utctimetuple()) * 1000
        dtt=dt_str.strftime('%Y-%m-%dT%H:%M:%SZ')
        dt=datetime.strptime(dtt,'%Y-%m-%dT%H:%M:%SZ')
        ts.append(datetime.strftime(dt, '%Y-%m-%dT%H:%M:%SZ'))
    ts.sort()
    json_obj["times"] = ts
    return json_obj


@csrf_exempt
def get_pt_values(s_var, geom_data, freq, run_type, run_date):
    """Helper function to generate time series for a point"""
    logger.info("PARAMETERS : ['" + s_var + "','" + geom_data + "','" + freq + "','" + run_type + "','" + run_date+"']")
    # Empty list to store the timeseries values
    ts_plot = []
    ts_plot_pm25 = []
    ts_plot_bcpm25 = []
    ts_plot_geospm25 = []
    s_var1 = 'PM25'
    s_var2 = 'BC_MLPM25'
    s_var3 = 'GEOSPM25'

    json_obj = {}

    # Defining the lat and lon from the coords string
    coords = geom_data.split(',')
    stn_lat = float(coords[1])
    stn_lon = float(coords[0])
    st_point=(stn_lat,stn_lon)
    """Make sure you have this path for all the run_types(/home/tethys/aq_dir/fire/combined/combined.nc)"""
    try:
        if "geos" in run_type:
            infile = os.path.join(DATA_DIR, run_type, run_date)
        else:
            infile = os.path.join(DATA_DIR, run_type, freq, run_date)
        nc_fid = netCDF4.Dataset(infile, 'r',)  # Reading the netCDF file
        lis_var = nc_fid.variables
        if "geos" == run_type and "PM25" in s_var:
            field = nc_fid.variables[s_var][:]
            lats = nc_fid.variables['lat'][:]
            lons = nc_fid.variables['lon'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
            abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
            lat_idx = (abslat.argmin())
            lon_idx = (abslon.argmin())
            for timestep, v in enumerate(time):
                val = field[lat_idx, lon_idx][timestep]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    dtt = dt_str.strftime('%Y-%m-%dT%H:%M:%SZ')
                    dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                    time_stamp = calendar.timegm(dt.utctimetuple()) * 1000
                    ts_plot.append([time_stamp, float(val)])
            field1 = nc_fid.variables[s_var1][:]
            lats = nc_fid.variables['lat'][:]
            lons = nc_fid.variables['lon'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
            abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
            lat_idx = (abslat.argmin())
            lon_idx = (abslon.argmin())
            for timestep, v in enumerate(time):

                val = field1[lat_idx, lon_idx][timestep]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    test=dt_str+timedelta(hours=7)
                    time_stamp = calendar.timegm(test.timetuple()) * 1000
                    ts_plot_pm25.append([time_stamp, float(val)])
            field2 = nc_fid.variables[s_var2][:]
            lats = nc_fid.variables['lat'][:]
            lons = nc_fid.variables['lon'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            # Defining the variable array(throws error if variable is not in combined.nc)
            #new way to cal dist
            coordinates=list(product(lats, lons))
            dist=[]
            for val in coordinates:
                distance=great_circle(val, st_point).kilometers
                dist.append(distance)
            index = np.argmin(np.array(dist))
            lat=coordinates[index][0]
            lon = coordinates[index][1]
            for l in range(len(lats)):
                if lat==lats[l]:
                    lat_idx=l
            for l in range(len(lons)):
                if lon == lons[l]:
                    lon_idx = l

            # print("nearest index of lat and lon")


            # abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
            # abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
            # lat_idx = (abslat.argmin())
            # lon_idx = (abslon.argmin())
        #new way end
            for timestep, v in enumerate(time):
                val = field2[lat_idx, lon_idx][timestep]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    test=dt_str+timedelta(hours=7)
                    dtt = test.strftime('%Y-%m-%dT%H:%M:%SZ')
                    dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                    time_stamp = calendar.timegm(dt.timetuple()) * 1000
                    ts_plot_bcpm25.append([time_stamp, float(val)])
            field3 = nc_fid.variables[s_var3][:]
            lats = nc_fid.variables['lat'][:]
            lons = nc_fid.variables['lon'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            coordinates = list(product(lats, lons))
            dist = []
            for val in coordinates:
                distance = great_circle(val, st_point).kilometers
                dist.append(distance)
            index = np.argmin(np.array(dist))
            lat = coordinates[index][0]
            lon = coordinates[index][1]
            for l in range(len(lats)):
                if lat == lats[l]:
                    lat_idx = l
            for l in range(len(lons)):
                if lon == lons[l]:
                    lon_idx = l
            for timestep, v in enumerate(time):

                val = field3[lat_idx, lon_idx][timestep]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    test=dt_str+timedelta(hours=7)
                    dtt = test.strftime('%Y-%m-%dT%H:%M:%SZ')
                    dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                    time_stamp = calendar.timegm(dt.timetuple()) * 1000
                    ts_plot_geospm25.append([time_stamp, float(val)])
        else:
            field = nc_fid.variables[s_var][:]
            lats = nc_fid.variables['Latitude'][:]
            lons = nc_fid.variables['Longitude'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            coordinates = list(product(lats, lons))
            dist = []
            for val in coordinates:
                distance = great_circle(val, st_point).kilometers
                dist.append(distance)
            index = np.argmin(np.array(dist))
            lat = coordinates[index][0]
            lon = coordinates[index][1]
            for l in range(len(lats)):
                if lat == lats[l]:
                    lat_idx = l
            for l in range(len(lons)):
                if lon == lons[l]:
                    lon_idx = l
            for timestep, v in enumerate(time):

                val = field[timestep,lat_idx,lon_idx]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    dtt = dt_str.strftime('%Y-%m-%dT%H:%M:%SZ')
                    dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                    time_stamp = calendar.timegm(dt.utctimetuple()) * 1000
                    ts_plot.append([time_stamp, float(val)])

        ts_plot.sort()
        ts_plot_pm25.sort()
        ts_plot_bcpm25.sort()
        ts_plot_geospm25.sort()
        point = [round(stn_lat, 2), round(stn_lon, 2)]
        json_obj["plot"] = ts_plot


        if freq == "station":
            json_obj["bc_mlpm25"] = ts_plot_bcpm25
            json_obj["geos_pm25"] = ts_plot_geospm25
            json_obj["ml_pm25"] = ts_plot_pm25
        json_obj["geom"] = point
        if len(ts_plot) == 0:
            logger.warn("The selected point has no data")
        else:
            pass
            # logger.info("PLOT POINT OBJECT : " + json.dumps(json_obj["plot"]))
        logger.info(json.dumps(json_obj["geom"]))
    except Exception as e:
        return json_obj
    return json_obj

@csrf_exempt
def get_poylgon_values(s_var, geom_data, freq, run_type, run_date):
    """Helper function to generate time series for a polygon"""
    logger.info("PARAMETERS : ['" + s_var +"','"+ geom_data +"','"+ freq +"','"+ run_type +"','"+ run_date+"']")
    # Empty list to store the timeseries values
    ts_plot = []

    json_obj = {}
    # Defining the lat and lon from the coords string
    poly_geojson = Polygon(json.loads(geom_data))
    shape_obj = shapely.geometry.asShape(poly_geojson)
    bounds = poly_geojson.bounds
    miny = float(bounds[0])
    minx = float(bounds[1])
    maxy = float(bounds[2])
    maxx = float(bounds[3])

    """Make sure you have this path for all the run_types(/home/tethys/aq_dir/fire/combined/combined.nc)"""
    if "geos" in run_type:
        infile = os.path.join(DATA_DIR, run_type, run_date)
    else:
        infile = os.path.join(DATA_DIR, run_type, freq, run_date)
    nc_fid = netCDF4.Dataset(infile, 'r')
    lis_var = nc_fid.variables

    if "geos" == run_type:
        field = nc_fid.variables[s_var][:]
        lats = nc_fid.variables['lat'][:]
        lons = nc_fid.variables['lon'][:]  # Defining the longitude array
        time = nc_fid.variables['time'][:]
        # Defining the variable array(throws error if variable is not in combined.nc)

        latli = np.argmin(np.abs(lats - minx))
        latui = np.argmin(np.abs(lats - maxx))

        lonli = np.argmin(np.abs(lons - miny))
        lonui = np.argmin(np.abs(lons - maxy))
        for timestep, v in enumerate(time):
            val = field[latli:latui,lonli:lonui,timestep]
            val = np.mean(val)
            if np.isnan(val) == False:
                dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                          calendar=lis_var['time'].calendar)
                test = dt_str + timedelta(hours=7)
                dtt = test.strftime('%Y-%m-%dT%H:%M:%SZ')
                dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                time_stamp = calendar.timegm(dt.timetuple()) * 1000
                ts_plot.append([time_stamp, float(val)])
    else:
        """Reading variables from combined.nc"""
        lats = nc_fid.variables['Latitude'][:]  # Defining the latitude array
        lons = nc_fid.variables['Longitude'][:]  # Defining the longitude array
        field = nc_fid.variables[s_var][:]  # Defning the variable array(throws error if variable is not in combined.nc)
        time = nc_fid.variables['time'][:]

        latli = np.argmin(np.abs(lats - minx))
        latui = np.argmin(np.abs(lats - maxx))

        lonli = np.argmin(np.abs(lons - miny))
        lonui = np.argmin(np.abs(lons - maxy))
        for timestep, v in enumerate(time):
            vals = field[timestep, latli:latui, lonli:lonui]
            if run_type == 'fire':
                val = np.sum(vals)
            else:
                val = np.mean(vals)
            if np.isnan(val) == False:
                dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                          calendar=lis_var['time'].calendar)
                dtt = dt_str.strftime('%Y-%m-%dT%H:%M:%SZ')
                dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                time_stamp = calendar.timegm(dt.utctimetuple()) * 1000
                ts_plot.append([time_stamp, float(val)])

    ts_plot.sort()

    geom = [round(minx, 2), round(miny, 2), round(maxx, 2), round(maxy, 2)]

    json_obj["plot"] = ts_plot
    json_obj["geom"] = geom
    if len(ts_plot) == 0:
        logger.warn("The selected polygon has no data")
    else:
        logger.info("PLOT POLYGON OBJECT : " + json.dumps(json_obj["plot"]))
    logger.info(json.dumps(json_obj["geom"]))
    return json_obj


def get_station_data():
    try:
        print("Getting ready to connect db")
        conn = psycopg2.connect(
            "dbname={0} user={1} host={2} password={3}".format(cfg.connection['dbname'], cfg.connection['user'], cfg.connection['host'],
                                                               cfg.connection['password']))
        cur = conn.cursor()
        print("Getting ready to query db")
        sql = """SELECT  DISTINCT ON (s.location) s.location, s.parameter, s.latitude, s.longitude, s.value, s.local
                    FROM    testindia s
                    WHERE   parameter='pm25'
              """
        cur.execute(sql)
        print("out from query")
        data = cur.fetchall()
        stations=[]
        for row in data:
            location = row[0]
            print("lcation ",location)
            parameter = row[1]
            latitude = row[2]
            longitude = row[3]
            pm25 = row[4]
            local = row[5]
            stations.append({
                'location': location,
                'parameter': parameter,
                'latitude': latitude,
                'longitude': longitude,
                'pm25': pm25,
                'local': local
            })
        conn.close()
        return stations
    except Exception as e:
        return ["error"]


def get_pm25_data(s_var, run_type, run_date, station, lat, lon):
    try:
        geom_data = lon+',' + lat
        print("getting ready to get pt values")
        geos_pm25_data = get_pt_values(s_var, geom_data, "station", "geos", run_date)
        print("pt values returned")
        conn = psycopg2.connect(
            "dbname={0} user={1} host={2} password={3}".format(cfg.connection['dbname'], cfg.connection['user'],
                                                               cfg.connection['host'], cfg.connection['password']))
        cur = conn.cursor()
        print("connected to db")
        # "2019-08-01 03:00:00"
        #print("run_date is ", run_date)
        #print(run_date.split('.')[0])
        date_obj = datetime.strptime(run_date.split('.')[0],"%Y%m%d")
        end_date = date_obj+timedelta(days=3)
        sd = date_obj.strftime("%Y-%m-%d %H:%M:%S")
        ed = end_date.strftime("%Y-%m-%d %H:%M:%S")
        print(sd,ed,station)
        sql="SELECT  local,value from testindia where location = '"+station+"' and value is not null \
                      and substring(local,12,2)  in ('02','05','08','11','14','17','20','23') \
                      and substring(local,1,19)  between '"+sd+"' and '" +ed+"' "
        print(sql)
        
        cur.execute(sql)
        '''              
        cur.execute(("SELECT  local,value from testindia where location = '%s' and value is not null \
                      and substring(local,12,2)  in ('02','05','08','11','14','17','20','23') \
                      and substring(local,1,19)  between '%s' and '%s'"), (str(station), sd, ed,))   # station is location,ed=end date,sd=start date
        '''
        data = cur.fetchall()
        pm25_data = {}
        ts_plot = []
        print("getting into for loop 519")
        for row in data:
            dt = row[0][0:19]
            print(dt)
            pm25 = row[1]
            dtts=datetime.strptime(dt, '%Y-%m-%dT%H:%M:%S')
            print(dtts)
            time_stamp = calendar.timegm(dtts.timetuple()) * 1000
            print(time_stamp)
            ts_plot.append([time_stamp, float(str(pm25))])
            print(ts_plot)
            
        print("after the loop 525")

        ts_plot.sort()
        pm25_data["field_data"] = ts_plot
        pm25_data["ml_pm25"] = geos_pm25_data["ml_pm25"]
        pm25_data["bc_mlpm25"] = geos_pm25_data["bc_mlpm25"]
        pm25_data["geos_pm25"] = geos_pm25_data["geos_pm25"]
        pm25_data["geom"] = geos_pm25_data["geom"]
        conn.close()
        return pm25_data
    except Exception as e:
        return ""


def generate_gif(date, variable, fps, cds):
    try:
        if fps == 'Fast':
            frames = 3
        else:
            frames = 1
        ImageFile.LOAD_TRUNCATED_IMAGES = True
        if cds == "":
            coords=[[6653078.941942, -19567.879241],[12955974.216254, 4970241.327215]]
        else:
            coords=json.loads(cds)
        times = ['01', '04', '07', '10', '13', '16', '19', '22']
        date_obj = datetime.strptime(date.split('.')[0], "%Y%m%d")
        d1 = date_obj.strftime("%Y-%m-%d")
        d2 = (date_obj+timedelta(days=1)).strftime("%Y-%m-%d")
        d3 = (date_obj + timedelta(days=2)).strftime("%Y-%m-%d")
        dt = date_obj.strftime("%Y%m%d")
        timevar = []
        imagedata = []
        for d in [d1, d2, d3]:
            for time in times:
                timevar.append(d+' '+time+':30')  # 6653078.941942,-19567.879241,12955974.216254,4970241.327215
                image_url = THREDDS_wms + '/mk_aqx/geos/' +dt+'.nc?service=WMS&request=GetMap&layers='+variable+'&styles=boxfill%2Frainbow&format=image%2Fpng&transparent=true&version=1.3.0&time='+d+'T'+time+'%3A30%3A00.000Z&colorscalerange=0%2C5&ABOVEMAXCOLOR=0x00ffff&width=700&height=700&crs=EPSG%3A3857&bbox='+str(coords[0][0])+','+str(coords[0][1])+','+str(coords[1][0])+','+str(coords[1][1])
                image_content = requests.get(image_url, verify=False).content
                imagedata.append(image_content)

        images = []
        i = 0
        if variable == 'BC_MLPM25':
            variable = 'PM 2.5'
        for filename in imagedata:
            with open(GIF_DIR+dt+'.png', 'wb') as f:
                f.write(filename)
            img = Image.open(GIF_DIR+dt+'.png').convert('RGBA')
            bg = Image.new(img.mode, img.size, img.getpixel((0, 0)))
            diff = ImageChops.difference(img, bg)
            diff = ImageChops.add(diff, diff, 2.0, -100)
            box = diff.getbbox()
            if box:
                img = img.crop(box)
            img = ImageOps.expand(img, border=20, fill='black')
            draw = ImageDraw.Draw(img)
            font = ImageFont.truetype(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                                   'public/data/agane.ttf'), 20)
            x, y = 40, 560
            draw.text((x - 1, y), variable, font=font, fill='black')
            draw.text((x + 1, y), variable, font=font, fill='black')
            draw.text((x, y - 1), variable, font=font, fill='black')
            draw.text((x, y + 1), variable, font=font, fill='black')
            x, y = 140, 560
            draw.text((x - 1, y), str(timevar[i]), font=font, fill='black')
            draw.text((x + 1, y), str(timevar[i]), font=font, fill='black')
            draw.text((x, y - 1), str(timevar[i]), font=font, fill='black')
            draw.text((x, y + 1), str(timevar[i]), font=font, fill='black')
            draw.text((40, 560), variable, (255, 255, 255), font=font)
            draw.text((140, 560), str(timevar[i]), (255, 255, 255), font=font)
            adpc_logo = Image.open(os.path.join(os.path.dirname(os.path.realpath(__file__)),'public/images/adpc.png'))
            adpc_logo = adpc_logo.convert("RGBA")
            img.paste(adpc_logo, (100, 40), adpc_logo)
            nasa_logo = Image.open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'public/images/nasa.png'))
            nasa_logo = nasa_logo.convert("RGBA")
            img.paste(nasa_logo, (40, 40), nasa_logo)
            images.append(img)
            i = i + 1
            images.append(img)

        imageio.mimsave(GIF_DIR + dt + '.gif', images, fps=frames)
        anim = ""
        with open(GIF_DIR + dt + '.gif', "rb") as f:
            data = f.read()
            anim=data.encode("base64")
        os.remove(GIF_DIR + dt + '.gif')
        os.remove(GIF_DIR + dt + '.png')
        return anim
    except Exception as e:
        return e