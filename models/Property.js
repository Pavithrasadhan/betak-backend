const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  rent: { type: String, required: true },

  amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
  
  images: [String],

  bed: { type: String, required: true },
  bath: { type: String, required: true },
  sqft: { type: String, required: true },
  furnishing: { type: String, required: true },
  map: { type: String, required: true },
  
  rentalHistory: [
    {
      member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      startDate: Date,
      endDate: Date
    }
  ],

  conditionReports: [
    {
      rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental' },
      before: String,
      after: String,
      timestamp: { type: Date, default: Date.now },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  ],
});

propertySchema.virtual('isRented').get(function() {
  const now = new Date();
  return this.rentalHistory.some(rental => {
    return rental.startDate <= now && rental.endDate >= now;
  });
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
