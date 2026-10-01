const express = require('express');
const mongoose = require('mongoose');
const Enquiry = require('./models/Enquiry');
const Admin = require('./models/Admin');
const GalleryItem = require('./models/GalleryItem');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/'); },
  filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("FATAL ERROR: MONGODB_URI is not defined.");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.send('Aurix Server is running!');
});



// Dashboard API Route
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalEnquiries = await Enquiry.countDocuments();
    const newEnquiries = await Enquiry.countDocuments({ status: 'New' });
    const contactedEnquiries = await Enquiry.countDocuments({ status: 'Contacted' });

    // Mock chart data for visualization, optionally can be dynamic based on created dates
    const chartData = [
      { name: 'Jan', value: 12 },
      { name: 'Feb', value: 19 },
      { name: 'Mar', value: 15 },
      { name: 'Apr', value: 22 },
      { name: 'May', value: 18 },
      { name: 'Jun', value: 25 },
      { name: 'Jul', value: totalEnquiries + 5 },
    ];

    const recentEnquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(4);

    res.json({
      stats: [
        { label: 'Total Enquiries', value: totalEnquiries, change: '+12%', isPositive: true },
        { label: 'New Enquiries', value: newEnquiries, change: '+5', isPositive: true },
        { label: 'Contacted', value: contactedEnquiries, change: '+2', isPositive: true },
        { label: 'Conversion Rate', value: totalEnquiries ? ((contactedEnquiries/totalEnquiries)*100).toFixed(1) + '%' : '0%', change: '+1.2%', isPositive: true }
      ],
      chartData,
      recentEnquiries
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Enquiries API Routes
app.get('/api/enquiries', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

app.post('/api/enquiries', async (req, res) => {
  try {
    const newEnquiry = new Enquiry(req.body);
    await newEnquiry.save();
    res.status(201).json(newEnquiry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

// Gallery API Routes
app.get('/api/gallery', async (req, res) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

app.post('/api/gallery', upload.single('image'), async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const newItem = new GalleryItem({ title, category, imageUrl });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

app.delete('/api/gallery/:id', async (req, res) => {
  try {
    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.put('/api/gallery/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, category } = req.body;
    let updateData = { title, category };
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    const updatedItem = await GalleryItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aurix.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'aurixadmin';

  if (email === adminEmail && password === adminPassword) {
    try {
      // Check if admin exists in database, if not create it automatically
      let admin = await Admin.findOne({ email: adminEmail });
      if (!admin) {
        admin = new Admin({ email: adminEmail, password: adminPassword });
        await admin.save();
        console.log('Admin user automatically added to database');
      }

      const token = jwt.sign({ role: 'admin', id: admin._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
      return res.json({ token, email: admin.email, message: 'Login successful' });
    } catch (err) {
      console.error('Error during admin DB operation:', err);
      return res.status(500).json({ error: 'Database error during login' });
    }
  } else {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
});

// Admin Profile Route
app.get('/api/admin/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    const namePart = admin.email.split('@')[0];
    const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const initials = displayName.substring(0, 2).toUpperCase();
    
    res.json({ email: admin.email, name: displayName, initials: initials });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
