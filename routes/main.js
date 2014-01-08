var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI,
    api = require('../config/api.js'),
    cheerio = require('cheerio'),
    flickr = new FlickrAPI(api.details.key),
    Photo = require('../models/photo.js'),
    Query = require('../models/query.js'),
    gju = require('geojson-utils'),
    cities = require('../config/basiccities.json'),
    _ = require('underscore')
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
            
            // checks if each photo is in database
            Photo.findOne({id: p.id, tag: tag}, function(err, photo){
                // if no photo, checks what country photo is in, then saves photo
                if (err || !photo)
                    { 
                    determineWhatCountryPointIsIn(p, function(p){
                        saveNewPhoto(p, function(err, photo){
                        }); 
                    });
                }
                else { 
                    // if photo already in database appearance count of photo incremented
                    
                    appearances = photo.appearances + 1;
                    // callback necessary to trigger update as per mongoose docs
                    photo.update({appearances:appearances}, function(){ 
                    })
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
    Photo.findOne({id: req.body.photo.id}, function(err, photo){
        if (!err) {
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
            calculatePhotoRanking(photos, function(photos){
                calculateCountryRankings(photos, function(photos){
                         transformPhotoForMap(photos, function(photos){
                            res.json(photos);
                    });
                })
            })
        };
    })
}

function calculatePhotoRanking(photos, fn){
    return fn(_.map(photos, function(photo){
        photo.ranking = ((photo.votes /  photo.appearances) * 100).toFixed(0);
        return photo;
    }));
}

function transformPhotoForMap(photos, fn){
    console.log("Transform photos for map fn " + photos[0].countryAverage + " " + photos[0].ranking)

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
        location["country"] = photo.country;
        location["countryAverage"] = photo.countryAverage;
        locations[photo.id] = location;
    })
    return fn(locations);

}

exports.getWorldJson = function(req, res){
    res.json(world);
};

exports.getPhotosForCountry = function(req, res){
    Photo.find({ country: req.body.country, tag: req.body.tag, isVoted: true}, function(err, photos){
        calculatePhotoRanking(photos, function(photos){
            calculateCountryRankings(photos, function(photos){
                res.json(photos)
            })     
        })
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
    // loops through each country then uses checkPointInPolygon fn (including using cb) to check if point is in particular country
    
    world.features.forEach(function(country){
        if (country.geometry.type === "MultiPolygon"){
            var multicoordinates = country.geometry.coordinates;
            checkPointInMultiPolygon([o.location[1], o.location[0]], multicoordinates, function(err, result){
                if (result) {
                    o.country = country.id;
                    return cb(o);
                }
            })
        } 
        else {
            var coordinates = country.geometry.coordinates;
            checkPointInPolygon([o.location[1], o.location[0]], coordinates, function(err, result){
                if (result) {
                    o.country = country.id;
                    return cb(o);
                }
            })
        }   
    });
}

function calculateCountryRankings(photos, cb){
    return cb(_.flatten(_.map(countrySorter(photos), averager('ranking'))));
}

function createArraySorter(key) {
    return function (arr) {
        var holder = [];
        _.each(_.uniq(_.pluck(arr, key)), function (e) {
            holder.push(_.where(arr, equalToGiven(key, e)));
        });
        return holder;
    };
}

function equalToGiven(key, value) {
    var obj = {};
    obj[key] = value;
    return obj;
}

// return function which adds 'average' property to each object in array, creating average via reduce on value from given key

function averager(key) {
    return function (arr) {
        _.each(arr, function (e) {
            e.countryAverage = _.reduce(_.pluck(arr, key), function (a, b) {
                return a + b / arr.length;
            }, 0);
        });
        return arr;
    };
}

var countrySorter = createArraySorter('country');

function returnData(cb){
    var data = [{
    __v: 0,
    _id: "5285cbd164ac14f121000012",
    appearances: 1,
    country: "RUS",
    farm: 5,
    id: "4297172189",
    isVoted: true,
    notTag: false,
    secret: "925e90a4d9",
    server: "4058",
    tag: "cat",
    votes: 1,
    dateCreated: "2013-11-15T07:22:57.215Z",
    location: [
      53.1666667,
      48.4666667
    ]
  },
  {
    __v: 0,
    _id: "5285cd7364ac14f12100006a",
    appearances: 5,
    country: "RUS",
    farm: 3,
    id: "5732677537",
    isVoted: true,
    notTag: false,
    secret: "762e059973",
    server: "2714",
    tag: "cat",
    votes: 2,
    dateCreated: "2013-11-15T07:29:55.762Z",
    location: [
      56.1333333,
      47.2333333
    ]
  }]
    return cb(null, data);
}

exports.test = function(req, res){
    returnData(function(err, data){
        res.json(data)
    })
}

exports.testTwo = function(req, res){
    returnData(function(err, data){
         calculatePhotoRanking(data, function(data){
                calculateCountryRankings(data, function(data){
                    res.json(data)
                })     
            })
        })
    }

exports.testThree = function(req, res){
    Photo.find({ country:'RUS', tag: 'cat', isVoted: true}, function(err, data){
        res.json(data)
    })
}

exports.testFour = function(req, res){
    Photo.find({ country:'RUS', tag: 'cat', isVoted: true}, function(err, data){
        convertToObjects(data, function(data){
            calculatePhotoRanking(data, function(data){
                calculateCountryRankings(data, function(data){
                    res.json(data)
                })     
            })
        });
    })
};


function convertToObjects(photos, cb){
    return cb(_.map(photos, function(photo){
        return photo.toObject();         
    }))
}