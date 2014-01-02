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
                    checkIfPhotoIsInDB(tag, photo, function(photo){
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
            checkIfPhotoIsInDB(tag, photos, function(photos){
                res.json(photos);
            })
        })
    })
}

function checkIfPhotoIsInDB(tag, photos, fn){
    if (photos.length > 2){ photos.pop();}
    // provided with an array of photo objects
    photos.forEach(function(p, i){
            console.log("Iteration " + i)
            // checks if each photo is in database
            Photo.findOne({id: p.id, tag: tag}, function(err, photo){
                // if no photo, checks what country photo is in, then saves photo
                if (err || !photo)
                    { 
                    determineWhatCountryPointIsIn(p, function(p){
                        console.log("determineWhatCountryfunc returned with " + p.country);
                        saveNewPhoto(p, function(err, photo){
                        console.log("Photo saved with ID " + photo.id + " " + photo.country);
                        }); 
                    });
                }
                else { 
                    // if photo already in database appearance count of photo incremented
                    console.log("Photo in DB - photo to be updated")
                    appearances = photo.appearances + 1;
                    // callback necessary to trigger update as per mongoose docs
                    photo.update({appearances:appearances}, function(){ 
                    console.log("Photo already in DB and appearances updated")})
                    }
                });
            });
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

function saveNewPhoto(o, fn){
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
    console.log("Photo to be voted on with ID = " + req.body.photo.id);
    Photo.findOne({id: req.body.photo.id}, function(err, photo){
        if (err || !photo) { console.log("Error returning photo to be voted on " + err)}
        else {
        var votes = photo.votes + 1;
        photo.update({isVoted: true}, function(){
            photo.update({votes: votes}, function(){
                getPhotos(req, res);
            });
        });
    }
    });  
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

exports.getPhotosForCountry = function(req, res){
    console.log(req.body.country);
    Photo.find({ country: req.body.country, tag: req.body.tag, isVoted: true}, function(err, photos){
        if (!err) { res.json(photos) };
    });
};

function checkPointInPolygon(location, coordinates, cb){
    // returns true if point is in polygon, with result then wrapped in function for callback
    if (gju.pointInPolygon({"type":"Point","coordinates":location}, {"type":"Polygon", "coordinates": coordinates}))
        { return cb(null, true); }
        else { err = new Error("No polygon found")
        return cb(err)}
};

function checkPointInMultiPolygon(location, arrayofmulticoordinates, cb){
    arrayofmulticoordinates.forEach(function(coordinates){
        if (gju.pointInPolygon({"type":"Point","coordinates":location}, {"type":"Polygon", "coordinates": coordinates}))
        { return cb(null, true); }
        else { 
            err = new Error("No polygon found")
            return cb(err)
        }
    })
}

function determineWhatCountryPointIsIn(o, cb){
    console.log(world.features.length);
    // loops through each country then uses checkPointInPolygon fn (including using cb) to check if point is in particular country
    
    world.features.forEach(function(country){
        if (country.geometry.type === "MultiPolygon"){
            var multicoordinates =  country.geometry.coordinates;
            checkPointInMultiPolygon(location, multicoordinates, function(err, result){
                if (result) {
                    o.country = country.id;
                    return cb(o);
                }
            })
        } 
        else {
            var coordinates = country.geometry.coordinates;
            checkPointInPolygon(location, coordinates, function(err, result){
                if (result) {
                    console.log("Point in country " + country.id)
                    o.country = country.id;
                    return cb(o);
                }
            })
        }   
    });
}

               