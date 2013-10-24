var http = require("http");

var Request= function Request(api_key) {
    this._configure(api_key);
    this.baseUrl= "/services/rest";  
};

Request.prototype._configure= function(api_key) {
    this.api_key= api_key;
};

Request.prototype.executeRequest= function(method, arguments, sign_it, result_mapper, callback) {
      
    var argumentString = "";
    var api_sig= undefined;
    if( arguments === undefined )  arguments = {};

    // apply default arguments 
    arguments.format= "json";
    arguments.nojsoncallback= "1";

        arguments.api_key= this.api_key;
        arguments["method"]= method;
           
    var operator= "?";
    for(var key in arguments) {
        argumentString+= (operator + key + "=" + arguments[key]);
        if( operator == "?" ) operator= "&";
    }

    var reqOptions = {
    method: 'GET',
    port: 80,
    hostname:"api.flickr.com",
    path: this.baseUrl + argumentString
    }

    var req = http.request(reqOptions, function (response) {
       
        var result= "";
        response.setEncoding("utf8");
        response.addListener("data", function (chunk) {
          result+= chunk;
        });
        response.addListener("end", function () {   
            // Bizarrely Flickr seems to send back invalid JSON (it escapes single quotes in certain circumstances?!?!!?)
            // We fix that here.
            if( result ) {  
                result= result.replace(/\\'/g,"'");
            }
                var res= JSON.parse(result);
                if( res.stat && res.stat == "ok" ) {
                    // Munge the response to strip out the stat and just return the response value
                    for(var key in res) {
                        if( key !== "stat" ) {
                            res= res[key];
                        }
                    }
                    if( result_mapper ) {
                        res= result_mapper(res);
                    }
                    callback(null, res);
                } 
                else {
                    callback({code: res.code, message: res.message});
                }
            
        });
    });       
    req.end();
};

exports.Request = Request;