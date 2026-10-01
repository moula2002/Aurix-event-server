const mongoose = require('mongoose');
require('dotenv').config();
const GalleryItem = require('./models/GalleryItem');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    await GalleryItem.deleteMany({});
    console.log('All dummy gallery items deleted successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
