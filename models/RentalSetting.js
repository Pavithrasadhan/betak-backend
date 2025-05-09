const mongoose = require('mongoose');

const rentalSettingSchema = new mongoose.Schema({
  country: { type: String, required: true },
  city: { type: String },
  minDuration: { type: Number, required: true, min: 3 },
  maxDuration: { type: Number, required: true, max: 7 }
});

module.exports = mongoose.model('RentalSetting', rentalSettingSchema);