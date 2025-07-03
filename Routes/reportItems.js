const express = require("express");
const router = express.Router();
const Item = require('../models/item');
const upload = require('../Middleware/upload');

router.post("/", upload.array("images", 1), async (req, res) => {
  try {
    const {
      title,
      category,
      location,
      lostDate,
      description,
      status,
      poster,
      building,
      reward,
      isEmergency
    } = req.body;

    const imagePaths = req.files?.map(file => file.filename) || [];

    const newItem = new Item({
      title,
      category,
      location,
      lostDate,
      description,
      status,
      poster,
      building,
      reward,
      isEmergency: isEmergency === 'true' || isEmergency === true,
      images: imagePaths,
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      message: "Item reported successfully.",
      report: newItem,
    });
  } catch (error) {
    console.error("❌ Error creating item:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const reports = await Item.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("❌ Error fetching items:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const report = await Item.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Item not found" });
    res.json(report);
  } catch (error) {
    console.error("❌ Error fetching item:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
