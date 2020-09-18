import os
import numpy as np
import xarray as xr
from collections import defaultdict
from netCDF4 import Dataset,date2num
from config import DATA_DIR
from pathlib import Path
import sys
import datetime

def extract_date(ds):
    fname = ds['Latitude'].encoding['source'].split('/')[-1]
    date_obj = datetime.datetime.strptime(fname.split('.')[1],'%Y%m')
    ds = xr.open_dataset(ds['Latitude'].encoding['source'])
    out = ds.copy()
    out = out.drop('Latitude')
    out = out.drop('Longitude')
    out = out.expand_dims('time', axis=0)
    out['Longitude'] = ds['Longitude']
    out['Latitude'] = ds['Latitude']
    out['time'] = xr.Variable('time',[date2num(date_obj,'seconds since 1970-01-01 00:00','proleptic_gregorian')],{'units':'seconds since 1970-01-01 00:00','calendar':'proleptic_gregorian','standard_name':'standard'})
    return out

def combineYearly(input_dir,output_dir):
    input = Path(input_dir)
    m_files = [x for x in input.iterdir() if x.is_file()]
    # for file in sorted(m_files):
    #     extract_date(file)
    #     sys.exit()
    xd =xr.open_mfdataset(sorted(m_files),concat_dim='time',preprocess=extract_date)
    xd.to_netcdf(os.path.join(output_dir,'test.nc'))

#combineYearly('/home/tethys/aq_dir/fire/','/home/tethys/aq_dir/combined/')
