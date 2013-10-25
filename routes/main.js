var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI
, sys = require('sys')
, api = require('../config/api.js')
, flickr = new FlickrAPI(api.details.key)
, geocoder = require('geocoder');

exports.home = function(req, res){
  res.render('home');
};

exports.api = function(req, res){
     randomLandBasedCoordinates(2, function(coords){ 
     	coords.forEach(function(arr){
     	    var flickrSearchOptions = new searchObject(req.body.tag, arr);
	    searchFlickr(flickrSearchObject, function(results){
	    	res.json(results);
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

function searchFlickr(object, fn) {
  flickr.photos.search(object, function(error, results) {
		if (error){
			searchFlickr(object, fn);
		}
		else {
		     if (results.pages === 0){
		          searchFlickr(object, fn);
		      }
		      else {
			   fn(results);
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
		this.per_page = 2;
		this.page = 1;
	}


