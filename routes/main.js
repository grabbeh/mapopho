var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI,
    sys = require('sys'),
    api = require('../config/api.js'),
    flickr = new FlickrAPI(api.details.key),
    geocoder = require('geocoder'),
    Photo = require('../models/photo.js'),
    cityarray = require('../config/basiccities.json');

exports.home = function (req, res) {
    res.render('home');
};

exports.requestPhotos = function (req, res) {
    requestPhotos(req, res);
}

function requestPhotos(req, res) {
    photos = [];
    var tag = req.body.tag;
    getPhotosFromFlickr(tag, 2, function (error, photos) {
        if (error){
            res.status(401).send({message: "Quota exceeded"})
        }
        else {
            res.json(photos);
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

function getPhotosFromFlickr(tag, number, cb) {
    var cityindex = Math.floor((Math.random() * cityarray.length));
    var place = cityarray[cityindex];
    var landCoordinate = [place.lat, place.lng];

    flickrSearchOption = new flickrSearchOptions(tag, landCoordinate);
    searchFlickr(flickrSearchOption, function (error, photo) {
        if (error) {
            getPhotosFromFlickr(tag, number, cb) 
            }
            else {
                photo['location'] = landCoordinate;
                photo['tag'] = tag;
                photo['description'] = false;
                photo['_id'] = false;
                photos.push(photo);
                    if (photos.length < number) {
                        getPhotosFromFlickr(tag, number, cb)
                    }
                    else { 
                        return cb(null, photos) 
                        }
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

function saveVotedPhoto(obj, fn){
    new Photo({
        location: obj.location,
        locationTwo: obj.locationTwo,
        tag: obj.tag,
        id: obj.id,
        farm: obj.farm,
        secret: obj.secret,
        server: obj.server,
        isVoted: true,
        votes: 1
    }).save(fn);
}

function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

exports.voteOnPhoto = function(req, res){
    photoid = req.body.photo.id;
    Photo.findOne({id: photoid}, function(err, photo){
        if (err || !photo) { 
            saveVotedPhoto(req.body.photo, function(){
                requestPhotos(req, res);
            });
        }
        else { 
            votes = req.body.photo.votes + 1;
            photo.update({votes: votes}, function(){
                requestPhotos(req, res);
            })
        }
    }) 
}

exports.getPhotosForMap = function(req, res){
    Photo.find({tag: req.body.tag}, function(err, photos){
        if (!err) { 
            locations = {};
            photos.forEach(function(photo){
               var pictureurl = "http://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg"

               var imgsrc = "<img src=" + "'" + pictureurl + "'" + "/>"

               var location = {};
               location["lat"] = photo.location[0];
               location["lng"] = photo.location[1];
               location["message"] = imgsrc;
               locations[photo.id] = location;
            })
            res.json(locations)
        };
    })
}