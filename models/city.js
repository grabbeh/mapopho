var mongoose = require('mongoose')
   , Schema = mongoose.Schema
   , ObjectId = Schema.ObjectId;

var citySchema = new Schema({
    location: Array,
    city: String
});

module.exports = mongoose.model('City', citySchema);
