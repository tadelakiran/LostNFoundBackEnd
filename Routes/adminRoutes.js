const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/admincontroller");

router.post("/login", adminController.adminlogin);
router.post("/createadmin", adminController.createAdmin);
module.exports = router;
