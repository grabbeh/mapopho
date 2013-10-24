var express = require('express')
, util = require('util')
, routes = require('./routes/main')
, app = express()
, FlickrAPI = require('./flickrnode/lib/flickr').FlickrAPI
, sys = require('sys')
, api = require('./config/api.js')
, flickr = new FlickrAPI(api.details.key);

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.session({secret: 'keyboard cat'}));				  
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);

});

// Routes

app.get('/', routes.home);

app.post('/flickrapi', routes.api);

app.get('/privacy', routes.privacy);

app.get('*', function(req, res){
  res.send('404, page not found', 404);
});

app.listen(4000);
