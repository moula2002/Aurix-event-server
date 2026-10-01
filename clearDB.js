require('dotenv').config();
const mongoose = require('mongoose');
const Enquiry = require('./models/Enquiry');

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    await Enquiry.deleteMany({});
    console.log('Successfully cleared dummy enquiries from database');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
