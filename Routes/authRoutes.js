const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");
const authMiddleware = require("../Middleware/authMiddleware");
const upload = require("../Middleware/upload");

router.post("/signup", authController.signup);
router.post("/signin", authController.signin);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/send-otp", authController.sendOTP);
router.post("/verify-reset", authController.verifyAndResetPassword);
router.post("/verify-otp", authController.verifyOtpOnly); 
router.post("/reset-password", authController.resetPasswordAfterOtp); 

router.get("/user-items", authMiddleware, authController.getItemsByUser);
router.delete("/user-items/:id", authMiddleware, authController.deleteItemByUser); 
router.put("/update-profile", authMiddleware, upload.single("image"), authController.updateProfile);
router.get("/profile", authMiddleware, authController.getProfile);
router.get("/:id", authController.getUserById); 

module.exports = router;
