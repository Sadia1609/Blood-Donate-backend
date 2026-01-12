const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Simple test routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Blood Donate Backend is running!", 
    timestamp: new Date().toISOString() 
  });
});

app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working!", 
    status: "success" 
  });
});

// Mock data for testing
app.get("/public-requests", (req, res) => {
  res.json([
    {
      _id: "1",
      blood_group: "A+",
      recipient_name: "John Doe",
      recipient_district: "Dhaka",
      recipient_upazila: "Dhanmondi",
      donation_status: "pending",
      createdAt: new Date()
    }
  ]);
});

// Mock user endpoints for authentication
app.get("/users/role/:email", (req, res) => {
  const { email } = req.params;
  res.json({
    email: email,
    role: "donar",
    status: "active"
  });
});

app.post("/users", (req, res) => {
  const userInfo = req.body;
  console.log("User registration:", userInfo);
  res.json({
    acknowledged: true,
    insertedId: "mock_id_" + Date.now()
  });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📡 API endpoints available at http://localhost:${port}/api/test`);
});