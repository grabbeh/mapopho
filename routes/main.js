var FlickrAPI = require('../flickrnode/lib/flickr').FlickrAPI
, sys = require('sys')
, api = require('../config/api.js')
, flickr = new FlickrAPI(api.details.key);

exports.home = function(req, res){
  res.render('home');
};

exports.api = function(req, res){
	function searchObject(obj) {
		this.lat = obj.lat;
		this.lon = obj.lon;
		this.license = obj.licenses;
		this.min_date_upload = 946706400;
		this.tags = obj.tag;
	}

	var sO = new searchObject(req.body);
	flickr.photos.search(sO, function(error, results) {
		if (error){
			res.status(500);
			res.send();
		}
		else {
		if (results.pages === 0){
			res.status(204);
			res.send();
		}
		else {
			res.json(results);
		}
		}
		
	});
}

exports.privacy = function(req, res){
  res.render('privacy');
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

