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


function drawArea(coordinates)
{
  console.log('coordinates:\t',coordinates);
  var tmp = [];
  for(var i = 0; i<coordinates.length; i++)
  { tmp.push(coordinates[i].reverse());
  }

  map.addLayer({
    'id': 'maine',
    'type': 'fill',
    'source': {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [tmp]
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

function centerMap(center)
{ map.flyTo({
  center: center.reverse(),
  zoom:8
  });
}
