var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI,
    sys = require('sys'),
    api = require('../config/api.js'),
    flickr = new FlickrAPI(api.details.key),
    geocoder = require('geocoder');

exports.home = function (req, res) {
    res.render('home');
};

exports.api = function (req, res) {
    photos = [];
    var tag = req.body.tag;
    randomLandBasedCoordinates(tag, function (photos) {
        console.log(photos);
        res.json(photos);
    })
}

function searchFlickr(object, func) {
    flickr.photos.search(object, function (error, results) {
        if (error || results.photo[0] == undefined) {
            var err = new Error("No photos");
            return func(err);
        } 
        else {
            return func(null, results.photo[0]);
        }
      });
}

function randomLandBasedCoordinates(tag, cb) {
    var lat = (Math.random() * 180 - 90);
    var lon = (Math.random() * 360 - 180);
    var randomCoordinate = [lat, lon];
    geocoder.reverseGeocode(lat, lon, function (err, results) {
        if (results.status == "ZERO_RESULTS") {
            randomLandBasedCoordinates(tag, cb);
        } else if (results.status == "OK" && results) {
                var landCoordinate = randomCoordinate;
                flickrSearchOption = new flickrSearchOptions(tag, landCoordinate);
                searchFlickr(flickrSearchOption, function (error, photo) {
                    if (error) {
                        randomLandBasedCoordinates(tag, cb) 
                    }
                    else {
                         photo['location'] = landCoordinate;
                         photos.push(photo);
                          if (photos.length < 2) {
                              randomLandBasedCoordinates(tag, cb)
                        }
                          else { 
                              return cb(photos) 
                       }
                }
            });
        }
    });
}

function flickrSearchOptions(tag, arr) {
    this.lat = arr[0];
    this.lon = arr[1];
    this.min_date_upload = 946706400;
    this.tags = tag;
    this.per_page = 1;
    this.page = 1;
    this.radius = 32;
}

function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
