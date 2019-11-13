var express = require('express');
var Chart = require('chart.js')

const h3 = require("h3-js");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


var colors = ["#b4ff14","#ffd714","#ffa347","#7f2727"]


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
  const h3Index = h3.geoToH3(req.query.lat, req.query.lng, req.query.resolution);
  const h3Center = h3.h3ToGeo(h3Index);
  const hexBoundary = h3.h3ToGeoBoundary(h3Index);
  const resJson = JSON.stringify(
    { index:h3Index,
      center:h3Center,
      boundaries: hexBoundary
    }
  );
  //TODO: Do more analisys here.
  console.log(resJson);
  res.send(resJson);
});


app.get('/get_pois', (req, res) =>{
  console.log('poi_types:\t', req.query.poi_types);
  res.send(req.query.poi_types);
});


app.get('/get_set_hexagons', (req, res) =>{
    console.log('resolution:\t', req.query.resolution);
    //console.log('resolution:\t', req.query.resolution);

    var dict_hex = {};

    var fs = require('fs');
    var text= fs.readFileSync('newFile.txt', 'utf8');


    text.split("\n").forEach(line => {
        var lng= line.split(" ")[0];

        var lat=line.split(" ")[1];
        const h3Index = h3.geoToH3(lat, lng, req.query.resolution);
        if(Object.keys(dict_hex).includes(h3Index))
        {
            dict_hex[h3Index]++;
        }
        else{
            dict_hex[h3Index]=1;
        }
    });
    delete dict_hex[null];
    var max = 0;
    var ks = Object.keys(dict_hex);
    ks.forEach(key=>{
        if(max < dict_hex[key] & key != "8831aa5535fffff")
            max = dict_hex[key];
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
          opacity = dict_hex[key]/max;
          center = h3.h3ToGeo(key);
          boundary = h3.h3ToGeoBoundary(key);
          color = Math.floor(opacity * (colors.length+1));
          console.log(color);
          final_dict[key] = {'color':colors[color],'opacity':dict_hex[key] / max, 'center': center, 'boundary':boundary};
        }
    });

    const response = JSON.stringify(final_dict);
    res.send(response);
});

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
});
