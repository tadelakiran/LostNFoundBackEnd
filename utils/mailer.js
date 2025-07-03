const nodemailer = require("nodemailer");
const Item = require("../models/item");
const User = require("../models/userModel");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

exports.sendClaimStatusMail = async (to, name, itemTitle, status, reason, itemId) => {
  let posterDetailsHtml = "";

  if (status === "Approved" && itemId) {
    try {
      const item = await Item.findById(itemId);
      const poster = await User.findById(item?.poster);
      if (poster) {
        posterDetailsHtml = `
          <div style="margin-top: 20px;">
            <h3 style="color: #0077b6;">Item Owner Details</h3>
            <p><strong>Name:</strong> ${poster.name}</p>
            <p><strong>Email:</strong> ${poster.email}</p>
          </div>`;
      }
    } catch (err) {
      console.error("Error fetching poster details:", err);
    }
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #f9fcff; padding: 24px; border-radius: 12px; border: 1px solid #d4eaff;">
      <h2 style="color: #0077b6;">🔔 Claim Status Notification</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your claim for the item <strong>"${itemTitle}"</strong> has been <strong style="color:${status === 'Approved' ? '#28a745' : '#d90429'};">${status}</strong>.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      ${posterDetailsHtml}
      <p style="margin-top: 25px; font-style: italic; color: #555;">Because Every Item Deserves a Way Home...</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Lost and Found" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Claim ${status}: "${itemTitle}"`,
    html: htmlContent,
  });
};

exports.sendFoundItemNotification = async ({ to, ownerName, finderName, itemTitle, whereFound, description, imageUrl }) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #e0f4f9; padding: 24px; border-radius: 12px; border: 1px solid #b5e2ef;">
      <h2 style="color: #0077b6;">📦 Item Possibly Found!</h2>
      <p>Hi <strong>${ownerName}</strong>,</p>
      <p><strong>${finderName}</strong> has reported a found item matching <strong>"${itemTitle}"</strong>.</p>
      <p><strong>Found At:</strong> ${whereFound}</p>
      <p><strong>Description:</strong> ${description}</p>
      ${imageUrl ? `<img src="${imageUrl}" style="margin-top: 10px; max-width: 100%; border-radius: 8px;" />` : ""}
      <p style="margin-top: 20px; font-style: italic;">Let’s reunite items with their rightful owners 🧭</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Lost and Found" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Found: Possible Match for "${itemTitle}"`,
    html: htmlContent,
  });
};

exports.sendFoundApprovalMailToPoster = async (to, posterName, itemTitle, details) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; background: #f4fbff; padding: 24px; border-radius: 12px; border: 1px solid #cfefff;">
      <h2 style="color: #0077b6;">✅ Your Lost Item May Be Found!</h2>
      <p>Dear <strong>${posterName}</strong>,</p>
      <p>Your item <strong>"${itemTitle}"</strong> may have been found. Here are the details submitted:</p>
      <ul>
        <li><strong>Where:</strong> ${details.reason}</li>
        <li><strong>Contact Info:</strong> ${details.contact}</li>
        <li><strong>Submitted:</strong> ${new Date(details.submittedAt).toLocaleString()}</li>
      </ul>
      ${details.proofImage ? `<img src="${process.env.BASE_URL || "http://localhost:5000"}/uploads/${details.proofImage}" style="margin-top: 12px; max-width: 100%; border-radius: 8px;" />` : ""}
      <p style="margin-top: 20px; font-style: italic;">Keep an eye on your inbox for next steps.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Lost and Found" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Found Claim Submitted: "${itemTitle}"`,
    html: htmlContent,
  });
};

exports.sendOTP = async (email, otp) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #fffef6; padding: 24px; border-radius: 12px; border: 1px solid #f4e6aa;">
      <h2 style="color: #0077b6;">🔐 Password Reset OTP</h2>
      <p>Your OTP for password reset is:</p>
      <h1 style="color: #0077b6; font-size: 36px;">${otp}</h1>
      <p>This code is valid for <strong>10 minutes</strong>.</p>
      <p style="margin-top: 20px; font-size: 13px; color: #555;">If you didn’t request this, please ignore this message.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Lost and Found" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Password Reset",
      html: htmlContent,
    });
    console.log(`✅ OTP sent to ${email}`);
  } catch (err) {
    console.error("❌ OTP Email failed:", err.message);
  }
};

exports.sendPasswordResetSuccess = async (email) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #eaf6f6; padding: 24px; border-radius: 12px; border: 1px solid #bfe0e0;">
      <h2 style="color: #0077b6;">🔒 Password Changed Successfully</h2>
      <p>Your password has been updated successfully.</p>
      <p>If you didn’t request this change, please contact support immediately.</p>
      <p style="margin-top: 20px; font-size: 13px; color: #666;">Thank you for staying secure with Lost & Found Portal.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Lost and Found" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Password Changed Confirmation",
      html: htmlContent,
    });

    console.log(`✅ Confirmation email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send password confirmation:", err.message);
  }
};



