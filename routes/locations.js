var Photo = require('../models/photo.js'),
	gju = require('geojson-utils')
    cities = require('../config/basiccities.json'),
    world = require('../geojson/world.json'),
    mongoose = require('mongoose'),
    db = require('../config/db.js');


    mongoose.connect('mongodb://' 
	  + db.user + ':' 
	  + db.pass + '@' 
	  + db.host + ':' 
	  + db.port + '/' 
	  + db.name,
    function(err){
    	if (err) {throw new Error(err.stack);}
  	});

    Photo.find({}, function(err, photos){
    	 photos.forEach(function(p, i){
            console.log(i);
    	 	var location = [p.location[1], p.location[0]];
    		world.features.forEach(function(country){
                if (country.geometry.type === "MultiPolygon"){

                    var multicoordinates =  country.geometry.coordinates;
                    checkPointInMultiPolygon(location, multicoordinates, function(err, result){
                        if (result) {
                            Photo.update({id: p.id}, {country: country.id}, function(){});
                        }
                    })
                }
                else {
                    var coordinates = country.geometry.coordinates;
                    checkPointInPolygon(location, coordinates, function(err, result){
                        if (result) { 
                            Photo.update({id: p.id}, {country: country.id}, function(){});
                        }
                    })
                }   
            });
    	});
    });


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

   