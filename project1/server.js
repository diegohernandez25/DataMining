var express = require('express');
const h3 = require("h3-js");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

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


var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
