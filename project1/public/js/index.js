var map;
function getHexagonPoints(){
  var x= {
    "lat": 40.636761,
    "lon": -8.653821,
    "res": 7
  };

  var boundaries;
  var index;
  var center;

  $.ajax(
  {
      dataType:'json',
      type: 'get',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      url: '/get_hexagon_example',
      data: x,
      success: function(data){
        boundaries = data.boundaries;
        index = data.index;
        center = data.center;
        centerMap(center);
        drawArea(boundaries);
      },
  });
}

function getAllHexagons(){
  var x={
    "resolution": 8
  };

  var boundaries;
  var index;
  var center;

  $.ajax(
      {
        dataType:'json',
        type: 'get',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        url: '/get_set_hexagons',
        data: x,
        success: function(data){
          createSetOfPolygons(data);
        },
      });
}


function drawArea(coordinates, id, opacity)
{
  map.addLayer({
    'id': 'map1',
    'type': 'fill',
    'source': {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': coordinates
        }
      }
    },
    'layout': {},
    'paint': {
      'fill-color': '#088',
      'fill-opacity': 0.8
    }
  });
}


function createSetOfPolygons(data)
{   var lst_features = [];
    var lst_layers = [];
    var keys = Object.keys(data);

    var boundaries ;
    var center;

    keys.forEach(k => {
        boundaries = data[k].boundary;
        var bound_tmp = [];
        for(var i = 0; i< boundaries.length; i++)
        {   bound_tmp.push(boundaries[i].reverse());
        }
        center = data[k].center;

        lst_features.push({
            "type":"Feature",
            "properties" : {"icon":k},
            "geometry":
                {   "type":"Polygon",
                    "coordinates": [bound_tmp]
                }
        });


        lst_layers.push({
            "id": k,
            "type": "fill",
            "source": "tokyo",

            "paint": {
                //"fill-color": "#888888",
                "fill-color": data[k].color,
                "fill-opacity": 0.8
                //"fill-opacity": data[k].opacity
            },
            "filter": ["==", "icon", k]
        });
    });

    map.addSource("tokyo",{
       "type":"geojson",
       "data":{
           "type":"FeatureCollection",
           "features": lst_features
       }
    });
    lst_layers.forEach(layer => {
        map.addLayer(layer);
    });

    centerMap(center);

}

function centerMap(center)
{ map.flyTo({
  center: center.reverse(),
  zoom:10
  });
}


function getAreaAnalysis(coordinates)
{ map.flyTo({
    center: coordinates,
    zoom:15
  });
  var x = {
    "lat": coordinates.lat,
    "lng": coordinates.lng,
    "resolution": 8
  };
  var dict = null;
  $.ajax(
      {
        dataType:'json',
        type: 'get',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        url: '/get_loc_hexagon',
        data: x,
        success: function(data){
          new Chart(document.getElementById("line-chart"),data.chart);
          var geojson = data.features;
          geojson.features.forEach(function(marker) {
            var el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundImage = 'url(https://placekitten.com/g/' + marker.properties.iconSize.join('/') + '/)';
            //el.style.backgroundImage = 'img/redcircle.png';
            el.style.width = marker.properties.iconSize[0] + 'px';
            el.style.height = marker.properties.iconSize[1] + 'px';

            el.addEventListener('click', function() {
            window.alert(marker.properties.message);
            });

            new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)
            .addTo(map);
          });
        }
    });
    return dict.chart;
}

function loadPOIPlots(checkbox_vals)
{
  $.ajax(
  {
    dataType:'json',
    type: 'get',
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    url: '/analyse_pois/'+checkbox_vals[0],
    success: function(data){
      new Chart(document.getElementById("line-chart-day"),data);
    },
  });
}

function loadPOIPlotsByDay()
{  $.ajax({
    dataType:'json',
    type: 'get',
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    url: '/analyse_poitype_by_day',
    success: function(data){
      new Chart(document.getElementById("line-chart-day"),data);
    },
  });

}

function loadPOIMap(checkbox_value, hour){
  var x = {
    'day': checkbox_value[0],
    'type': checkbox_value[1],
    'hour': hour,
  };
  $.ajax(
    {
      dataType:'json',
      type: 'get',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      data: x,
      url: '/analyse_pois_map',
      success: function(data){
        createSetOfPolygons(data);
      },
    });
};

function clearAllLayers(){
  draw.deleteAll().getAll();
}
