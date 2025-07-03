

const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  claimantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: String,
  contact: String,
  proofImage: String,
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Claim", claimSchema);
