const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.createAdmin = async (req, res) => {
  const { adminId, password } = req.body;
  console.log("Creating admin with ID:", adminId);

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({ adminId, password: hashedPassword });

    res.status(201).json({
      message: "Admin created successfully",
      adminId: newAdmin.adminId,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Admin ID already exists" });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.adminlogin = async (req, res) => {
  const { adminId, password } = req.body;

  try {
    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(401).json({ message: "Invalid ID or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid ID or password" });
    }

    const token = jwt.sign(
      { id: admin._id, adminId: admin.adminId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
