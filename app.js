var express = require('express')
, util = require('util')
, routes = require('./routes/main')
, app = express()
, FlickrAPI = require('./flickrnode/lib/flickr').FlickrAPI
, sys = require('sys')
, api = require('./config/api.js')
, flickr = new FlickrAPI(api.details.key)
, mongoose = require('mongoose')
, db = require('./config/db.js');

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride()); 
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

mongoose.connect('mongodb://' 
  + db.user + ':' 
  + db.pass + '@' 
  + db.host + ':' 
  + db.port + '/' 
  + db.name,
  function(err){
    if (err) {throw new Error(err.stack);}
  });

// Routes

app.get('/', function(req, res){
  res.sendfile(__dirname + '/public/views/index.html')
});

app.post('/getTwoPhotos', routes.getTwoPhotos);

app.post('/getOnePhoto', routes.getOnePhoto);

app.post('/voteOnPhoto', routes.voteOnPhoto);

app.post('/getPhotosForMap', routes.getPhotosForMap);

app.get('/worldjson', routes.getWorldJson);

app.post('/getPhotosForCountry', routes.getPhotosForCountry);

app.get('/countryRankings', routes.countryRankings);

app.get('*', function(req, res){
  res.send('404, page not found', 404);
});

app.listen(2000);
