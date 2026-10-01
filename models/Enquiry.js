const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: false },
  email: { type: String, required: true },
  service: { type: String, required: false },
  message: { type: String, required: false },
  date: { type: String },
  status: { type: String, default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', EnquirySchema);
