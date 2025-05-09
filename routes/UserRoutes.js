const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const User = require('../models/User');
const upload = require('../middleware/upload'); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Rental = require('../models/Rental');

// GET /user/me
router.get('/me', authenticate, async (req, res) => {
    try {

      const user = await User.findById(req.user.id)
        .populate({
          path: 'favorites',
          select: 'title description imageUrl'
        });
  
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        favorites: user.favorites || []
      };
  
      res.json({ user: userResponse });
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Server error" });
    }
  });


// POST /user/favorites
router.post('/favorites', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { propertyId } = req.body;

        const user = await User.findById(userId);

        if (!user.favorites || !Array.isArray(user.favorites)) {
            user.favorites = [];
        }

        if (!user.favorites.includes(propertyId)) {
            user.favorites.push(propertyId);
            await user.save();
        }

        res.json({ message: 'Property saved to favorites' });
    } catch (error) {
        console.error("Favorites Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});
  

// PUT /user/:id - Update user details
router.put('/:id', upload.fields([
    { name: 'passportFirstPage', maxCount: 1 },
    { name: 'passportSecondPage', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, balance } = req.body;
        const user = await User.findById(id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = name || user.name;
        user.email = email || user.email;
        user.password = password ? await bcrypt.hash(password, 10) : user.password;
        user.role = role || user.role;

        if (req.files.passportFirstPage) {
            user.passportFirstPage = req.files.passportFirstPage[0].path;
        }
        if (req.files.passportSecondPage) {
            user.passportSecondPage = req.files.passportSecondPage[0].path;
        }

        await user.save();

        res.status(200).json({ message: 'User updated successfully', user });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// GET all users (admin only)
router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /user/:id - Get user by userId
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await User.findById(id)
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get User by ID Error:', error.stack);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// DELETE /user/delete/:id - Delete user
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
