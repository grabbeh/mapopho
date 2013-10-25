var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI
, sys = require('sys')
, api = require('../config/api.js')
, flickr = new FlickrAPI(api.details.key)
, geocoder = require('geocoder');

exports.home = function(req, res){
  res.render('home');
};

exports.api = function(req, res){
     var coords = [];
     var pictures = [];
     randomLandBasedCoordinates(2, function(coords){ 
     	coords.forEach(function(arr){
     	    var flickrSearchOptions = new searchObject(req.body.tag, arr);
	    searchFlickr(2, flickrSearchObject, function(pictures){
	    	res.json(pictures);
	    });	
     	})
    })
})

exports.privacy = function(req, res){
  res.render('privacy');
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function searchFlickr(number, object, fn) {
  flickr.photos.search(object, function(error, results) {
	if (error){
		searchFlickr(object, fn);
		}
	else if (!error){
		 if (results.pages === 0){
		      searchFlickr(number, object, fn);
		      }
		 else {
		      pictures.push(results.photo[0]);
		      if (pictures.length < number) {
		      	   searchFlickr(number, object, fn);
		      }
		      else {
		      	   return fn(results);
		      	   }
		      }
		}
	});
}

function randomlandBasedCoordinates(number, fn) {
	
        var lat = (Math.random() * 180 - 90);
        var lon = (Math.random() * 360 - 180);
	var randomCoordinate = [lat, lon];
	
	geocoder.reverseGeocode(lat, lon, function(err, results){
	    if (status == "ZERO_RESULTS") {
                randomLandBasedCoords(number,fn);
              } else if (status == "OK" && results) {
                      var landCoordinate = randomCoordinate;
                      coords.push(landCoordinate);
                  if (coords.length < number) {
                         randomLandBasedCoords(number,fn);
                  } else {
                      return fn(coords);
            }
        }
    });		
}

function flickrSearchOptions(obj, arr) {
		this.lat = arr[0];
		this.lon = arr[0];
		this.min_date_upload = 946706400;
		this.tags = tag;
		this.per_page = 1;
		this.page = 1;
	}


