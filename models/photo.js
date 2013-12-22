var mongoose = require('mongoose')
   , Schema = mongoose.Schema
   , ObjectId = Schema.ObjectId;

var photoSchema = new Schema({
    location: Array,
    country: String,
    tag: String,
    id: String,
    farm: Number,
    secret: String,
    server: String,
    isVoted: Boolean,
    votes: Number,
    appearances: Number,
    notTag: Boolean,
    dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Photo', photoSchema);
