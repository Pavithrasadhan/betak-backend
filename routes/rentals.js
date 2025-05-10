const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const RentalSetting = require('../models/RentalSetting');
const Property = require('../models/Property');
const adminMiddleware = require('../middleware/isAdmin');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload');

// Create a new rental
router.post('/', authenticate, async (req, res) => {
  try {
    const { propertyName, startDate, endDate } = req.body;
    const userId = req.user.id;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = (end - start) / (1000 * 60 * 60 * 24);

    if (days < 3 || days > 7) {
      return res.status(400).json({ error: 'Rental duration must be between 3 and 7 days' });
    }

    const property = await Property.findOne({ title: propertyName });
    if (!property) {
      return res.status(400).json({ error: 'Property not found' });
    }

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31);

    const existingRental = await Rental.findOne({
      user: userId,
      property: property._id,
      startDate: { $gte: startOfYear },
      endDate: { $lte: endOfYear },
    });

    if (existingRental) {
      return res.status(400).json({ error: 'You have already rented this property this year' });
    }

    const rental = new Rental({
      property: property._id,
      user: userId,
      startDate,
      endDate,
      year: startDate.getFullYear(),
    });

    await rental.save();
    res.status(201).json(rental);
  } catch (error) {
    console.error('Rental creation failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload before & after pictures and complete rental
router.put('/:id/complete', authenticate, upload.fields([
  { name: 'beforePictures', maxCount: 20 },
  { name: 'afterPictures', maxCount: 20 }
]), async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    if (rental.user.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const beforePictures = req.files?.beforePictures?.map(file => file.filename) || [];
    const afterPictures = req.files?.afterPictures?.map(file => file.filename) || [];
    const conditionReport = req.body.conditionReport || '';

    if (beforePictures.length === 0 || afterPictures.length === 0) {
      return res.status(400).json({ error: 'Both before and after pictures are required' });
    }

    rental.beforePictures = beforePictures;
    rental.afterPictures = afterPictures;
    rental.status = 'completed';
    rental.completedAt = new Date();
    rental.conditionReport = conditionReport;
    rental.year = rental.startDate.getFullYear();

    await rental.save();

    res.json({
      ...rental.toObject(),
      beforePictures: rental.beforePictures.map(file => `/uploads/${file}`),
      afterPictures: rental.afterPictures.map(file => `/uploads/${file}`),
      conditionReport: rental.conditionReport,
    });
  } catch (error) {
    console.error('Complete rental error:', error);
    res.status(500).json({
      error: 'Failed to complete rental',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get rentals for logged-in user
router.get('/my-rentals', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const rentals = await Rental.find({ user: userId })
      .populate('property', 'name')
      .sort({ createdAt: -1 });

    res.json(rentals);
  } catch (err) {
    console.error('Failed to fetch user rentals:', err);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Admin: Get all rentals
router.get('/', authenticate, adminMiddleware, async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('property')
      .populate('user')
      .sort({ createdAt: -1 });

    const rentalsWithImages = rentals.map(rental => {
      return {
        ...rental.toObject(),
        beforePictures: rental.beforePictures.map(file => `https://betak-backend.onrender.com/uploads/${file}`),
        afterPictures: rental.afterPictures.map(file => `https://betak-backend.onrender.com/uploads/${file}`),
      };
    });

    res.json(rentalsWithImages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update rental status
router.put('/:id/status', authenticate, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (!['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const rental = await Rental.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    res.json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete a rental
router.delete('/:id', authenticate, adminMiddleware, async (req, res) => {
  try {
    await Rental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rental deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
