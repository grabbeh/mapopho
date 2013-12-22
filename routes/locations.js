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
    	 	var location = [p.location[1], p.location[0]];
    		world.features.forEach(function(country){
                var coordinates =  country.geometry.coordinates;
    			checkPointInPolygon(location, coordinates, function(err, result){
                    if (result) {
                        Photo.update({id: p.id}, {country: country.id}, function(){});
                    }
                }) 	 
    		});
    	});
    });


function checkPointInPolygon(location, coordinates, fn){
    if (gju.pointInPolygon({"type":"Point","coordinates":location}, {"type":"Polygon", "coordinates": coordinates}))
        { return fn(null, true) }
}

   