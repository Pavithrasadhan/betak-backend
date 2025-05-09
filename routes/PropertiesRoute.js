const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const Amenity = require('../models/Amenity');
const RentalRule = require('../models/Rental');
const authenticate = require('../middleware/authenticate');
const isAdmin = require('../middleware/isAdmin');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find({})
      .populate('owner', 'name email')
      .populate('amenities', 'name icon');

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a property (Admin only)
router.post('/', authenticate, isAdmin, upload.array('images', 20), async (req, res) => {
  try {
    const { name, location, description, amenities, rent, bed, bath, sqft, furnishing, map, rentalRules } = req.body;
    const imagePaths = req.files.map(file => `uploads/${file.filename}`);

    const amenityArray = Array.isArray(amenities) ? amenities : amenities ? [amenities] : [];
    const amenityIds = amenityArray.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (err) {
        return null;
      }
    }).filter(Boolean);

    let rentalRuleId = null;
    if (rentalRules) {
      const newRentalRule = new RentalRule({
        minDays: rentalRules.minDays,
        maxDays: rentalRules.maxDays,
        city: location.city,
        country: location.country,
      });

      await newRentalRule.save();
      rentalRuleId = newRentalRule._id;
    }

    const newProperty = new Property({
      owner: req.user.id,
      name,
      location,
      description,
      amenities: amenityIds,
      rent,
      bed,
      bath,
      sqft,
      furnishing,
      map,
      images: imagePaths,
      rentalRule: rentalRuleId,
    });

    await newProperty.save();
    res.status(201).json(newProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Update a property (Admin only)
router.put('/:id', authenticate, isAdmin, upload.array('images', 20), async (req, res) => {
  try {
    const {
      name, location, description, amenities,
      rent, bed, bath, sqft, furnishing, map,
      existingImages 
    } = req.body;

    const amenityArray = Array.isArray(amenities) ? amenities : amenities ? [amenities] : [];
    const amenityIds = amenityArray.map(id => new mongoose.Types.ObjectId(id));

    const uploadedImages = req.files.map(file => `uploads/${file.filename}`);

    let combinedImages = [];
    if (existingImages) {
      combinedImages = Array.isArray(existingImages)
        ? [...existingImages]
        : [existingImages];
    }
    combinedImages.push(...uploadedImages);

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          location,
          description,
          amenities: amenityIds,
          rent,
          bed,
          bath,
          sqft,
          furnishing,
          map,
          images: combinedImages,
        },
      },
      { new: true }
    );

    if (!property) return res.status(404).json({ message: 'Property not found' });

    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Get a single property by ID
router.get('/:id', async (req, res) => {
  try {
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('amenities', 'name icon');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property); 
  } catch (error) {
    res.status(500).json({ message: error.message });  
  }
});

// Delete a property (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (property.images && property.images.length > 0) {
      property.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete property image
router.delete('/:id/images', authenticate, isAdmin, async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) return res.status(400).json({ message: 'Image path is required' });

    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    property.images = property.images.filter(img => img !== imagePath);
    await property.save();

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json({ message: 'Image deleted successfully', images: property.images });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
