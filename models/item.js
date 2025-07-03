const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  lostDate: { type: Date, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Lost', 'Found'], required: true },
  poster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  images: [String], 
  isEmergency: { type: Boolean, default: false }, 
  building: { type: String },
  reward: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
