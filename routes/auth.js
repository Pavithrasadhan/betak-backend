const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../middleware/upload');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET;
if (!secretKey) throw new Error("JWT_SECRET is not defined");

// Register
router.post('/register', upload.fields([
    { name: 'passportFirstPage', maxCount: 1 },
    { name: 'passportSecondPage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
  
      if (!req.files.passportFirstPage || !req.files.passportSecondPage) {
        return res.status(400).json({ message: 'Both passport images are required' });
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already exists' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role: role || 'tenant',
        passportFirstPage: req.files.passportFirstPage[0].path,
        passportSecondPage: req.files.passportSecondPage[0].path
      });
  
      await newUser.save();
  
      const user = newUser.toObject();
      delete user.password;
  
      const token = jwt.sign({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }, secretKey, { expiresIn: '1h' });
  
      res.status(201).json({ user, token });
  
    } catch (error) {
      console.error("Registration Error:", error);
      res.status(500).json({ message: error.message });
    }
  });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const payload = { id: user._id, role: user.role }; 
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    const{password: userPassword, ...userInfo} = user

    res.cookie("token", token, { httpOnly: true })

    // Return the token
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', async(req, res) => {
  res.clearCookie("token").status(200).json({message: "Logout successfully"});
})


module.exports = router;
