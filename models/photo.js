var mongoose = require('mongoose')
   , Schema = mongoose.Schema
   , ObjectId = Schema.ObjectId;

var photoSchema = new Schema({
    location: Array,
    location: Array,
    tag: String,
    id: String,
    farm: Number,
    secret: String,
    server: String,
    isVoted: Boolean,
    votes: Number,
    appearances: Number,
    notTag: Boolean
});

module.exports = mongoose.model('Photo', photoSchema);
