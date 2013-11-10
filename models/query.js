var mongoose = require('mongoose')
   , Schema = mongoose.Schema
   , ObjectId = Schema.ObjectId;

var querySchema = new Schema({
    query: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Query', querySchema);
