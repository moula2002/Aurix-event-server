const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  service: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', EnquirySchema);
