var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI,
    sys = require('sys'),
    api = require('../config/api.js'),
    cheerio = require('cheerio'),
    flickr = new FlickrAPI(api.details.key),
    Photo = require('../models/photo.js'),
    Query = require('../models/query.js'),
    cityarray = require('../config/basiccities.json');

exports.home = function (req, res) {
    res.render('home');
};

exports.requestTwoPhotos = function(req, res) {
    requestPhotos(req, res);
}

exports.requestOnePhoto = function(req, res) {
    requestOnePhoto(req, res);
}

function requestOnePhoto(req, res) {
    photos = [];
    var tag = req.body.tag;
    Photo.findOne({id: req.body.photo.id})
       .update({notTag: true})
       .exec(function(){
            getPhotosFromFlickr(tag, 1, function(error, photos){
                    checkIfPhotoExists(photos, function(photos){
                        res.json(photos);
                    })
                })
            })  
        }

function requestPhotos(req, res) {
    photos = [];
    var tag = req.body.tag;
    saveQuery(tag, function(){
        getPhotosFromFlickr(tag, 2, function(error, photos) {
            checkIfPhotoExists(photos, function(photos){
                res.json(photos);
            })
        })
    })
}

function checkIfPhotoExists(photos, fn){

    if (photos.length > 2){
        photos.pop();
    }
    photos.forEach(function(p){
            Photo.findOne({id: p.id}, function(err, photo){
                if (err || !photo){ saveNewPhoto(p) }
                    else { 
                        appearances = photo.appearances + 1;
                        photo.update({appearances:appearances}, function(){})
                    }
                })
            })
    fn(photos);
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
    var coordinate = [place.lat, place.lng];

    flickrSearchOption = new flickrSearchOptions(tag, coordinate);
    searchFlickr(flickrSearchOption, function (error, photo) {
        if (error) {
            getPhotosFromFlickr(tag, number, cb) 
            }
            else {
                photo['location'] = coordinate;
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
        appearances: 1,
        notTag: false
    }).save(fn);
}

function saveQuery(tag, fn){
    new Query({
        query: tag.toUpperCase()
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
        if (photos[0] === undefined || !photos) { res.status(500).send() }
        else { 
            calculateRanking(photos, function(photos){
                transformPhotoForMap(photos, function(photos){
                    res.json(photos);
                });
            })
        };
    })
}

function calculateRanking(photos, fn){
    photos.forEach(function(item){
        ranking = item.votes / (Date.now() - item.dateCreated) * (item.appearances * 10000000);
        item.ranking = ranking.toFixed(2);
    })
    return fn(photos);
}

function transformPhotoForMap(photos, fn){
    locations = {};
    $ = cheerio.load('<a target="_blank"><img style="padding: 0; margin: 0; width: 300px;"/></a><p></p>');
    photos.forEach(function(photo){

    var pictureurl = "http://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
    var flickrlink = "http://flickr.com/photo.gne?id=" + photo.id + "/";

    $('a').attr('href', flickrlink);
    $('img').attr('src', pictureurl);
    $('p').text(photo.ranking);

    var fulllink = $.html();
    var location = {};
    location["lat"] = photo.location[0];
    location["lng"] = photo.location[1];
    location["message"] = fulllink;
    locations[photo.id] = location;
    })
fn(locations);

}
               