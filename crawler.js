var //request = require('request'),
  cheerio = require('cheerio')
, City = require('./models/city.js')
, geocoder = require('geocoder')
, fs = require('fs')
, mongoose = require('mongoose')
, db = require('./config/db.js')
, cityarray = require('./cityarray.js')
, _ = require('underscore');
/*
mongoose.connect('mongodb://' 
  + db.user + ':' 
  + db.pass + '@' 
  + db.host + ':' 
  + db.port + '/' 
  + db.name,
  function(err){
    if (err) {throw new Error(err.stack);}
  });

//var throttledCallbackFunction = _.throttle(processGeocoderData, 1000)
*/
returnCityArray(cityarray, function(cityobjectarray){
	fs.writeFileSync('./config/cityobjectarray.json', cityobjectarray);
})

function returnCityArray(cityarray, fn){
	var cityobjectarray = [];
	cityarray.forEach(function(city, i){
		//console.log("Index = " + i + ", City = " + city);
		var cityobject = {
			address: city
		};
		
		console.log(cityobject);
		cityobjectarray.push(JSON.stringify(cityobject));
		//setTimeout(geocoder.geocode(city, throttledCallbackFunction), 1000);
	});
	return fn(cityobjectarray);
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

