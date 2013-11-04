var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI,
    sys = require('sys'),
    api = require('../config/api.js'),
    flickr = new FlickrAPI(api.details.key),
    geocoder = require('geocoder'),
    Coordinate = require('../models/coordinate.js'),
    Photo = require('../models/photo.js'),
    cityarray = require('../config/basiccities.json');
    
exports.home = function (req, res) {
    res.render('home');
};

exports.requestPhotos = function (req, res) {
    photos = [];
    var tag = req.body.tag;
    randomLandBasedCoordinates(tag, function (error, photos) {
        if (error){
            res.status(401).send({message: "Quota exceeded"})
        }
        else {
            res.json(photos);
            photos.forEach(function(photo){
                savePhoto(photo);
            })
        }
    })
}

function searchFlickr(object, func) {
    flickr.photos.search(object, function (error, results) {
        if (error || results.photo[0] == undefined) {
            var err = new Error("No photos");
            return func(err);
        } 
        else {
            var index = Math.floor((Math.random() * results.photo.length));
            return func(null, results.photo[index]);
        }
    });
}

function randomLandBasedCoordinates(tag, cb) {
    var lat = (Math.random() * 180 - 90).toFixed(2);
    var lon = (Math.random()* 360 - 180).toFixed(2);
    var randomCoordinate = [lat, lon];
    console.log(randomCoordinate);
    var randomCoordinateTwo = [lon, lat];
    geocoder.reverseGeocode(lat, lon, function (err, results) {
        if (results.status == "ZERO_RESULTS") {
            randomLandBasedCoordinates(tag, cb);
        } 

        else if (results.status == "OVER_QUERY_LIMIT" ){
            var err = new Error("Query limit exceeded");
            cb(err);
        }
        else if (results.status == "OK" && results) {

            new Coordinate({
                coordinate: randomCoordinate, 
                coordinateTwo: randomCoordinateTwo
                }).save(function(){
                    var landCoordinate = randomCoordinate;
                    var landCoordinateTwo = randomCoordinateTwo;
                    flickrSearchOption = new flickrSearchOptions(tag, landCoordinate);
                    searchFlickr(flickrSearchOption, function (error, photo) {
                        if (error) {
                            randomLandBasedCoordinates(tag, cb) 
                        }
                        else {
                             photo['location'] = landCoordinate;
                             photo['locationTwo'] = landCoordinateTwo;
                             photo['tag'] = tag;
                             photos.push(photo);
                              if (photos.length < 2) {
                                  randomLandBasedCoordinates(tag, cb)
                            }
                              else { 
                                  return cb(null, photos) 
                           }
                        }
                    });
                })
            }
        });
    }

function flickrSearchOptions(tag, arr) {
    this.lat = arr[0];
    this.lon = arr[1];
    this.min_date_upload = 946706400;
    this.tags = tag;
    this.per_page = 500;
    this.page = 1;
    this.radius = 5;
}

function savePhoto(obj, fn){
    new Photo({
        location: obj.location,
        locationTwo: obj.locationTwo,
        tag: obj.tag,
        id: obj.id,
        farm: obj.farm,
        secret: obj.secret,
        server: obj.server,
        isVoted: false,
        votes: 0
    }).save(fn);
}



function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}