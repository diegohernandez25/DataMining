var express = require('express');
var Chart = require('chart.js');
const h3 = require("h3-js");
var sql = require("mssql");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


var colors = ["#b4ff14","#ffd714","#ffa347","#7f2727"]


var config = {
    user: 'ed77076',
    password: 'rodinhas123',
    server: 'deti-sql-aulas.ua.pt',
    database: 'ed77076'
};


app.use(express.static(__dirname + '/public'));

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.get('/index.html', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

app.get('/get_hexagon_example', (req, res) => {
  console.log('body: ' + req.query);
  console.log("latitude:\t"+ req.query.lat);
  console.log("longitude:\t"+ req.query.lon);
  console.log("resolution:\t"+ req.query.res);

  const h3Index = h3.geoToH3(req.query.lat, req.query.lon, req.query.res);
  const hexCenterCoordinates = h3.h3ToGeo(h3Index);
  const hexBoundary = h3.h3ToGeoBoundary(h3Index); //Produce the vertices of the hexagon at this locations.


  const resJson = JSON.stringify(
    { index:h3Index,
      center:hexCenterCoordinates,
      boundaries:hexBoundary
    }
  );
  console.log("resJson:\t",resJson);
  res.send(resJson)
});



app.get('/get_loc_hexagon', (req,res) =>{
  console.log("res:\t",req.query.resolution);
  const h3Index = h3.geoToH3(req.query.lat, req.query.lng, req.query.resolution);
  const h3Center = h3.h3ToGeo(h3Index);
  const hexBoundary = h3.h3ToGeoBoundary(h3Index);
  var geojson = null;
  //Get Poi
  /*sql.connect(config, function (err) {
    if (err) console.log(err);

    var request = new sql.Request();
    query = "SELECT distinct [LOCNAME] as locname ,[LAT] as lat, [LONG] as lng,[LOCTYPE] as type FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] WHERE [AREAID] LIKE " +
            "\'"+h3Index+"\';";
    console.log('POI QUERY:\t', query);

    var request = new sql.Request();

    request.query(query , function(err, recordset){
      if (err) console.log(err);
      geojeson = setPinsPOIstruct(recordset.recordset);
      sql.close();
    });

  });*/

  //Database
  sql.connect(config, function (err) {
      if (err) console.log(err);


      var request = new sql.Request();
      query = "SELECT distinct [LOCNAME] as locname ,[LAT] as lat, [LONG] as lng,[LOCTYPE] as type FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] WHERE [AREAID] LIKE " +
              "\'"+h3Index+"\';";
      console.log('POI QUERY:\t', query);

      var request = new sql.Request();
      var g;
      request.query(query , function(err, recordset){
        if (err) console.log(err);
        g = setPinsPOIstruct(recordset.recordset);
        console.log('g:',g);
        var request = new sql.Request();
        query = "SELECT distinct [ed77076].[finalDB].[D_DATE].[DIA_DA_SEMANA] as day, [HOUR] as hour ,[NTAXIS] as num FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_DATE] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_DATE] = [ed77076].[finalDB].[D_DATE].[ID_DATE] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] WHERE [ed77076].[finalDB].[D_LOCATION].[AREAID] LIKE " + "\'"+h3Index+"\';";

        var chart_struct = setDataChart();
        request.query(query , function(err, recordset){
          if (err) console.log(err);
          console.log(recordset.recordset);
          recordset.recordset.forEach(e=>{
            chart_struct['data']['datasets'][e.day]['data'][e.hour] = e.num;
          });
          console.log('chart_struct:\t',chart_struct);
          const resJson = JSON.stringify(
            { index:h3Index,
              center:h3Center,
              boundaries: hexBoundary,
              chart: chart_struct,
              features: g
            }
          );
          res.send(resJson);
          sql.close();
        });
      });

  });
});


app.get('/get_pois', (req, res) =>{
  console.log('poi_types:\t', req.query.poi_types);
  res.send(req.query.poi_types);
});


app.get('/get_set_hexagons', (req, res) =>{
    query = "SELECT [AREAID] as area ,SUM([NTAXIS]) as num FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] GROUP BY AREAID;";
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        request.query(query, function(err, recordset){
          if (err) console.log(err);
          var dict_hex = {};
          recordset.recordset.forEach(e=>{
            dict_hex[e.area]=e.num;
          });
          console.log('dict_hex:\t',dict_hex);
          var final_dict = get_set_hexagons(dict_hex);
          var response = JSON.stringify(final_dict);
          console.log(response);
          res.send(response);
          sql.close();
        });
    });
});


function get_set_hexagons(dictionary)
{
    console.log('dictionary:\t',dictionary);
    var max = 0;
    var ks = Object.keys(dictionary);
    ks.forEach(key=>{
        if(max < dictionary[key] & key != "8831aa5535fffff")
            max = dictionary[key];
    });

    var final_dict = {};
    var opacity;
    var center;
    var boundary;
    console.log('colors length:\t',colors.length);
    console.log('colors:\t',colors);
    ks.forEach(key=>{
        if(key != "8831aa5535fffff")
        {
          opacity = dictionary[key]/max;
          center = h3.h3ToGeo(key);
          boundary = h3.h3ToGeoBoundary(key);
          color = Math.floor(opacity * (colors.length+1));
          final_dict[key] = {'color':colors[color],'opacity':dictionary[key] / max, 'center': center, 'boundary':boundary};
        }
    });
    return final_dict;
}

function setDataChart(){
  var colors = ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850", "#c49950" , "#895e92"];
  var labels = ['day 1','day 2','day 3','day 4','day 5','day 6','day 7'];

  var final = {
    type: 'line',
    data: {
      labels: Array.from({length: 24}, (x,i) => i),
      datasets: []
    },
    options: {
      title: {
        display: true,
        text: 'Historic)'
      }
    }
  };

  for(var i =0; i<7; i++)
  {    final['data']['datasets'].push({
          data: new Array(24).fill(0),
          label: labels[i],
          borderColor: colors[i],
          fill:false
        });
  };
  return final;
}


function setPinsPOIstruct(coordinates)
{
  var geojson = {
    "type": "FeatureCollection",
    "features": []
  };
  coordinates.forEach(c=>{
    geojson['features'].push(
      {
        "type": "Feature",
        "properties": {
          "message": c['locname'] + "\nType: " + c['type'],
          "iconSize": [40,40]
        },
        "geometry": {
          "type": "Point",
          "coordinates": [
            c['lng'],
            c['lat']
          ]
        }
      });
  });
  return geojson;
}

var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});
