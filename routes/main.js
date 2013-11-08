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
            photos.forEach(function(p){
                Photo.findOne({id: p.id}, function(err, photo){

                    if (err || !photo){ saveNewPhoto(p) }

                    else { appearances = photo.appearances + 1;
                           photo.update({appearances:appearances})
                    }
                })
            })
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

function saveNewPhoto(o, fn){
    new Photo({
        location: o.location,
        locationTwo: o.locationTwo,
        tag: o.tag,
        id: o.id,
        farm: o.farm,
        secret: o.secret,
        server: o.server,
        isVoted: false,
        votes: 0,
        appearances: 1
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
    console.log(req.body)
    Photo.findOne({id: req.body.photo.id}, function(err, photo){
        var votes = photo.votes + 1;
        photo.update({isVoted: true}, function(){
            photo.update({votes: votes}, function(){
                requestPhotos(req, res);
            });
        });
        
    })  
}

exports.getPhotosForMap = function(req, res){
    Photo.find({tag: req.body.tag, isVoted: true}, function(err, photos){
        if (!err) { 
            locations = {};
            photos.forEach(function(photo){
               var pictureurl = "http://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
               var imgsrc = "<img src=" + "'" + pictureurl + "'" + "/>"
               var link = "http://flickr.com/photo.gne?id=" + photo.id + "/";
               var fulllink = "<a target='_blank' href=" + link + ">" + imgsrc + '</a>';
               var location = {};
               location["lat"] = photo.location[0];
               location["lng"] = photo.location[1];
               location["message"] = fulllink;
               locations[photo.id] = location;
            })
            res.json(locations)
        };
    })
}