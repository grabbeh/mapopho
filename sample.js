
var Photo = require('./models/photo.js')
, mongoose = require('mongoose')
, db = require('./config/db.js');

mongoose.connect('mongodb://' 
  + db.user + ':' 
  + db.pass + '@' 
  + db.host + ':' 
  + db.port + '/' 
  + db.name,
  function(err){
    if (err) {throw new Error(err.stack);}
  });


var id = "7855231994";

Photo.findOne({id: id}, function(err, photo){

    if (err || !photo){ 
        console.log("No photo");

    }
    else { 
        appearances = photo.appearances + 1;
        Photo.update({appearances:appearances})
    }
})


