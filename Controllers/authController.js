const User = require('../models/userModel');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Item = require('../models/item');
const {sendOTP  , sendPasswordResetSuccess} = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  const { name, rollNumber, email, password } = req.body;
  try {
    const existing = await User.findOne({ rollNumber });
    if (existing) return res.status(409).json({ message: "Roll number already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name, rollNumber, email, password: hashed });
    await newUser.save();

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.log("Error while register", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

exports.signin = async (req, res) => {
  const { rollNumber, password } = req.body;
  try {
    const user = await User.findOne({ rollNumber });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ rollNumber, _id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ message: "Logged out" });
};

exports.forgotPassword = async (req, res) => {
  const { rollNumber, newPassword } = req.body;
  try {
    const user = await User.findOne({ rollNumber });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { rollNumber } = req.user;
  const { name, email, college, branch } = req.body;
  try {
    const user = await User.findOne({ rollNumber });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (college) user.college = college;
    if (branch) user.branch = branch;
    if (req.file) user.image = `/uploads/${req.file.filename}`;

    await user.save();
    res.status(200).json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const { rollNumber } = req.user;
  try {
    const user = await User.findOne({ rollNumber }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getItemsByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await Item.find({ poster: userId }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user items", error: err.message });
  }
};

exports.deleteItemByUser = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.poster.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this item" });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete item", error: err.message });
  }
};

exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpires = expiry;
    await user.save();

    await sendOTP(email, otp); 
    res.status(200).json({ message: "OTP sent to registered email" });
  } catch (err) {
    console.error("Error sending OTP:", err.message);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

exports.verifyAndResetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();
    await sendPasswordResetSuccess(user.email);

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset error:", err.message);
    res.status(500).json({ message: "Password reset failed", error: err.message });
  }
};

exports.verifyOtpOnly = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};

exports.resetPasswordAfterOtp = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();
    await sendPasswordResetSuccess(user.email);

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset error:", err.message);
    res.status(500).json({ message: "Password reset failed", error: err.message });
  }
};


