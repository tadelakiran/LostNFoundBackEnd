const Claim = require("../models/Claim");
const Item = require("../models/item");
const User = require("../models/userModel");
const {
  sendClaimStatusMail,
  sendFoundItemNotification,
  sendFoundApprovalMailToPoster,
} = require("../utils/mailer");

exports.createClaim = async (req, res) => {
  try {
    const { itemId, claimantId, reason, contact } = req.body;
    const proofImage = req.file ? req.file.filename : "";

    const item = await Item.findById(itemId);
    const user = await User.findById(claimantId);
    if (!item || !user)
      return res.status(404).json({ message: "Item or User not found" });

    const exists = await Claim.findOne({ itemId, claimantId });
    if (exists)
      return res.status(409).json({ message: "You already claimed this item" });

    const newClaim = new Claim({
      itemId,
      claimantId,
      reason,
      contact,
      proofImage,
    });

    await newClaim.save();

    // Send Pending mail to claimant if item was lost
    if (item.status === "Lost") {
      await sendClaimStatusMail(
        user.email,
        user.name,
        item.title,
        "Pending",
        reason,
        item._id
      );
    }

    // Notify poster if item is found
    if (item.status === "Found" && item.poster) {
      const owner = await User.findById(item.poster);
      if (owner) {
        await sendFoundItemNotification({
          to: owner.email,
          ownerName: owner.name,
          finderName: user.name,
          itemTitle: item.title,
          whereFound: reason,
          description: contact,
          imageUrl: proofImage
            ? `${process.env.BASE_URL}/uploads/${proofImage}`
            : null,
        });
      }
    }

    res.status(201).json({ message: "Claim submitted", claim: newClaim });
  } catch (err) {
    console.error("Error creating claim:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getClaimsByItem = async (req, res) => {
  try {
    const claims = await Claim.find({ itemId: req.params.id }).populate(
      "claimantId",
      "name email"
    );
    res.status(200).json({ claims });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching claims", error: err.message });
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedClaim = await Claim.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("itemId")
      .populate("claimantId");

    if (!updatedClaim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const item = updatedClaim.itemId;
    const claimant = updatedClaim.claimantId;

    // Send status update to claimant
    if (claimant?.email && item?.title) {
      await sendClaimStatusMail(
        claimant.email,
        claimant.name,
        item.title,
        status,
        updatedClaim.reason,
        item._id
      );
    }

    // Send owner update if status Approved
    if (status === "Approved" && item.poster) {
      const poster = await User.findById(item.poster);
      if (poster?.email) {
        await sendFoundApprovalMailToPoster(
          poster.email,
          poster.name,
          item.title,
          {
            reason: updatedClaim.reason,
            contact: updatedClaim.contact,
            submittedAt: updatedClaim.createdAt,
            proofImage: updatedClaim.proofImage,
          }
        );
      }
    }

    res.status(200).json({ message: "Claim status updated", claim: updatedClaim });
  } catch (err) {
    console.error("Error updating claim status:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllClaims = async (req, res) => {
  try {
    const allClaims = await Claim.find().populate("claimantId").populate("itemId");
    res.status(200).json({ claims: allClaims });
  } catch (err) {
    console.error("❌ Error fetching all claims:", err.message);
    res.status(500).json({ message: "Failed to fetch claims" });
  }
};

