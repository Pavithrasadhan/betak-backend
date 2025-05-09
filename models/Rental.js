const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  beforePictures: {
    type: [String], 
    required: function () {
      return this.status === 'approved' || this.status === 'pending'; 
    },
    validate: [function (value) {
      return value && value.length > 0;
    }, 'Before pictures are required during rental creation or approval.']
  },
  afterPictures: {
    type: [String],
    required: function () {
      return this.status === 'completed'; 
    },
    validate: [function (value) {
      return value && value.length > 0;
    }, 'After pictures are required when rental status is completed.']
  },
  conditionReport: {
    type: String,
    required: false,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  year: { 
    type: Number, 
    required: true 
  }
});

rentalSchema.pre('save', function (next) {
  if (this.isNew) {
    this.year = this.startDate.getFullYear();
  }
  next();
});

rentalSchema.index({ property: 1, user: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Rental', rentalSchema);
