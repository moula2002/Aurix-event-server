const mongoose = require('mongoose');

const GalleryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  imageBase64: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('GalleryItem', GalleryItemSchema);
