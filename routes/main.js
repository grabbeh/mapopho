var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI,
    sys = require('sys'),
    api = require('../config/api.js'),
    cheerio = require('cheerio'),
    flickr = new FlickrAPI(api.details.key),
    Photo = require('../models/photo.js'),
    Query = require('../models/query.js'),
    gju = require('geojson-utils'),
    cities = require('../config/basiccities.json'),
    world = require('../geojson/world.json');

exports.home = function (req, res) {
    res.render('home');
};

exports.getTwoPhotos = function(req, res) {
    getPhotos(req, res);
}

exports.getOnePhoto = function(req, res) {
    getOnePhoto(req, res);
}

function getOnePhoto(req, res) {
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

function getPhotos(req, res) {
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

    if (photos.length > 2){ photos.pop();}
    photos.forEach(function(p){
            Photo.findOne({id: p.id, tag: tag}, function(err, photo){
                if (err || !photo){ 

                    determineWhatCountryPointIsIn(p, function(err, p){
                        if (p){ saveNewPhoto(p); }
                        })
                    }
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
    var random = Math.floor((Math.random() * cities.length));
    var randomCity = cities[random];
    var coordinate = [randomCity.lat, randomCity.lng];

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

function saveNewPhoto(o){

    new Photo({
        location: o.location,
        country: o.country,
        tag: o.tag.toLowerCase(),
        id: o.id,
        farm: o.farm,
        secret: o.secret,
        server: o.server,
        isVoted: false,
        votes: 0,
        appearances: 1,
        notTag: false
    }).save();
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
   
        if (err) { throw new Error(err)}
        else {
        var votes = photo.votes + 1;
        photo.update({isVoted: true}, function(){
            photo.update({votes: votes}, function(){
                getPhotos(req, res);
            });
        });
        }
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
    $ = cheerio.load('<div style="width: 300px"><a target="_blank"><img style="padding: 0; margin: 0; width: 300px;"/></a><div class="rating" style="background: #222222; padding: 10px; color: white; position: absolute; z-index: 100; top: 14px; right: 21px; font-weight: bold; font-size: 20px;"></div></div>');
    photos.forEach(function(photo){

        var image = "http://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
        var flickr = "http://flickr.com/photo.gne?id=" + photo.id + "/";

        $('a').attr('href', flickr);
        $('img').attr('src', image);
        $('div.rating').text(photo.ranking);

        var html = $.html();
        var location = {};
        location["lat"] = photo.location[0];
        location["lng"] = photo.location[1];
        location["message"] = html;
        location["ranking"] = photo.ranking;
        locations[photo.id] = location;
    })
    return fn(locations);

}

exports.getWorldJson = function(req, res){
    res.json(world);
};

function checkPointInPolygon(location, coordinates, fn){
    if (gju.pointInPolygon({"type":"Point","coordinates":location}, {"type":"Polygon", "coordinates": coordinates}))
        { return fn(null, true) }
};

function determineWhatCountryPointIsIn(o, fn){
 world.features.forEach(function(country){
                var coordinates =  country.geometry.coordinates;
                checkPointInPolygon([o.location[1], o.location[0]], coordinates, function(err, result){
                    if (result) {
                        o.country = country.id;
                        return fn(null, o);
                    }
                })   
            });
        }
               