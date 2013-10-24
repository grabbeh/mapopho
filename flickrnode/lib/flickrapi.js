var Request= require("./request").Request,
    Photos= require("./photos").Photos

var FlickrAPI= function FlickrAPI(api_key) {
    this._configure(api_key);
};

FlickrAPI.prototype._configure= function(api_key) { 
    this.api_key= api_key;
    this._request= new Request(api_key);
    this.photos= new Photos(this._request);
};
    
exports.FlickrAPI = FlickrAPI;
