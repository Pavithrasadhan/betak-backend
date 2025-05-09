const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String }, 
});

module.exports = mongoose.model('Amenity', amenitySchema);
