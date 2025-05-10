const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS Configuration
const corsOptions = {
  origin: 'https://betak-front.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});

// Routes
const auth = require('./routes/auth');
const PropertiesRoute = require('./routes/PropertiesRoute');
const UserRoutes = require('./routes/UserRoutes');
const rentalRoutes = require('./routes/rentals');
const amenitiesRoutes = require('./routes/amenitiesRoutes');
const stripeRoutes = require('./routes/stripe');
const contactRoutes = require('./routes/contactRoutes');

app.use('/api/auth', auth);
app.use('/api/properties', PropertiesRoute);
app.use('/api/user', UserRoutes);
app.use('/api/rental', rentalRoutes);
app.use('/api/amenities', amenitiesRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/contact', contactRoutes);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
