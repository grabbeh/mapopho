var mongoose = require('mongoose')
   , Schema = mongoose.Schema
   , ObjectId = Schema.ObjectId;

var coordinateSchema = new Schema({
    coordinate: Array,
    coordinateTwo: Array
});

module.exports = mongoose.model('Coordinate', coordinateSchema);
