const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  rollNumber: { type: String, unique: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  image: String,
  college: { type: String, trim: true },
  branch: { type: String, trim: true },

  otp: String,
  otpExpires: Date,
});

module.exports = mongoose.model("User", userSchema);