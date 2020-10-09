"""AJAX Controllers Module"""
import requests
from django.http import JsonResponse
from .utils import gen_style_legend, get_pt_values, get_poylgon_values, get_time, get_pm25_data,generate_gif
import json
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def get_ts(request):
    """Get Time Series for Point and Polygon"""

    return_obj = {}

    if request.is_ajax() and request.method == 'POST':

        variable = request.POST["variable"]
        interaction = request.POST["interaction"]
        platform = request.POST["run_type"]
        freq = request.POST["freq"]
        run_date = request.POST["run_date"]
        geom_data = request.POST["geom_data"]
    elif request.method == 'POST':
        request_wsgi = json.loads(request.body)
        variable = request_wsgi["variable"]
        interaction = request_wsgi["interaction"]
        platform = "geos"
        freq = "3dayrecent"
        run_date = request_wsgi["run_date"]+'.nc'
        geom_data = request_wsgi["geom_data"]
    """If a point is clicked on the map, get the values for graph"""
    if interaction == 'Point':
        try:
            graph = get_pt_values(variable, geom_data, freq, platform, run_date)
            print(graph)
            return_obj["data"] = graph
            return_obj["success"] = "success"
        except Exception as e:
            return_obj["error"] = "Error processing request: "+ str(e)
    """If a polygon is selected on the map, get the values for graph"""
    if interaction == 'Polygon':
        try:
            graph = get_poylgon_values(variable, geom_data, freq, platform, run_date)
            return_obj["data"] = graph
            return_obj["success"] = "success"
        except Exception as e:
            return_obj["error"] = "Error processing request: "+ str(e)
    if interaction == 'Station':
        try:
            """" splitting the location, lat, lon: location has a comma in it """
            x=geom_data.split(',')
            station = x[0] + ',' + x[1]
            lat = x[2]
            lon = x[3]
            graph = get_pm25_data(variable, platform, run_date, station, lat, lon)
            if len(graph)>0:
                return_obj["data"] = graph
                return_obj["success"] = "success"
            else:
                return_obj["error"] = "Error processing request: " + str(e)
        except Exception as e:
            return_obj["error"] = "Error processing request: " + str(e)

    return JsonResponse(return_obj)

def get_times(request):
    return_obj = {}
    if request.is_ajax() and request.method == 'POST':
        run_type = request.POST["run_type"]
        freq = request.POST["freq"]
        run_date = request.POST["run_date"]
        try:
            times = get_time(freq, run_type, run_date)
            return_obj["data"] = times
            return_obj["success"] = "success"
        except Exception as e:
            return_obj["error"] = "Error processing request: "+ str(e)

    return JsonResponse(return_obj)

def gen_legend(request):
    """Generate Legend for the Near Real Time Layers"""
    return_obj = {}

    if request.is_ajax() and request.method == 'POST':
        j_url = request.POST["url"]
        req = requests.get(j_url)
        result = req.json()
        return_obj['colors'] = result['maps'][0]['legend']['colors']
        return_obj["success"] = "success"

    return JsonResponse(return_obj)

def gen_style(request):
    """Generate Style for a selected layer"""

    return_obj = {}

    if request.is_ajax() and request.method == 'POST':
        style = request.POST["style"]
        try:
            cbar = gen_style_legend(style)
            return_obj["scale"] = cbar
            return_obj["style"] = style
            return_obj["success"] = "success"
        except Exception as e:
            return_obj["error"] = "Error processing request: " + str(e)

    return JsonResponse(return_obj)

def gen_gif(request):

    return_obj = {}
    if request.is_ajax() and request.method == 'POST':
        date = request.POST["date"]
        fps=request.POST["fps"]
        variable = request.POST["variable"]
        coords=request.POST["coords"]
        print(coords)
        animation= generate_gif(date,variable,fps,coords)
        return_obj["animation"] = animation
        return_obj["success"] = "success"

    return JsonResponse(return_obj)