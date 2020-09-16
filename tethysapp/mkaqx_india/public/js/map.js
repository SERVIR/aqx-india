/*****************************************************************************
 * FILE:    AQX_INDIA MAP JS
 * DATE:    28 February 2019
 * AUTHOR: Sarva Pulla
 * MODIFIED BY: Githika Tondapu
 * COPYRIGHT: (c) NASA SERVIR 2019
 * LICENSE: BSD 2-Clause
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/
var LIBRARY_OBJECT = (function () {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library

    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
    var animationDelay,
        layersControl,
        $btnGetPlot,
        compare,
        drawnItems,
        distLayer,
        int_type,
        legend,
        lwmsLayer,
        map,
        wms_layer,
        $modalChart,
        $modalCompare,
        opacity,
        public_interface,
        rwmsLayer,
        $slider,
        $sliderContainer,
        style_options,
        sliderInterval,
        tdWmsLayer,
        thredds_options,
        stations,
        thredds_urls,
        threddss_wms_url,
        var_options,
        time_global, titleforst, coordinates, selectforGIF, guage_val, field_day1_avg, field_day2_avg, field_day3_avg,
        forecast_day1_avg, forecast_day2_avg, forecast_day3_avg, sum1 = 0, sum2 = 0,
        sum3 = 0;


    /************************************************************************
     *                    PRIVATE FUNCTION DECLARATIONS
     *************************************************************************/
    var add_wms,
        toggleLayer,
        add_compare,
        clear_coords,
        get_ts,
        get_times,
        init_dropdown,
        init_events,
        init_jquery_vars,
        init_all,
        init_map,
        init_opacity_slider,
        update_style;


    /************************************************************************
     *                    PRIVATE FUNCTION IMPLEMENTATIONS
     *************************************************************************/

    clear_coords = function () {
        $("#point-lat-lon").val('');
        $("#poly-lat-lon").val('');
        $("#shp-lat-lon").val('');
    };

    init_jquery_vars = function () {
        $slider = $("#slider");
        $sliderContainer = $("#slider-container");
        $modalChart = $("#chart-modal");
        $modalCompare = $("#compare-modal");
        $btnGetPlot = $("#btn-get-plot");
        var $meta_element = $("#metadata");
        var_options = $meta_element.attr('data-var-options');
        var_options = JSON.parse(var_options);
        style_options = $meta_element.attr('data-style-options');
        style_options = JSON.parse(style_options);
        threddss_wms_url = $meta_element.attr('data-wms-url');
        thredds_options = $meta_element.attr('data-thredds-options');
        thredds_options = JSON.parse(thredds_options);
        stations = $meta_element.attr('data-stations');
        stations = JSON.parse(stations);
    };

    init_dropdown = function () {

        $(".run_table").select2({
            minimumResultsForSearch: -1
        });
        $(".freq_table").select2({
            minimumResultsForSearch: -1
        });

        $(".model_table").select2({
            minimumResultsForSearch: -1
        });
        $(".rd_table").select2({
            minimumResultsForSearch: -1
        });
        $(".file_table").select2({
            minimumResultsForSearch: -1
        });
        $(".style_table").select2({
            minimumResultsForSearch: -1
        });
        $(".interval_table").select2({
            minimumResultsForSearch: -1
        });
        $(".var_table").select2({
            minimumResultsForSearch: -1
        });
        $(".date_table").select2({
            minimumResultsForSearch: -1
        });
        $(".year_table").select2({
            minimumResultsForSearch: -1
        });
    };

    init_map = function () {
        map = L.map('map', {
            // timeDimension: true,
            // timeDimensionControl: true
        }).setView([15.8700, 100.9925], 6);

        legend = L.control({
            position: 'bottomleft'
        });

        var timeDimension = new L.TimeDimension();
        map.timeDimension = timeDimension;

        var player = new L.TimeDimension.Player({
            loop: true,
            startOver: true
        }, timeDimension);

        var timeDimensionControlOptions = {
            player: player,
            timeDimension: timeDimension,
            position: 'bottomleft',
            autoPlay: false,
            minSpeed: 1,
            speedStep: 0.5,
            maxSpeed: 20,
            timeSliderDragUpdate: true,
            loopButton: true,
            limitSliders: true,
        };

        Date.prototype.format = function (mask, utc) {
            return dateFormat(this, mask, utc);
        };

        L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
            _getDisplayDateFormat: function (date) {
                return date.format("mmmm dd,yyyy HH:MM");
            }
        });

        drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        distLayer = L.tileLayer.betterWms('https://tethys.servirglobal.net/geoserver/wms/', {
            layers: 'utils:adm',
            format: 'image/png',
            transparent: true,
            styles: 'district',
            zIndex: 1,
        });

        var drawControlFull = new L.Control.DrawPlus({
            edit: {
                featureGroup: drawnItems,
                edit: false,
            },
            draw: {
                polyline: false,
                circlemarker: false,
                rectangle: {
                    shapeOptions: {
                        color: '#007df3',
                        weight: 4
                    }
                },
                circle: false,
                polygon: false,
                /*  shapefile: {
                      shapeOptions: {
                          color: '#007df3',
                          weight: 4,
                          opacity: 1,
                          fillOpacity: 0
                      }
                  }*/
            }
        });

        map.addControl(drawControlFull);


        // compare = L.control.sideBySide();
        // var stateChangingButton = L.easyButton({
        //     states: [{
        //         stateName: 'enable-compare', // name the state
        //         icon: 'glyphicon-resize-horizontal', // and define its properties
        //         title: 'Enable side by side comparison', // like its title
        //         onClick: function (btn, map) { // and its callback
        //             $modalCompare.modal('show');
        //             map.removeControl(compare);
        //             // compare = L.control.sideBySide(wmsLayer,wmsLayer);
        //             // compare.addTo(map);
        //             btn.state('disable-compare'); // change state on click!
        //         }
        //     }, {
        //         stateName: 'disable-compare',
        //         icon: 'glyphicon-transfer',
        //         title: 'Disable side by side comparison',
        //         onClick: function (btn, map) {
        //             map.removeControl(compare);
        //             map.removeLayer(lwmsLayer);
        //             map.removeLayer(rwmsLayer);
        //             tdWmsLayer.addTo(map);
        //             btn.state('enable-compare');
        //         }
        //     }]
        // });

        //stateChangingButton.addTo(map);
        var crosshairs_enabled = false;

        var selectAdm = L.easyButton({
            states: [{
                stateName: 'enable-compare', // name the state
                icon: 'glyphicon-globe', // and define its properties
                title: 'Select Admin Region', // like its title
                onClick: function (btn, map) { // and its callback
                    btn.state('disable-compare'); // change state on click!
                    distLayer.setOpacity(0.5);
                    distLayer.addTo(map);

                    //L.control.layers(baselayers, distLayer).addTo(map);

                    L.DomUtil.addClass(map._container, 'crosshair-cursor-enabled');
                    crosshairs_enabled = true;

                }
            }, {
                stateName: 'disable-compare',
                icon: 'glyphicon-dashboard',
                title: 'Disable Admin Region',
                onClick: function (btn, map) {
                    btn.state('enable-compare');
                    map.removeLayer(distLayer);
                    L.DomUtil.removeClass(map._container, 'crosshair-cursor-enabled');
                    crosshairs_enabled = false;

                }
            }]
        });

       // selectAdm.addTo(map);

        L.Control.InfoControl = L.Control.extend({
            initialize: function (options) {
                "use strict";
                L.Util.setOptions(this, options);
            },
            onAdd: function () {
                "use strict";
                var container = L.DomUtil.create("div", "info-control leaflet-control-attribution");
                container.innerHTML = this.options.content;
                return container;
            },
            getContent: function () {
                "use strict";
                return this.getContainer().innerHTML;
            },
            setContent: function (html) {
                "use strict";
                this.getContainer().innerHTML = html;
            }
        });

        var myIcon;
        var markersLayer = L.featureGroup().addTo(map);
        var pm25_legend = L.control({position: 'bottomright'});
        pm25_legend.onAdd = function (map) {
            function getColor(d) {
                return d === '0-25' ? "#6ef0ff" :
                    d === '26-37' ? "#24cf1b" :
                        d === '38-50' ? "#eff213" :
                            d === '51-90' ? "#eda702" :
                                "#ed1e02";
            }

            var div = L.DomUtil.create('div', 'info pm25_legend');
            var labels = ['<strong>PM2.5(&micro;gm<sup>-3</sup>)</strong>'];
            var categories = ['0-25', '26-37', '38-50', '51-90', '91 and up'];

            for (var i = 0; i < categories.length; i++) {

                div.innerHTML +=
                    labels.push(
                        '<i class="circle" style="background:' + getColor(categories[i]) + '"></i> ' +
                        (categories[i] ? categories[i] : '+'));

            }
            div.innerHTML = labels.join('<br>');
            return div;
        };
        pm25_legend.addTo(map);
        if(stations[0]=="error"){
            alert("Could not load stations from database. Please retry later.");
        }
            else {
            for (var i = 0; i < stations.length; ++i) {
                if (stations[i].pm25 > 90) {
                    myIcon = L.icon({
                        iconUrl: '/static/aqx_india/images/rr.png',
                        iconSize: [32, 32],
                        iconAnchor: [9, 21],
                        popupAnchor: [0, -50]
                    });
                } else if (stations[i].pm25 > 50 && stations[i].pm25 < 91) {
                    myIcon = L.icon({
                        iconUrl: '/static/aqx_india/images/oo.png',
                        iconSize: [32, 32],
                        iconAnchor: [9, 21],
                        popupAnchor: [0, -18]
                    });
                } else if (stations[i].pm25 > 37 && stations[i].pm25 < 51) {
                    myIcon = L.icon({
                        iconUrl: '/static/aqx_india/images/yy.png',
                        iconSize: [32, 32],
                        iconAnchor: [9, 21],
                        popupAnchor: [0, -14]
                    });

                } else if (stations[i].pm25 > 25 && stations[i].pm25 < 38) {
                    myIcon = L.icon({
                        iconUrl: '/static/aqx_india/images/gg.png',
                        iconSize: [32, 32],
                        iconAnchor: [9, 21],
                        popupAnchor: [0, -14]
                    });
                } else if (stations[i].pm25 >= 0 && stations[i].pm25 < 26) {
                    myIcon = L.icon({
                        iconUrl: '/static/aqx_india/images/bb.png',
                        iconSize: [32, 32],
                        iconAnchor: [9, 21],
                        popupAnchor: [0, -14]
                    });
                }
                var oneMarker =
                    //
                    //     [stations[i].lat,stations[i].lon],
                    //  {
                    //  	radius: 1000,
                    //     color: color
                    // });

                    L.marker([stations[i].lat, stations[i].lon], {
                        icon: myIcon
                    });
                oneMarker.bindTooltip("<b>Station:</b> " + stations[i].name + "<br>Field data for " + stations[i].latest_date + "<br> (<i>All dates and times are in Bangkok time</i>)");
                oneMarker.name = stations[i].station_id;
                oneMarker.fullname = stations[i].name;
                oneMarker.lat = stations[i].lat;
                oneMarker.lon = stations[i].lon;
                oneMarker.addTo(markersLayer);
            }
            markersLayer.on("click", markerOnClick);
            markersLayer.setZIndex(500);
        }
        function markerOnClick(e) {
            if ($("#run_table option:selected").val() == "geos") {
                var attributes = e.layer;
                int_type = "Station";
                $("#station").val(attributes.name + ',' + attributes.lat + ',' + attributes.lon);
                titleforst = attributes.fullname;
                get_ts();
            } else {
                alert("Please select GEOS as the platform to see the chart for station.")

            }

        }

        $('#toggleLayer').click(function () {
            if ($(this).is(':checked')) {
                map.addLayer(markersLayer);
                $("#swText").html("Stations turned ON");
            } else {
                map.removeLayer(markersLayer);
                $("#swText").html("Stations turned OFF");
            }
        });
        var downloadFile = L.easyButton('glyphicon-download-alt', function (btn, map) {
            var fileUrl = threddss_wms_url.replace('wms', 'fileServer');
            var rd_type = ($("#rd_table option:selected").val());

            var downUrl = fileUrl + rd_type;
            window.location = (downUrl);
        }, 'Download the NetCDF file for the current run').addTo(map);

        var nrt_date = new L.Control.InfoControl({
            position: "topright",
            content: '<div id="controls"><button id="prev">Previous Day</button><input id="date"><button id="next">Next Day</button></div>'
        });
        map.addControl(nrt_date);

        var leg = new L.Control.InfoControl({
            position: "topcenter",
            content: '<div><canvas id="canvas" style="width:20vw;height:4vh;"></canvas><canvas class="tippy hidden" id="tip" width=35 height=25></canvas></div>'
        });
        // map.addControl(leg);

        var baselayers = {};
        var today = new Date();
        var day = new Date(today.getTime());
        var day = day.toISOString().split('T')[0];

        var DATE_FORMAT = 'dd.mm.yy';
        var strToDateUTC = function (str) {
            var date = $.datepicker.parseDate(DATE_FORMAT, str);
            return new Date(date - date.getTimezoneOffset() * 60 * 1000);
        };
        var $date = $('#date');
        var now = new Date();
        var oneDay = 1000 * 60 * 60 * 24, // milliseconds in one day
            startTimestamp = now.getTime() - oneDay + now.getTimezoneOffset() * 60 * 1000,
            startDate = new Date(startTimestamp); //previous day

        $date.val($.datepicker.formatDate(DATE_FORMAT, startDate));

        var overlays = {
            'MODIS_Terra_Aerosol_Optical_Depth': L.tileLayer('//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
                '{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg', {
                layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
                bounds: [
                    [-85.0511287776, -179.999999975],
                    [85.0511287776, 179.999999975]
                ],
                minZoom: 1,
                maxZoom: 7,
                format: 'png',
                time: day,
                tileMatrixSet: 'GoogleMapsCompatible_Level9',
                opacity: opacity,
                tileSize: 256,
                subdomains: 'abc',
                noWrap: true,
                continuousWorld: true
            }),
            'MODIS_Aqua_Aerosol_Optical_Depth': L.tileLayer('//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
                '{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg', {
                layer: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
                bounds: [
                    [-85.0511287776, -179.999999975],
                    [85.0511287776, 179.999999975]
                ],
                minZoom: 1,
                maxZoom: 7,
                format: 'png',
                time: day,
                tileMatrixSet: 'GoogleMapsCompatible_Level9',
                opacity: opacity,
                tileSize: 256,
                subdomains: 'abc',
                noWrap: true,
                continuousWorld: true
            }),
            'VIIRS_SNPP_CorrectedReflectance_TrueColor': L.tileLayer('//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
                '{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg', {
                layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
                bounds: [
                    [-85.0511287776, -179.999999975],
                    [85.0511287776, 179.999999975]
                ],
                minZoom: 1,
                maxZoom: 7,
                format: 'png',
                time: day,
                tileMatrixSet: 'GoogleMapsCompatible_Level9',
                opacity: opacity,
                tileSize: 256,
                subdomains: 'abc',
                noWrap: true,
                continuousWorld: true
            }),
            'MODIS_Terra_AOD_DB_Combined': L.tileLayer("https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
                layer: 'MODIS_Terra_AOD_Deep_Blue_Combined',
                bounds: [
                    [-85.0511287776, -179.999999975],
                    [85.0511287776, 179.999999975]
                ],
                minZoom: 1,
                maxZoom: 9,
                format: 'png',
                time: day,
                TileMatrixSet: 'GoogleMapsCompatible_Level6',
                opacity: opacity,
                name: 'MODIS_Terra_Aerosol_Optical_Depth',
                subdomains: 'abc',
                noWrap: true,
                continuousWorld: true
            }),
            'MODIS_Aqua_AOD_DB_Combined': L.tileLayer("https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
                layer: 'MODIS_Aqua_AOD_Deep_Blue_Combined',
                bounds: [
                    [-85.0511287776, -179.999999975],
                    [85.0511287776, 179.999999975]
                ],
                minZoom: 1,
                maxZoom: 9,
                format: 'png',
                time: day,
                TileMatrixSet: 'GoogleMapsCompatible_Level6',
                opacity: opacity,
                name: 'MODIS_Aqua_Aerosol_Optical_Depth',
                subdomains: 'abc',
                noWrap: true,
                continuousWorld: true
            }),
            'OMPS_Aerosol_Index': L.tileLayer("https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
                layer: 'OMPS_Aerosol_Index',
                bounds: [
                    [-85.0511287776, -179.999999975],
                    [85.0511287776, 179.999999975]
                ],
                minZoom: 1,
                maxZoom: 9,
                format: 'png',
                time: day,
                TileMatrixSet: 'GoogleMapsCompatible_Level6',
                opacity: opacity,
                name: 'OMPS_Aerosol_Index',
                subdomains: 'abc',
                noWrap: true,
                continuousWorld: true
            }),
            'MODIS_Terra_AOD_Deep_Blue_Land': L.tileLayer("https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
                layer: 'MODIS_Terra_AOD_Deep_Blue_Land',
                bounds: [
                    [-85.0511287776, -179.999999975],
                    [85.0511287776, 179.999999975]
                ],
                minZoom: 1,
                maxZoom: 9,
                format: 'png',
                time: day,
                TileMatrixSet: 'GoogleMapsCompatible_Level6',
                opacity: opacity,
                name: 'MODIS_Terra_AOD_Deep_Blue_Land',
                subdomains: 'abc',
                noWrap: true,
                continuousWorld: true
            }),
            'MODIS_Aqua_AOD_Deep_Blue_Land': L.tileLayer("https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
                layer: 'MODIS_Aqua_AOD_Deep_Blue_Land',
                bounds: [
                    [-85.0511287776, -179.999999975],
                    [85.0511287776, 179.999999975]
                ],
                minZoom: 1,
                maxZoom: 9,
                format: 'png',
                time: day,
                TileMatrixSet: 'GoogleMapsCompatible_Level6',
                opacity: opacity,
                name: 'MODIS_Aqua_AOD_Deep_Blue_Land',
                subdomains: 'abc',
                noWrap: true,
                continuousWorld: true
            }),
            'FIRES_VIIRS_24': L.tileLayer.wms("https://firms.modaps.eosdis.nasa.gov/wms/?MAP_KEY=c135d300c93ef6c81f32f095073a9a7d", {
                layers: 'fires_viirs_24',
                format: 'image/png',
                transparent: true
            }),
            'FIRES_VIIRS_48': L.tileLayer.wms("https://firms.modaps.eosdis.nasa.gov/wms/?MAP_KEY=c135d300c93ef6c81f32f095073a9a7d", {
                layers: 'fires_viirs_48',
                format: 'image/png',
                transparent: true
            }),

        };
        layersControl = L.control.layers.minimap(baselayers, overlays, {
           collapsed: true
       }).addTo(map);
       L.control.browserPrint().addTo(map);
        var customActionToPrint = function (context, mode) {
            return function () {
                window.alert("Please check if any overlays are selected before you print..");
                context._printLandscape(mode);
            }
        }

        // L.control.browserPrint({
        //     title: 'Air quality Print',
        //     documentTitle: 'Air quality App with data',
        //     printLayer: wms_layer,
        //     closePopupsOnPrint: false,
        //     printModes: [L.control.browserPrint.mode("Landscape", "Landscape", "A4", customActionToPrint, false)],
        //     manualMode: false
        // }).addTo(map);

        var alterDate = function (delta) {
            var date = $.datepicker.parseDate(DATE_FORMAT, $date.val());

            $date
                .val($.datepicker.formatDate(DATE_FORMAT, new Date(date.valueOf() + delta * oneDay)))
                .change();
        }


        // Control date navigation for GIBS WMS layers, adjust the options.time and redraw. Exclude FIRE VIIRS layers (not time-enabled)
        $date.datepicker({
            dateFormat: DATE_FORMAT
        }).change(function () {
            var date = strToDateUTC(this.value);
            for (var l in overlays) {
                if (!(l.includes('FIRES_VIIRS'))) {
                    overlays[l].options.time = date.toISOString().split('T')[0];
                    overlays[l].redraw();
                }

            }
        });
            document.getElementById("prev").onclick = alterDate.bind(null, -1);
            document.getElementById("next").onclick = alterDate.bind(null, 1);

        map.on("draw:drawstart ", function (e) {
            clear_coords();
            drawnItems.clearLayers();
        });

        map.on("draw:created", function (e) {
            clear_coords();
            drawnItems.clearLayers();

            var layer = e.layer;
            layer.addTo(drawnItems);
            var feature = drawnItems.toGeoJSON();
            var type = feature.features[0].geometry.type;
            int_type = type;
            if (selectforGIF) {
                var type = e.layerType,
                    layer = e.layer;
                var southwest = layer.getBounds().getSouthWest();
                var northeast = layer.getBounds().getNorthEast();
                const proj = L.CRS.EPSG3857;

// Degrees to metres
                var ne = proj.project(new L.LatLng(northeast.lat, northeast.lng));
                var sw = proj.project(new L.LatLng(southwest.lat, southwest.lng));
                coordinates = [[sw.x, sw.y], [ne.x, ne.y]];

                // Do whatever you want with the layer.
                // e.type will be the type of layer that has been draw (polyline, marker, polygon, rectangle, circle)
                // E.g. add it to the map
                layer.addTo(map);
                selectforGIF = false;

            } else if (type == 'Point') {
                markersLayer.setZIndex(null);
                var coords = feature["features"][0]["geometry"]["coordinates"];
                $("#point-lat-lon").val(coords);
                get_ts();

            } else if (type == 'Polygon') {
                markersLayer.setZIndex(null);
                var coords = feature["features"][0]["geometry"];
                $("#poly-lat-lon").val(JSON.stringify(coords.coordinates[0]));
                get_ts();
            }

        });


        var timeDimensionControl = new L.Control.TimeDimensionCustom(timeDimensionControlOptions);
        map.addControl(timeDimensionControl);

        var mapLink = '<a href="https://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© ' + mapLink + ' Contributors',
                maxZoom: 18,
            }).addTo(map);
         L.esri.dynamicMapLayer({
            url: 'https://wwf-sight-maps.org/arcgis/rest/services/Global/Administrative_Boundaries_GADM/MapServer',
             layers:[0,1],
            opacity: 0.7,
             zIndex:99998
          }).addTo(map);
        L.esri.tiledMapLayer({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer',
             layers:[0],
            opacity: 0.7,
             zIndex:99999
          }).addTo(map);

        var wmsUrl = "https://tethys.servirglobal.net/thredds/wms/tethys/HIWAT/hkhControl_20180329-1800_latlon.nc";
        var wmsLayer = L.tileLayer.wms(wmsUrl, {
            layers: 'APCP_surface',
            format: 'image/png',
            transparent: true,
            style: 'boxfill/apcp_surface'
        });

        // Create and add a TimeDimension Layer to the map
        tdWmsLayer = L.timeDimension.layer.wms(wmsLayer);


        lwmsLayer = L.tileLayer.wms();

        rwmsLayer = L.tileLayer.wms();
    };


    init_events = function () {
        map.on("mousemove", function (event) {
            document.getElementById('mouse-position').innerHTML = 'Latitude:' + event.latlng.lat.toFixed(5) + ', Longitude:' + event.latlng.lng.toFixed(5);
        });


    };

    init_all = function () {
        init_jquery_vars();
        init_map();
        init_events();
        init_dropdown();
        init_opacity_slider();
    };

    init_opacity_slider = function () {
        opacity = 1;
       // $("#opacity").text(opacity);
        $("#opacity-slider").slider({
            value: opacity,
            min: 0,
            max: 1,
            step: 0.1, //Assigning the slider step based on the depths that were retrieved in the controller
            animate: "fast",
            slide: function (event, ui) {

            }
        });
    };


    add_wms = function (run_type, freq, run_date, var_type, rmin, rmax, styling, time = "") {
        map.removeControl(legend);
        // var wmsUrl = threddss_wms_url+sdir+'/'+file_name;
        var wmsUrl = threddss_wms_url + run_date;

        wms_layer = wmsUrl;
        // map.removeLayer(wms_layer);
        map.removeLayer(tdWmsLayer);
        var index = find_var_index(var_type, var_options);
        //gen_color_bar(var_options[index]["colors_list"],scale);
        var layer_id = var_options[index]["id"];
        var range = (rmin ? rmin : '0') + ',' + (rmax ? rmax : '5');

        var style = 'boxfill/' + styling;
        opacity = $('#opacity-slider').slider("option", "value");
        if(time!="") {
           var d = new Date(time);

            d.setHours(d.getHours() - 7);
            time = d.toISOString();
        }
        var wmsLayer = L.tileLayer.wms(wmsUrl, {
            layers: var_type,
            format: 'image/png',
            time: time,
            transparent: true,
            styles: style,
            colorscalerange: range,
            opacity: opacity,
            version: '1.3.0',
            zIndex: 100,
            ABOVEMAXCOLOR:'extend',
            BELOWMINCOLOR:'extend'

        });

        if (time == "") {
            wmsLayer = L.tileLayer.wms(wmsUrl, {
                layers: var_type,
                format: 'image/png',
                transparent: true,
                styles: style,
                colorscalerange: range,
                opacity: opacity,
                version: '1.3.0',
                zIndex: 100,
                ABOVEMAXCOLOR:'extend',
                BELOWMINCOLOR:'extend'
            });
        }
        tdWmsLayer = L.timeDimension.layer.wms(wmsLayer, {
            updateTimeDimension: true,
            setDefaultTime: true,
            cache: 365,
            zIndex: 100,
        });
        tdWmsLayer.addTo(map);
        var link = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + layer_id + "&time=" +time + "&colorscalerange=" + range + "&PALETTE=" + styling + "&transparent=TRUE";
         var imgsrc = link;

        if (time == "") {

            link = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + layer_id + "&colorscalerange=" + range + "&PALETTE=" + styling + "&transparent=TRUE";
            imgsrc = link;
        }


        legend.onAdd = function (map) {
            var src = imgsrc;
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML +=
                '<img src="' + src + '" alt="legend">';
            return div;
        };
        legend.addTo(map);

    };

    function gen_chart(field_val, forecast_val) {
        var myConfig = {
            type: "gauge",
            legend: {
                  align: 'center',
               offsetY:260


            },
            scaleR: {
                "aperture": 200,
                "values": "0:99:3",
                center: {
                    "size": 10,
                    "background-color": "#66CCFF #FFCCFF",
                    "border-color": "none"
                },
                labels: ['0', '', '', '', '12', '', '', '', '24', '', '', '', '36', '', '', '', '48', '', '', '', '60', '', '', '', '72', '', '', '', '84', '', '', '', '', 'Max'],
                item: {  //Scale Label Styling
                    "font-color": "black",
                    "font-family": "Arial",
                    "font-size": 12,
                    "font-weight": "bold",   //or "normal"
                    "font-style": "normal",   //or "italic"
                    "offset-r": 0,
                    "angle": "auto"
                },

                ring: {  //Ring with Rules
                    "size": 20,
                    "rules": [
                        {
                            "rule": "%v >= 0 && %v < 25",
                            "background-color": "#6ef0ff"
                        },
                        {
                            "rule": "%v >= 25 && %v < 37",
                            "background-color": "#24cf1b"
                        },
                        {
                            "rule": "%v >= 37 && %v < 50",
                            "background-color": "#eff213"
                        },
                        {
                            "rule": "%v >= 50 && %v < 90",
                            "background-color": "#eda702"
                        },
                        {
                            "rule": "%v >= 90",
                            "background-color": "#ed1e02"
                        }
                    ]
                }
            },
            series: [
                {
                    values: [Math.round(field_val) >= 99 ? 99 : Math.round(field_val)], // starting value
                    // backgroundColor: 'black',
                    // indicator: [5, 5, 5, 5, 0.75],
                    animation: {
                        effect: 2,
                        method: 1,
                        sequence: 4,
                        speed: 900
                    },
                    csize: "7%",     //Needle Width
                    size: "90%",    //Needle Length
                    'background-color': "blue",  //Needle Color
                    text: "PM2.5 Measurement"
                },
                {
                    values: [Math.round(forecast_val) >= 99 ? 99 : Math.round(forecast_val)],
                    animation: {
                        effect: 2,
                        method: 1,
                        sequence: 4,
                        speed: 700
                    },
                    csize: "7%",
                    size: "90%",
                    'background-color': "green",
                    text: "PM2.5 Forecast"
                }


            ]
        };

        zingchart.render({
            id: 'guage_chart',
            data: myConfig,
            height: 350,
            width: '100%'
        });
    }

    get_ts = function () {
        var interaction = int_type;
        if (interaction == "Station") {
            //console.log("station");
        } else if ($("#poly-lat-lon").val() == "" && $("#point-lat-lon").val() == "" && $("#shp-lat-lon").val() == "") {
            // $('.error').html('<b>No feature selected. Please create a feature using the map interaction dropdown. Plot cannot be generated without a feature.</b>');
            return false;
        } else {
            $('.error').html('');
        }


        var run_type = ($("#run_table option:selected").val());
        var freq = ($("#freq_table option:selected").val());
        var rd_type = ($("#rd_table option:selected").text());
        var var_type = ($("#var_table option:selected").val());
        var z = rd_type.split('/').reverse()[0];
        var y = ($("#date_table option:selected").val());
        if (($("#date_table option:selected").val()) != undefined)
            rd_type = rd_type.replace(z, y.split('/').reverse()[0]);
        if (interaction == "Point") {
            var geom_data = $("#point-lat-lon").val();
            //console.log(geom_data);

        } else if (interaction == "Polygon") {
            var geom_data = $("#poly-lat-lon").val();
        } else if (interaction == "Station") {
            var geom_data = $("#station").val();


        }

        $modalChart.modal('show');
        $("#cube").removeClass('hidden');
        $("#plotter").addClass('hidden');
        var serieses = [];

        var xhr = ajax_update_database("get-ts", {
            "variable": var_type,
            "run_type": run_type,
            "freq": freq,
            "run_date": rd_type,
            "interaction": interaction,
            "geom_data": geom_data
        });


        //  var secondday = rd_type.substring(0, 4) + '-' + rd_type.substring(4, 6) + '-' + (((parseInt(rd_type.substring(6, 8)) + 1).toString().length < 2) ? ('0' + (parseInt(rd_type.substring(6, 8)) + 1)) : (parseInt(rd_type.substring(6, 8)) + 1));
        //   var thirdday = rd_type.substring(0, 4) + '-' + rd_type.substring(4, 6) + '-' + (((parseInt(rd_type.substring(6, 8)) + 2).toString().length < 2) ? ('0' + (parseInt(rd_type.substring(6, 8)) + 2)) : (parseInt(rd_type.substring(6, 8)) + 2));
        xhr.done(function (result) {
            if ("success" in result) {
                if (interaction == "Station") {

                    var values = result.data["field_data"];
                    var forecast_values = result.data["bc_mlpm25"];
                    var firstday = rd_type.substring(0, 4) + '-' + rd_type.substring(4, 6) + '-' + rd_type.substring(6, 8);
                    var d1 = new Date(firstday);
                    var date1 = d1.toISOString().split('T')[0];
                    d1.setDate(d1.getDate() + 1);
                    var d2 = new Date(firstday)
                    d2.setDate(d2.getDate() + 2);
                    var secondday = d1.toISOString().split('T')[0];
                    var thirdday = d2.toISOString().split('T')[0];
                    // document.getElementById("firstday").innerHTML = date1;
                    // document.getElementById("secondday").innerHTML = secondday;
                    // document.getElementById("thirdday").innerHTML = thirdday;
                    document.getElementById("day1_guage").innerHTML = date1;
                    document.getElementById("day2_guage").innerHTML = secondday;
                    document.getElementById("day3_guage").innerHTML = thirdday;

                    //     populateValues(values);
                    field_day1_avg = 0
                    field_day2_avg = 0;
                    field_day3_avg = 0;

                    forecast_day1_avg = 0
                    forecast_day2_avg = 0;
                    forecast_day3_avg = 0;
                    sum1 = 0, sum2 = 0, sum3 = 0;
                    var count1 = 0, count2 = 0, count3 = 0
                    for (var i = 0; i < 8; i++) {
                        if (values[i] != -1) count1 = count1 + 1;
                        if (values[i + 8] != -1) count2 = count2 + 1;
                        if (values[i + 16] != -1) count3 = count3 + 1;

                        sum1 = sum1 + (values[i] ? values[i][1] : 0);
                        sum2 = sum2 + (values[i + 8] ? values[i + 8][1] : 0);
                        sum3 = sum3 + (values[i + 16] ? values[i + 16][1] : 0);

                    }
                    field_day1_avg = sum1 / count1;
                    field_day2_avg = sum2 / count2;
                    field_day3_avg = sum3 / count3;
                    sum1 = 0, sum2 = 0, sum3 = 0;
                    count1 = 0, count2 = 0, count3 = 0
                    for (var i = 0; i < 8; i++) {

                        if (i >= 2 && forecast_values[i] != -1) {
                            count1 = count1 + 1;
                            sum1 = sum1 + (forecast_values[i] ? forecast_values[i][1] : 0);
                        }
                        if (forecast_values[i + 8] != -1) count2 = count2 + 1;
                        sum2 = sum2 + (forecast_values[i + 8] ? forecast_values[i + 8][1] : 0);
                        if ((i + 16) < 22 && forecast_values[i + 16] != -1) {
                            count3 = count3 + 1;
                            sum3 = sum3 + (forecast_values[i + 16] ? forecast_values[i + 16][1] : 0);
                        }


                    }
                    forecast_day1_avg = sum1 / count1;
                    forecast_day2_avg = sum2 / count2;
                    forecast_day3_avg = sum3 / count3;

                    //console.log("station");
                    gen_chart(field_day1_avg < 0 ? -1 : field_day1_avg, forecast_day1_avg < 0 ? -1 : forecast_day1_avg);
                    document.getElementById("datevalue").innerHTML = document.getElementById("day1_guage").innerHTML;
                      document.getElementById("fromd").innerHTML = document.getElementById("day1_guage").innerHTML+" 08:30";
            document.getElementById("tod").innerHTML = document.getElementById("day1_guage").innerHTML+" 23:30";
                    $("#day1_guage").css("background-color", "black");
                    $("#day1_guage").css("color", "white");
                    $("#day2_guage").css("background-color", "gray");
                    $("#day2_guage").css("color", "white");
                    $("#day3_guage").css("background-color", "gray");
                    $("#day3_guage").css("color", "white");
                }

                var arr = [];
                var title = "";
                var index = find_var_index(var_type, var_options);
                var display_name = var_options[index]["display_name"];
                var units = var_options[index]["units"];
                if (units == 'mcgm-3') {
                    units = '&micro;gm<sup>-3</sup>';
                }

                if (interaction == "Station") {
                    document.getElementsByClassName("forpm25")[0].style.display = 'table';
                    document.getElementsByClassName("forpm25")[1].style.display = 'table';
                    // document.getElementsByClassName("forpm25")[2].style.display = 'table';
                    // document.getElementsByClassName("forpm25")[2].style.width = 'inherit';
                    document.getElementById("chartonly").style.width = '50%';
                    document.getElementById("modalchart").style.width = "60%";
                    document.getElementById("modalchart").style.display = "flex";
                    document.getElementById("modalchart").style.alignItems = "center";
                    document.getElementById("modalchart").style.justifyContent = "center";
                    serieses = [
                        // {
                        //     data: result.data["ml_pm25"],
                        //     name: "ML PM25 data",
                        //     color: "brown",
                        //     marker: {
                        //         enabled: true,
                        //         radius: 3
                        //     }
                        // },
                     {
                            data: result.data["field_data"],
                            name: "PM2.5 Measurement",
                            color: "blue"
                        },
                        {
                            data: result.data["bc_mlpm25"],
                            name: "BC MLPM25 data",//
                            color: "green"
                        },
                          // {
                          //      data: result.data["geos_pm25"],
                          //      name: "GEOS PM25 data",
                          //      color: "red"
                          //  }
                    ];
                    document.getElementById('pmlabel').style.display="block";
                } else {

                    document.getElementsByClassName("forpm25")[0].style.display = 'none';
                    document.getElementsByClassName("forpm25")[1].style.display = 'none';
                    //          document.getElementsByClassName("forpm25")[2].style.display = 'none';
                    document.getElementById("chartonly").style.width = '100%';
                    document.getElementById("modalchart").style.width = "";
                    document.getElementById("modalchart").style.display = "";
                    document.getElementById("modalchart").style.alignItems = "";
                    document.getElementById("modalchart").style.justifyContent = "";
                    serieses = [{
                        data: result.data["plot"],
                        name: display_name,
                        color: "black",
                        marker: {
                            enabled: true,
                            radius: 3
                        }
                    }];
                    document.getElementById('pmlabel').style.display="none";
                }
                if (interaction == "Station") {

                    arr = [{
                        color: "#6ef0ff",
                        from: 0,
                        to: 25
                    },
                        {
                            color: "#24cf1b",
                            from: 25,
                            to: 37
                        },
                        {
                            color: "#eff213",
                            from: 37,
                            to: 50
                        },
                        {
                            color: "#eda702",
                            from: 50,
                            to: 90
                        },
                        {
                            color: "#ed1e02",
                            from: 90,
                            to: 200
                        }];
                    title = "PM2.5 values at " + titleforst;

                } else {
                    arr = [];
                    title = $("#var_table option:selected").text() + " values at " + result.data["geom"];
                }
                $('.error').html('');
                $('#plotter').highcharts({
                    chart: {
                        type: 'spline',
                        zoomType: 'x',
                        events: {
                            load: function () {
                                var label = this.renderer.label($("#run_table option:selected").val()=="geos"?"Graph dates and times are in Bangkok time":"Graph dates and times are in UTC time")
                                    .css({
                                        width: '400px',
                                        fontSize: '12px'
                                    })
                                    .attr({
                                        'stroke': 'silver',
                                        'stroke-width': 1,
                                        'r': 2,
                                        'padding': 5
                                    })
                                    .add();

                                label.align(Highcharts.extend(label.getBBox(), {
                                    align: 'center',
                                    x: 20, // offset
                                    verticalAlign: 'bottom',
                                    y: 0 // offset
                                }), null, 'spacingBox');

                            }
                        },
                        paddingBottom: 50
                    },
                    tooltip: {
                        backgroundColor: '#FCFFC5',
                        borderColor: 'black',
                        borderRadius: 10,
                        borderWidth: 3
                    },
                    title: {
                        text: title,
                        style: {
                            fontSize: '14px'
                        }
                    },
                    xAxis: {
                        type: 'datetime',
                        labels: {
                            format: '{value: %Y-%m-%d}'
                            // rotation: 45,
                            // align: 'left'
                        },
                        title: {
                            text: 'Date'
                        }
                    },
                    legend: {
                        align: 'center',
                        verticalAlign: 'bottom',
                        y: -25
                    },
                    yAxis: {
                        title: {
                            useHTML: true,
                            text: units
                        },
                        plotBands: arr,

                    },
                    plotOptions: {
                        series: {
                            color: "black"
                        }
                    },
                    exporting: {
                        enabled: true
                    },
                    series: serieses

                });
                $("#cube").addClass('hidden');
                $("#plotter").removeClass('hidden');


            } else {
                $("#cube").addClass('hidden');
                $(".error").html('<h3>Error Processing Request.</h3>');

                $('.forpm25').hide();
                 $('#pmlabel').hide();

            }
        });


    };

    $("#btn-get-plot").on('click', get_ts);
    $(".mod_link").on('click', get_ts);


    // add_compare = function () {
    //     map.removeLayer(tdWmsLayer);
    //     map.removeLayer(lwmsLayer);
    //     map.removeLayer(rwmsLayer);
    //     $modalCompare.modal('hide');
    //     var style = ($("#cstyle_table option:selected").val());
    //     var l_date = $("#lrd_table option:selected").val();
    //     var l_var = $("#lvar_table option:selected").val();
    //     var r_date = $("#rrd_table option:selected").val();
    //     var r_var = $("#rvar_table option:selected").val();
    //
    //     var lwmsUrl = threddss_wms_url + l_date;
    //     var rwmsUrl = threddss_wms_url + r_date;
    //
    //     var range = $("#crange-min").val() + ',' + $("#crange-max").val();
    //     // map.removeLayer(wms_layer);
    //     // var lindex = find_var_index(l_var,var_options);
    //     // var rindex = find_var_index(r_var,var_options);
    //
    //     // var layer_id = var_options[index]["id"];
    //     // var lrange = var_options[lindex]["min"]+','+var_options[lindex]["max"];
    //     // var rrange = var_options[rindex]["min"]+','+var_options[rindex]["max"];
    //     var styling = 'boxfill/' + ($("#cstyle_table option:selected").val());
    //     opacity = $('#opacity-slider').slider("option", "value");
    //
    //     lwmsLayer = L.tileLayer.wms(lwmsUrl, {
    //         layers: l_var,
    //         format: 'image/png',
    //         transparent: true,
    //         styles: styling,
    //         colorscalerange: range,
    //         opacity: opacity,
    //         version: '1.3.0'
    //     });
    //
    //     rwmsLayer = L.tileLayer.wms(rwmsUrl, {
    //         layers: r_var,
    //         format: 'image/png',
    //         transparent: true,
    //         styles: styling,
    //         colorscalerange: range,
    //         opacity: opacity,
    //         version: '1.3.0'
    //     });
    //
    //     lwmsLayer.addTo(map);
    //     rwmsLayer.addTo(map);
    //     compare = L.control.sideBySide(lwmsLayer, rwmsLayer);
    //    // compare.addTo(map);
    //
    // };
  //  $("#btn-add-compare").on('click', add_compare);

    function handleMouseMove(e, ctx, width, height) {
        $('.tippy').removeClass('hidden');

        function reOffset() {
            var BB = canvas.getBoundingClientRect();
            offsetX = BB.left;
            offsetY = BB.top;
        }

        var offsetX, offsetY;
        reOffset();
        // tell the browser we're handling this event
        e.preventDefault();
        e.stopPropagation();

        var mouseX = parseInt(e.clientX - offsetX);
        var mouseY = parseInt(e.clientY - offsetY);
        var rmin = $("#range-min").val();
        var rmax = $("#range-max").val();

        var factor = Number(rmax - rmin) / Number(width);
        var htext = mouseX * factor;
        // console.log(rmin,rmax,factor,width,htext);
        var tipCanvas = document.getElementById("tip");
        var tipCtx = tipCanvas.getContext("2d");
        tipCanvas.style.left = (mouseX + 20) + "px";
        tipCanvas.style.top = (mouseY + 20) + "px";
        tipCtx.clearRect(0, 0, tipCanvas.width, tipCanvas.height);
        tipCtx.fillText(htext.toFixed(2), 5, 15);
    }

    update_style = function (style) {
        var xhr = ajax_update_database("gen-style", {
            "style": style
        });

        xhr.done(function (result) {
            if ("success" in result) {
                // var cv  = document.getElementById('cv'),
                //     ctx = cv.getContext('2d');
                // ctx.clearRect(0,0,cv.width,cv.height);
                // var height = cv.height;
                // var width = cv.width;
                // var w = width / result['scale'].length;
                // var percent = 1 / result['scale'].length;
                // var gradient = ctx.createLinearGradient(0,0, width,0);
                // result['scale'].forEach(function(color,i){
                //     gradient.addColorStop(percent*i,'rgb('+color+')');
                // });
                // // gradient.addColorStop(1, 'black');
                // ctx.fillStyle = gradient;
                // ctx.fillRect(0,0,width,height);
                // $("#canvas").mousemove(function(e){handleMouseMove(e,ctx,width,height);});
                // $("#canvas").mouseout(function(e){
                //     e.preventDefault();
                //     e.stopPropagation();
                //     $('.tippy').addClass('hidden')});
                //
                //
                //
                // var rmin = $("#range-min").val();
                // var rmax = $("#range-max").val();
                // var factor = (rmax - rmin) / 5;
                // var wt = width / 6;
                // ctx.fillStyle = '#000';
                // for (var i = 0; i <= 6; i++) {
                //     var num = Number(rmin) + Number(i*factor);
                //     ctx.font = "20px Georgia";
                //     ctx.fillText(num,Number(i*(wt)),height+50);
                // }


            }
        });
    };

    L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({

        onAdd: function (map) {
            // Triggered when the layer is added to a map.
            //   Register a click listener, then do all the upstream WMS things
            L.TileLayer.WMS.prototype.onAdd.call(this, map);
            map.on('click', this.getFeatureInfo, this);
        },

        onRemove: function (map) {
            // Triggered when the layer is removed from a map.
            //   Unregister a click listener, then do all the upstream WMS things
            L.TileLayer.WMS.prototype.onRemove.call(this, map);
            map.off('click', this.getFeatureInfo, this);
        },

        getFeatureInfo: function (evt) {
            // Make an AJAX request to the server and hope for the best
            var url = this.getFeatureInfoUrl(evt.latlng),
                showResults = L.Util.bind(this.showGetFeatureInfo, this);
            $.ajax({
                url: url,
                success: function (data, status, xhr) {
                    var err = typeof data === 'string' ? null : data;
                    showResults(err, evt.latlng, data);
                },
                error: function (xhr, status, error) {
                    console.log('error');
                    showResults(error);
                }
            });
        },

        getFeatureInfoUrl: function (latlng) {
            // Construct a GetFeatureInfo request URL given a point
            var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
                size = this._map.getSize(),

                params = {
                    request: 'GetFeatureInfo',
                    service: 'WMS',
                    srs: 'EPSG:4326',
                    styles: this.wmsParams.styles,
                    transparent: this.wmsParams.transparent,
                    version: this.wmsParams.version,
                    format: this.wmsParams.format,
                    bbox: this._map.getBounds().toBBoxString(),
                    height: size.y,
                    width: size.x,
                    layers: this.wmsParams.layers,
                    query_layers: this.wmsParams.layers,
                    info_format: 'application/json'
                };
            params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
            params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;

            return this._url + L.Util.getParamString(params, this._url, true);
        },

        showGetFeatureInfo: function (err, latlng, content) {
            var coords = content.features[0]["geometry"];
            $("#poly-lat-lon").val(JSON.stringify(coords));
            int_type = 'Polygon';
            var ccontent = '<table border="1" style="overflow-x:auto;" class="table table-sm"><tbody><tr><th>Country</th><th>Admin 1</th><th>Admin 2</th><th>Admin 3</th></tr>' + '<tr><td>' + content.features[0].properties.NAME_0 + '</td><td>' + content.features[0].properties.NAME_1 + '</td><td>' + content.features[0].properties.NAME_2 + '</td><td>' + content.features[0].properties.NAME_3 + '</td></tr></tbody></table><button type="button" class="mod_link btn-primary" id="btn-get-wms-plot" data-geom="' + JSON.stringify(coords) + '">Get Plot</button>';
            // Otherwise show the content in a popup, or something.
            L.popup({
                maxWidth: 800
            })
                .setLatLng(latlng)
                .setContent(ccontent)
                .openOn(this._map);

            $('.mod_link').on('click', get_ts);
        }
    });

    L.tileLayer.betterWms = function (url, options) {
        return new L.TileLayer.BetterWMS(url, options);
    };

    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/

    public_interface = {};

    /************************************************************************
     *                  INITIALIZATION / CONSTRUCTOR
     *************************************************************************/

    // Initialization: jQuery function that gets called when
    // the DOM tree finishes loading
    $(function () {
        init_all();
        var monthoptions = {
            pattern: 'mmm yyyy',
            startYear: 2000,
            finalYear: 2018,
        };
        $('.monthpicker').monthpicker(monthoptions);
        $('.monthpicker').monthpicker().bind('monthpicker-change-year', function (e, year) {
            $('.monthpicker').monthpicker('disableMonths', []); // (re)enables all

            if (year === '2000') {
                $('.monthpicker').monthpicker('disableMonths', [1, 2, 3, 4, 5, 6, 7, 8, 9]);
            }
            if (year === '2018') {
                $('.monthpicker').monthpicker('disableMonths', [10, 11, 12]);
            }
        }).change();

        $('.monthpicker').bind('click', function () {
            $('.monthpicker').monthpicker('show');
        });
        style_options['colors'].forEach(function (item, i) {
            var new_option = new Option(item[0], item[1]);
            var noption = new Option(item[0], item[1]);
            $("#style_table").append(new_option);
            $("#cstyle_table").append(noption);
             if (item[0].toUpperCase() == "PM25") {
                    new_option.selected = true;
                }
        });
 var aodt_dname="",aodt_val="",aoda_dname="",aoda_val="",geos_dname="",geos_val="",fire_dname="",fire_val="";
        $.each(thredds_options['catalog'], function (item, i) {

            if (item.toUpperCase() != "GEOS_TAVG1_2D_SLV_NX" && item.toUpperCase() != "GEOS_TAVG3_2D_AER_NX") {

                if(item=="aod_aqua"){ aoda_dname="AOD Observations (AQUA-Monthly)";aoda_val=item;}
                if(item=="aod_terra"){ aodt_dname="AOD Observations (TERRA-Monthly)";aodt_val=item;}
                if(item=="fire") {fire_dname="Fire Observations (Monthly)";fire_val=item;}
                if(item=="geos"){ geos_dname="AQ Forecast (GEOS)";geos_val=item;}


            //    var new_option = new Option(dname, item);
           //     var noption = new Option(dname, item);
              //  var noption2 = new Option(dname, item);
                // $("#run_table").append(new_option);
                // $("#lrun_table").append(noption);
                // $("#rrun_table").append(noption2);

            }

        });
          var new_option = new Option(geos_dname, geos_val);
          var new_option1 = new Option(geos_dname, geos_val);
          var new_option2 = new Option(geos_dname, geos_val);
              $("#run_table").append(new_option);
                $("#lrun_table").append(new_option1);
                 $("#rrun_table").append(new_option2);
                           new_option = new Option(fire_dname, fire_val);
                                                      new_option1 = new Option(fire_dname, fire_val);
                           new_option2 = new Option(fire_dname, fire_val);

                                         $("#run_table").append(new_option);
                                          $("#lrun_table").append(new_option1);
                                                           $("#rrun_table").append(new_option2);



                           new_option = new Option(aoda_dname, aoda_val);
                           new_option1 = new Option(aoda_dname, aoda_val);
                           new_option2 = new Option(aoda_dname, aoda_val);
                                         $("#run_table").append(new_option);
                                          $("#lrun_table").append(new_option1);
                                                           $("#rrun_table").append(new_option2);

                                          new_option = new Option(aodt_dname, aodt_val);
                                            new_option1 = new Option(aodt_dname, aodt_val);
                           new_option2 = new Option(aodt_dname, aodt_val);
                                         $("#run_table").append(new_option);
                                          $("#lrun_table").append(new_option1);
                                                           $("#rrun_table").append(new_option2);


        $("#run_table").change(function () {
            var run_type = ($("#run_table option:selected").val());
            $("#freq_table").html('');
            $("#lrd_table").html('');
            $("#rrd_table").html('');
            $("#lvar_table").html('');
            $("#rvar_table").html('');
            $.each(thredds_options['catalog'][run_type], function (item, i) {
                if (run_type != "geos") {
                    $('#date_table').prop('disabled', 'disabled');
                    $('#hour_table').prop('disabled', 'disabled');
                    // $('#download_gif').hide();
                    // $('#select_area').hide();
                    // $('#animation_speed').hide();

                } else {
                    $('#date_table').prop('disabled', false);
                    $('#hour_table').prop('disabled', false);
                    // $('#download_gif').show();
                    // $('#select_area').show();
                    // $('#animation_speed').show();

                }

                if ((item == '3daytoday' || item == '3dayrecent') && (run_type == "geos")) {

                    var new_option = new Option(item, item);
                    $("#freq_table").append(new_option);
                } else if (item == 'combined') {

                    var new_option = new Option(item, item);
                    $("#freq_table").append(new_option);
                }
            });
            $("#freq_table").trigger('change');
            if (thredds_options['catalog'][run_type]['monthly']) {
                thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
                    var opt = item.split('/').reverse()[0];
                    var new_option = new Option(opt, item);
                    var noption = new Option(opt, item);
                    $("#lrd_table").append(new_option);
                    $("#rrd_table").append(noption);
                });
            }

            var_options.forEach(function (item, i) {
                if (item["category"] == run_type) {
                    var new_option = new Option(item["display_name"]);
                    // +' ('+item["units"]+')'
                    var noption = new Option(item["display_name"], item["id"]);
                    $("#lvar_table").append(new_option);
                    $("#rvar_table").append(noption);

                }
            });

        }).change();

        $("#lrun_table").change(function () {
            var run_type = ($("#lrun_table option:selected").val());

            $("#lrd_table").html('');
            $("#lvar_table").html('');
            if (thredds_options['catalog'][run_type]['monthly']) {
                thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
                    var opt = item.split('/').reverse()[0];
                    var new_option = new Option(opt, item);
                    $("#lrd_table").append(new_option);
                });
            }
            var_options.forEach(function (item, i) {
                if (item["category"] == run_type) {
                    var new_option = new Option(item["display_name"], item["id"]);
                    $("#lvar_table").append(new_option);
                }
            });

        }).change();

        $("#rrun_table").change(function () {
            var run_type = ($("#rrun_table option:selected").val());

            $("#rrd_table").html('');
            $("#rvar_table").html('');

            if (thredds_options['catalog'][run_type]['monthly']) {
                thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
                    var opt = item.split('/').reverse()[0];
                    var new_option = new Option(opt, item);
                    $("#rrd_table").append(new_option);
                });
            }
            var_options.forEach(function (item, i) {
                if (item["category"] == run_type) {
                    var new_option = new Option(item["display_name"], item["id"]);
                    $("#rvar_table").append(new_option);
                }
            });

        }).change();

        $("#freq_table").change(function () {
            var freq = ($("#freq_table option:selected").val());
            var run_type = ($("#run_table option:selected").val());

            $("#rd_table").html('');
            $("#var_table").html('');
            if (thredds_options['catalog'][run_type][freq]) {
                thredds_options['catalog'][run_type][freq].forEach(function (item, i) {
                    var opt = item.split('/').reverse()[0];
                    var new_option = new Option(opt, item);
                    $("#rd_table").append(new_option);
                });

                $("#rd_table").trigger('change');
            } else {
                alert('no data available')
            }
        }).change();


        get_times = function (rd_type) {

            var freq = ($("#freq_table option:selected").val());
            var run_type = ($("#run_table option:selected").val());

            var xhr = ajax_update_database("get-times", {
                "run_type": run_type,
                "freq": freq,
                "run_date": rd_type.split('/').reverse()[0]
            });
             var times=[];
            xhr.done(function (result) {
                if ("success" in result) {
                     times = result.data["times"];
                    time_global = times[0];
                      $("#hour_table").html('');
                    times.forEach(function (time, i) {
                        var date= new Date(time);
                        date.setHours(date.getHours() + 7 );
                        var opt = new Option(date.toISOString().substring(0, 10)+' '+date.toISOString().substring(11,19), date.toISOString());
                        $("#hour_table").append(opt);
                    });
                } else {

                }
            });
        };
        $("#rd_table").change(function () {
            $("#date_table").empty();
            $("#hour_table").empty();

            var freq = ($("#freq_table option:selected").val());
            var run_type = ($("#run_table option:selected").val());
            var rd_type = ($("#rd_table option:selected").val());
            var str = rd_type.split('/').reverse()[0];

            // console.log(thredds_options['catalog'][run_type][freq]);
            var date_arr=thredds_options['catalog'][run_type][freq];
            var date_arr_sorted=date_arr.sort().reverse();
            date_arr_sorted.forEach(function (item, i) {

                var opt = item.split('/').reverse()[0];
                var newdate = opt.substring(0, 4) + '-' + opt.substring(4, 6) + '-' + opt.substring(6, 8)+" 07:00:00";
                if (run_type == "geos") {
                    var new_option2 = new Option(newdate, item);

                    $("#date_table").append(new_option2);
                }

            });




            $("#var_table").html('');

            var_options.forEach(function (item, i) {
                if (item["category"] == run_type) {
                    var value = item["display_name"];
                    var new_option = new Option(value, item["id"]);
                    $("#var_table").append(new_option);
                      if (item["id"].toUpperCase() == "BC_MLPM25") {
                    new_option.selected = true;
                }
                }
            });

            $("#var_table").trigger('change');

        }).change();

        $("#date_table").change(function () {
            var run_type = ($("#run_table option:selected").val());
            if (run_type == "geos") {
                var datestr = ($("#date_table option:selected").val().split('/').reverse()[0]);
                datestr = datestr.substring(0, 4) + '-' + datestr.substring(4, 6) + '-' + datestr.substring(6, 8);
                $('#info').text("Displaying " + datestr + " data on the map..");


                var freq = ($("#freq_table option:selected").val());
                var rd_type = ($("#rd_table option:selected").val());
                var z = rd_type.split('/').reverse()[0];

                var y = ($("#date_table option:selected").val());
                rd_type = rd_type.replace(z, y.split('/').reverse()[0]);
                var var_type = ($("#var_table option:selected").val());
                var style = ($("#style_table option:selected").val());
                update_style(style);
                var rmin = $("#range-min").val();
                var rmax = $("#range-max").val();
                add_wms(run_type, freq, rd_type, var_type, rmin, rmax, style, datestr + 'T08:30:00Z');

  $("#hour_table").html('');
         get_times(rd_type);

            }

        });

        $("#hour_table").change(function () {
            var run_type = ($("#run_table option:selected").val());
            if (run_type == "geos") {
                var freq = ($("#freq_table option:selected").val());
                var rd_type = ($("#rd_table option:selected").val());
                var z = rd_type.split('/').reverse()[0];
                var y = ($("#date_table option:selected").val());
                rd_type = rd_type.replace(z, y.split('/').reverse()[0]);
                var var_type = ($("#var_table option:selected").val());
                var style = ($("#style_table option:selected").val());
                update_style(style);
                var rmin = $("#range-min").val();
                var rmax = $("#range-max").val();
                add_wms(run_type, freq, rd_type, var_type, rmin, rmax, style, ($("#hour_table option:selected").val()));

            }
        });

        $("#var_table").change(function () {
            var var_type = ($("#var_table option:selected").val());
            var index = find_var_index(var_type, var_options);
            $("#range-min").val(var_options[index]["min"]);
            $("#range-max").val(var_options[index]["max"]);
            $("#style_table").trigger('change');
            if (typeof int_type !== 'undefined') {
                get_ts();
            }
        }).change();

        $("#rvar_table").change(function () {
            var var_type = ($("#rvar_table option:selected").val());
            var index = find_var_index(var_type, var_options);
            $("#crange-min").val(var_options[index]["min"]);
            $("#crange-max").val(var_options[index]["max"]);
        }).change();

        $("#style_table").change(function () {
            var style = ($("#style_table option:selected").val());
            update_style(style);
            $("#range-max").trigger('change');
        }).change();

        $("#range-min").on('change', function () {
            $("#range-max").trigger('change');
        });

        $("#range-max").on('change', function () {
            var run_type = ($("#run_table option:selected").val());
            var freq = ($("#freq_table option:selected").val());
            var rd_type = ($("#rd_table option:selected").val());
            var var_type = ($("#var_table option:selected").val());
            var style = ($("#style_table option:selected").val());
            update_style(style);
            var rmin = $("#range-min").val();
            var rmax = $("#range-max").val();
            if (run_type == "geos") {
                $("#date_table").prop('disabled', false);
                $("#hour_table").prop('disabled', false);
                $("#date_table").trigger('change');
            } else {
                time_global = "";
                add_wms(run_type, freq, rd_type, var_type, rmin, rmax, style);
                $("#date_table").prop('disabled', 'disabled');
                $("#hour_table").prop('disabled', 'disabled');
                $("#date_table").html('');
                $("#hour_table").html('');
            }
        }).change();


        $("#opacity-slider").on("slidechange", function (event, ui) {
            opacity = ui.value;
          //  $("#opacity").text(opacity);
            tdWmsLayer.setOpacity(opacity);

        });

        // $("#download_gif").click(function (e) {
        //     $("#download_gif").html("Downloading...");
        //     $("#download_gif").css("text-decoration", "none");
        //     var date = ($("#date_table option:selected").val()).split('/').reverse()[0];
        //     var var_type = ($("#var_table option:selected").val());
        //     var index = find_var_index(var_type, var_options);
        //     var variable = var_options[index]["id"]
        //     var xhr = ajax_update_database("gen-gif", {
        //         "date": date,
        //         "variable": variable,
        //         "coords": coordinates == undefined ? "" : JSON.stringify(coordinates),
        //         "fps": $("#fps_table option:selected").val(),
        //
        //     });

        //     xhr.done(function (result) {
        //         if ("success" in result) {
        //
        //             var save = document.createElement('a');
        //             save.href = 'data:image/gif;base64,' + result['animation'];
        //             save.download = (($("#date_table option:selected").val()).split('/').reverse()[0]).split('.')[0] + ".gif";
        //
        //             save.target = '_blank';
        //             document.body.appendChild(save);
        //             save.click();
        //             document.body.removeChild(save);
        //             $("#download_gif").html("Download GIF!");
        //         } else {
        //             console.log("not ok");
        //         }
        //     });
        //
        // });
        // var polygonDrawTool = new L.Draw.Rectangle(map);

        // $('#select_area').click(function () {
        //     polygonDrawTool.enable();
        //     selectforGIF = true;
        // });

        $("#day1_guage").click(function () {
            gen_chart(field_day1_avg < 0 ? -1 : field_day1_avg, forecast_day1_avg < 0 ? -1 : forecast_day1_avg);
            document.getElementById("datevalue").innerHTML = document.getElementById("day1_guage").innerHTML;
            document.getElementById("fromd").innerHTML = document.getElementById("day1_guage").innerHTML+" 08:30";
            document.getElementById("tod").innerHTML = document.getElementById("day1_guage").innerHTML+" 23:30";
            $(this).css("background-color", "black");
            $("#day2_guage").css("background-color", "gray");
            $("#day3_guage").css("background-color", "gray");
        });
        $("#day2_guage").click(function () {
            gen_chart(field_day2_avg < 0 ? -1 : field_day2_avg, forecast_day2_avg < 0 ? -1 : forecast_day2_avg);
            document.getElementById("datevalue").innerHTML = document.getElementById("day2_guage").innerHTML;
              document.getElementById("fromd").innerHTML = document.getElementById("day2_guage").innerHTML+" 02:30";
            document.getElementById("tod").innerHTML = document.getElementById("day2_guage").innerHTML+" 23:30";
            $(this).css("background-color", "black");
            $("#day1_guage").css("background-color", "gray");
            $("#day3_guage").css("background-color", "gray");
        });
        $("#day3_guage").click(function () {
            gen_chart(field_day3_avg < 0 ? -1 : field_day3_avg, forecast_day3_avg < 0 ? -1 : forecast_day3_avg);
            document.getElementById("datevalue").innerHTML = document.getElementById("day3_guage").innerHTML;
              document.getElementById("fromd").innerHTML = document.getElementById("day3_guage").innerHTML+" 02:30";
            document.getElementById("tod").innerHTML = document.getElementById("day3_guage").innerHTML+" 23:30";
            $(this).css("background-color", "black");
            $("#day2_guage").css("background-color", "gray");
            $("#day1_guage").css("background-color", "gray");
        });


    });

    return public_interface;

}()); // End of package wrapper