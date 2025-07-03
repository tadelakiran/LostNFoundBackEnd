require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./Routes/authRoutes");
const claimRoutes = require("./Routes/claimsRoutes");
const reportRoutes = require("./Routes/reportItems");
const adminRoutes = require("./Routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 
app.use("/images", express.static(path.join(__dirname, "public", "images"))); 


app.use("/api/auth", authRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin" , adminRoutes);

app.get("/", (req, res) => {
  res.send(" Lost & Found Server is running!");
});

mongoose.set("strictQuery", false); 

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" MongoDB connected");
    app.listen(PORT, () =>
      console.log(` Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error(" MongoDB connection error:", err));
