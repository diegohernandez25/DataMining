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
  console.log('coordinates:\t',coordinates);


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
{   console.log(data);
    var lst_features = [];
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

  $.ajax(
      {
        dataType:'json',
        type: 'get',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        url: '/get_loc_hexagon',
        data: x,
        success: function(data){
          console.log(data);
        },
      });
}

function getPois(pois)
{   var x = {
      'poi_types': pois
    }
    $.ajax(
    {
      dataType:'json',
      type: 'get',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      url: '/get_pois',
      data: x,
      success: function(data){
        console.log(data);
      },
    });

}
