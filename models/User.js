const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, trim: true },
  passportFirstPage: { type: String, required: true },
  passportSecondPage: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'tenant'], default: 'tenant' },

  rentedProperty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
  },
  

  favorites: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }]

}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;
