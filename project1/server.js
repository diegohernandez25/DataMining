var express = require('express');
var Chart = require('chart.js');
const h3 = require("h3-js");
var sql = require("mssql");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded



var colors = ['#4da500', "#87a500", "#a59500","#a57900","#a55800","#a53100",'#a50000']

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

app.get('/index', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
});


app.get('/pois', function(req, res) {
  res.sendFile(__dirname + "/" + "pois.html");
});

app.get('/pois_map', function(req, res) {
  res.sendFile(__dirname + "/" + "map_poi.html");
});

app.get('/poi_loctype', function(req, res) {
  res.sendFile(__dirname + "/" + "poibyday.html");
});

app.get('/get_hexagon_example', (req, res) => {
  const h3Index = h3.geoToH3(req.query.lat, req.query.lon, req.query.res);
  const hexCenterCoordinates = h3.h3ToGeo(h3Index);
  const hexBoundary = h3.h3ToGeoBoundary(h3Index); //Produce the vertices of the hexagon at this locations.


  const resJson = JSON.stringify(
    { index:h3Index,
      center:hexCenterCoordinates,
      boundaries:hexBoundary
    }
  );
  res.send(resJson)
});

app.get('/get_loc_hexagon', (req,res) =>{
  const h3Index = h3.geoToH3(req.query.lat, req.query.lng, req.query.resolution);
  const h3Center = h3.h3ToGeo(h3Index);
  const hexBoundary = h3.h3ToGeoBoundary(h3Index);
  sql.connect(config, function (err) {
      if (err) console.log(err);


      var request = new sql.Request();
      query = "SELECT distinct [LOCNAME] as locname ,[LAT] as lat, [LONG] as lng,[LOCTYPE] as type FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] WHERE [AREAID] LIKE " +
              "\'"+h3Index+"\';";
      var request = new sql.Request();
      var g;
      request.query(query , function(err, recordset){
        if (err) console.log(err);
        g = setPinsPOIstruct(recordset.recordset);
        var request = new sql.Request();
        query = "SELECT distinct [ed77076].[finalDB].[D_DATE].[DIA_DA_SEMANA] as day, [HOUR] as hour ,[NTAXIS] as num FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_DATE] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_DATE] = [ed77076].[finalDB].[D_DATE].[ID_DATE] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] WHERE [ed77076].[finalDB].[D_LOCATION].[AREAID] LIKE " + "\'"+h3Index+"\';";

        var colors = ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850", "#c49950" , "#895e92"];
        var labels = ['day 1','day 2','day 3','day 4','day 5','day 6','day 7'];
        var chart_struct = setDataChart(colors, labels,7, 24);

        request.query(query , function(err, recordset){
          if (err) console.log(err);
          recordset.recordset.forEach(e=>{
            chart_struct['data']['datasets'][e.day]['data'][e.hour] = e.num;
          });
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
  res.send(req.query.poi_types);
});


app.get('/analyse_pois/:id', (req, res) =>{
  var labels = ['airport','amusement_park','art_gallery','casino','cemetery','church','city_hall',
                'hindu_temple','university', 'stadium', 'rv_park', 'park', 'museum', 'place_of_worship'];

  var map_labels = {'airport':0,'amusement_park':1,'art_gallery':2,'casino':3,'cemetery':4,'church':5,'city_hall':6,
                'hindu_temple':7,'university':8, 'stadium':9, 'rv_park':10, 'park':11, 'museum':12, 'place_of_worship':13}

  var colors = ["#800000", "#9A6324", "#808000", "#469990", "#000075", "#e6194B", "#f58231", "#ffe119", "#bfef45", "#4363d8", "#911eb4", "#ffffff", "#aaffc3", "#fabebe"];
  var res_final = {};//new Array(labels.length).fill(new Array(24).fill(0));
  for(var i = 0; i < labels.length; i++)
  { res_final[labels[i]] = new Array(24).fill(0);
  }

  query = "SELECT distinct [LOCTYPE] as loctype, [DIA_DA_SEMANA] as day, [HOUR] as hour, sum(NTAXIS) as num FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] JOIN [ed77076].[finalDB].[D_DATE] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_DATE] = [ed77076].[finalDB].[D_DATE].[ID_DATE] WHERE [DIA_DA_SEMANA] = "+req.params.id +" GROUP BY [LOCTYPE],[DIA_DA_SEMANA],[HOUR];";

  sql.connect(config, function (err) {
    if (err) console.log(err);

    var request = new sql.Request();
    request.query(query, function(err, recordset){
      if (err) console.log(err);
      var chart_struct = setDataChart(colors, labels, labels.length, 24);
      recordset.recordset.forEach(e=>{
        //res_final[e.loctype][e.hour] = e.num;
        chart_struct['data']['datasets'][map_labels[e.loctype]]['data'][e.hour] = e.num;
      });
      res.send(chart_struct);
      sql.close();
    });
  });
});

app.get('/analyse_poitype_by_day', (req, res) =>{
  var labels = ['airport','amusement_park','art_gallery','casino','cemetery','church','city_hall',
                'hindu_temple','university', 'stadium', 'rv_park', 'park', 'museum', 'place_of_worship'];

  var map_labels = {'airport':0,'amusement_park':1,'art_gallery':2,'casino':3,'cemetery':4,'church':5,'city_hall':6,
                'hindu_temple':7,'university':8, 'stadium':9, 'rv_park':10, 'park':11, 'museum':12, 'place_of_worship':13}

  var colors = ["#800000", "#9A6324", "#808000", "#469990", "#000075", "#e6194B", "#f58231", "#ffe119", "#bfef45", "#4363d8", "#911eb4", "#ffffff", "#aaffc3", "#fabebe"];


  req.params.place_type
  var query = "SELECT distinct [LOCTYPE] as loctype, [DIA_DA_SEMANA] as day, sum(NTAXIS) as num FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] JOIN [ed77076].[finalDB].[D_DATE] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_DATE] = [ed77076].[finalDB].[D_DATE].[ID_DATE] GROUP BY [LOCTYPE], [DIA_DA_SEMANA];";
  sql.connect(config, function (err) {
    if (err) console.log(err);
    var request = new sql.Request();
    request.query(query, function(err, recordset){
      if (err) console.log(err);
      var chart_struct = setDataChart(colors, labels, labels.length, 7);
      recordset.recordset.forEach(e=>{
        //res_final[e.loctype][e.hour] = e.num;
        chart_struct['data']['datasets'][map_labels[e.loctype]]['data'][e.day] = e.num;
      });
      res.send(chart_struct);
      sql.close();
    });
  });
});



app.get('/analyse_pois_map', (req, res) =>{
  var query = "SELECT distinct [AREAID] as area, sum(NTAXIS) as num FROM [ed77076].[finalDB].[F_COUNT_ON_LOCATION] JOIN [ed77076].[finalDB].[D_LOCATION] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_LOCATION] = [ed77076].[finalDB].[D_LOCATION].[ID_LOCATION] JOIN [ed77076].[finalDB].[D_DATE] ON [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[ID_DATE] = [ed77076].[finalDB].[D_DATE].[ID_DATE] WHERE [DIA_DA_SEMANA] = "+req.query.day+" AND [ed77076].[finalDB].[F_COUNT_ON_LOCATION].[HOUR] = "+req.query.hour+" AND [ed77076].[finalDB].[D_LOCATION].[LOCTYPE] LIKE \'"+ req.query.type +"\' GROUP BY [AREAID],[HOUR]";
  sql.connect(config, function (err) {
      if (err) console.log(err);
      var request = new sql.Request();
      request.query(query, function(err, recordset){
        if (err) console.log(err);
        var dict_hex = {};
        recordset.recordset.forEach(e=>{
          dict_hex[e.area]=e.num;
        });
        var final_dict = get_set_hexagons(dict_hex);
        var response = JSON.stringify(final_dict);
        res.send(response);
        sql.close();
      });
  });
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
          var final_dict = get_set_hexagons(dict_hex);
          var response = JSON.stringify(final_dict);
          res.send(response);
          sql.close();
        });
    });
});


function get_set_hexagons(dictionary)
{
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

function setDataChartPOITypes()
{
  var colors = ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850", "#c49950" , "#895e92",
                "#3495ad", "#805e02", "#5cda9f", "#e8c3b9", "#c45850", "#c49950" , "#895e92"];

  var labels = ['airport','amusement_park','art_gallery','casino','cemetery','church','city_hall',
                'hindu_temple','university', 'stadium', 'rv_park', 'park', 'museum', 'place_of_worship'];


}

function constructPOISCharts(data)
{ console.log(data);
}


function setDataChart(colors, labels, nplots, x_nvalues){

  var final = {
    type: 'line',
    data: {
      labels: Array.from({length: x_nvalues}, (x,i) => i),
      datasets: []
    },
    options: {
      title: {
        display: true,
        text: 'Historic'
      }
    }
  };

  for(var i =0; i<nplots; i++)
  {    final['data']['datasets'].push({
          data: new Array(x_nvalues).fill(0),
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
