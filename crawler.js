var //request = require('request'),
  cheerio = require('cheerio')
, City = require('./models/city.js')
, geocoder = require('geocoder')
, fs = require('fs')
, mongoose = require('mongoose')
, db = require('./config/db.js')
, cityarray = require('./config/cities.json')
, _ = require('underscore');

mongoose.connect('mongodb://' 
  + db.user + ':' 
  + db.pass + '@' 
  + db.host + ':' 
  + db.port + '/' 
  + db.name,
  function(err){
    if (err) {throw new Error(err.stack);}
  });


createBriefArray(cityarray, function(cities){

	fs.writeFile('./config/basiccities.json', cities, function(err){
		
	})
})


function createBriefArray(cityarray, fn){
	cities = [];
	cityarray.forEach(function(item){
		var city = {
			location: item.address,
			lat: item.GeocodeLat,
			lng: item.GeocodeLng
		}
        cities.push(city);

	})
	cities = JSON.stringify(cities);
	return fn(cities)
}

function processGeocoderData(err, data){
	console.log(data);
	if (err) { console.log(err)}
	else if (data.status == "OVER_QUERY_LIMIT") { console.log("Over query limit")}
	else  {
		var location = [data.results[0].geometry.location.lat, 
		                data.results[0].geometry.location.lng];
		new City({
			city: data.results[0].formatted_address, 
			location: location 
		}).save();
	}
}

