var //request = require('request'),
  cheerio = require('cheerio')
, City = require('./models/city.js')
, geocoder = require('geocoder')
, fs = require('fs');


var html = fs.readFileSync('./config/cities.html').toString();
var $ = cheerio.load(html);
var cities = [];
$('tr').map(function(i, tr){
	city = this.children().first().text();
	geocoder.geocode(city, processGeocoderData)
})

/*
function processHTML(err, response, html){
	if (err) { console.log(err)}
    var $ = cheerio.load(html);
	$('tr').map(function(i, tr){
		city = this.children().first().text();
		geocoder.geocode(city, processGeocoderData)
	})
}*/

function processGeocoderData(err, data){
	if (err) { console.log(err)}
	else if (data.status == "OVER_QUERY_LIMIT" || "ZERO_RESULTS") { console.log("No results or over query limit")}
	else {
		location = [data.results[0].geometry.location.lat, data.results[0].geometry.location.lng];
		    new City({
		    	city: city, 
		    	location: location 
		}).save(function(err){
		    if (err) { console.log(err)}
		});
	}
}


//var domain = "http://www.mongabay.com/cities_pop_01.htm";
//request(domain, processHTML);