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
    var tag = req.body.tag.toLowerCase();
    Photo.findOne({id: req.body.photo.id})
       .update({notTag: true})
       .exec(function(){
            getPhotosFromFlickr(tag, 1, function(error, photo){
                    checkIfPhotoExists(tag, photo, function(photo){
                        res.json(photo);
                    })
                })
            })  
        }

function requestPhotos(req, res) {
    photos = [];
    var tag = req.body.tag.toLowerCase();
    saveQuery(tag, function(){
        getPhotosFromFlickr(tag, 2, function(error, photos) {
            checkIfPhotoExists(tag, photos, function(photos){
                res.json(photos);
            })
        })
    })
}

function checkIfPhotoExists(tag, photos, fn){

    if (photos.length > 2){
        photos.pop();
    }
    photos.forEach(function(p){
            Photo.findOne({id: p.id, tag: tag}, function(err, photo){
                if (err || !photo){ saveNewPhoto(p) }
                    else { 
                        appearances = photo.appearances + 1;
                        // callback necessary to trigger update as per mongoose docs
                        photo.update({appearances:appearances}, function(){})
                    }
                })
            })
    return fn(photos);
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
        tag: o.tag.toLowerCase(),
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
        query: tag.toLowerCase()
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
        if (!err){
        var votes = photo.votes + 1;
        photo.update({isVoted: true}, function(){
            photo.update({votes: votes}, function(){
                requestPhotos(req, res);
            });
        });
        }
        else { throw new Error(err)}
    })  
}

exports.getPhotosForMap = function(req, res){
    Photo.find({tag: req.body.tag.toLowerCase(), isVoted: true}, function(err, photos){
        if (err) { throw new Error(err)}
    
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
        var ranking = (item.votes /  item.appearances) * 100;
        item.ranking = ranking.toFixed(0);
    })
    return fn(photos);
}

function transformPhotoForMap(photos, fn){
    locations = {};
    $ = cheerio.load('<div><a target="_blank"><img style="padding: 0; margin: 0; width: 300px;"/></a><div class="appearances" style="background: #222222; padding: 10px; color: white; position: absolute; z-index: 100; top: 13px; right: 20px; font-weight: bold; font-size: 20px;"></div></div>');
    photos.forEach(function(photo){

        var pictureurl = "http://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
        var flickrlink = "http://flickr.com/photo.gne?id=" + photo.id + "/";

        $('a').attr('href', flickrlink);
        $('img').attr('src', pictureurl);
        if (photo.appearances === 1) { var app = ' appearance' } else { var app = ' appearances'}
        if (photo.votes === 1) { var vot = ' vote' } else { var vot = ' votes'}

        //$('div.appearances').text();
        $('div.appearances').text(photo.ranking);
        var fulllink = $.html();
        var location = {};
        location["lat"] = photo.location[0];
        location["lng"] = photo.location[1];
        location["message"] = fulllink;
        location["ranking"] = photo.ranking;
        locations[photo.id] = location;
    })
    return fn(locations);

}
               