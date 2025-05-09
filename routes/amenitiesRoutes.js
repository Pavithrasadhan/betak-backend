const express = require('express');
const router = express.Router();
const Amenities = require('../models/Amenity');
const authenticate = require('../middleware/authenticate');
const isAdmin = require('../middleware/isAdmin');

// CREATE Amenity (Admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
    try {
      const { name, icon } = req.body; 
      if (!name) {
        return res.status(400).json({ message: 'Amenity name is required' });
      }
  
      const newAmenity = new Amenities({ name, icon });
      await newAmenity.save();
      res.status(201).json(newAmenity);
    } catch (err) {
      res.status(500).json({ message: 'Failed to create amenity', error: err.message });
    }
  });

// READ all Amenities
router.get('/', async (req, res) => {
  try {
    const amenities = await Amenities.find();
    res.status(200).json(amenities);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch amenities', error: err.message });
  }
});

// READ single Amenity by ID
router.get('/:id', async (req, res) => {
  try {
    const amenity = await Amenities.findById(req.params.id);
    
    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found' });
    }

    res.status(200).json(amenity);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch amenity', error: err.message });
  }
});


// UPDATE Amenity (Admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, icon } = req.body;
    const amenity = await Amenities.findByIdAndUpdate(req.params.id, { name, icon }, { new: true });

    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found' });
    }

    res.status(200).json(amenity);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update amenity', error: err.message });
  }
});

// DELETE Amenity (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const amenity = await Amenities.findByIdAndDelete(req.params.id);

    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found' });
    }

    res.status(200).json({ message: 'Amenity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete amenity', error: err.message });
  }
});

module.exports = router;
