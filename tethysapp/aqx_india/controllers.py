"""Controller Module"""
import json
from django.shortcuts import render
from tethysapp.aqx_india.config import THREDDS_wms
from .utils import generate_variables_meta, get_styles, gen_thredds_options, get_station_data

def home(request):
    """
    Controller for the app home page.
    """

    style_opts = get_styles()
    var_options = generate_variables_meta()
    th_options = gen_thredds_options()
    #stations = get_station_data()

    context = {
        'thredds_wms_url': THREDDS_wms,
        'style_options': json.dumps(style_opts),
        'var_options': json.dumps(var_options),
        'thredds_options': json.dumps(th_options),
       # 'stations':json.dumps(stations)
    }

    return render(request, 'aqx_india/home.html', context)

