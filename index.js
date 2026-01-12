const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: ["https://blood-donate-4a1fa.web.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Blood Donate Backend is running!", 
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
});

// API test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working!", 
    status: "success",
    timestamp: new Date().toISOString()
  });
});

// Mock user endpoints for basic functionality
app.get("/users/role/:email", (req, res) => {
  const { email } = req.params;
  console.log("Fetching role for:", email);
  
  res.json({
    email: email,
    role: "donar",
    status: "active",
    name: "Test User"
  });
});

app.post("/users", (req, res) => {
  const userInfo = req.body;
  console.log("User registration:", userInfo);
  
  res.json({
    acknowledged: true,
    insertedId: "mock_id_" + Date.now(),
    message: "User registered successfully"
  });
});

// Mock public requests endpoint
app.get("/public-requests", (req, res) => {
  res.json([
    {
      _id: "1",
      blood_group: "A+",
      recipient_name: "John Doe",
      recipient_district: "Dhaka",
      recipient_upazila: "Dhanmondi",
      donation_status: "pending",
      createdAt: new Date(),
      hospital_name: "Dhaka Medical College",
      donation_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      donation_time: "10:00 AM",
      requester_name: "Jane Smith",
      requester_email: "jane@example.com",
      recipient_district: "Dhaka",
      recipient_upazila: "Dhanmondi",
      full_address: "123 Medical Street, Dhaka",
      request_message: "Urgent blood needed for surgery"
    },
    {
      _id: "2",
      blood_group: "O-",
      recipient_name: "Alice Johnson",
      recipient_district: "Chittagong",
      recipient_upazila: "Panchlaish",
      donation_status: "pending",
      createdAt: new Date(),
      hospital_name: "Chittagong Medical College",
      donation_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      donation_time: "2:00 PM",
      requester_name: "Bob Wilson",
      requester_email: "bob@example.com",
      recipient_district: "Chittagong",
      recipient_upazila: "Panchlaish",
      full_address: "456 Hospital Road, Chittagong",
      request_message: "Emergency blood requirement"
    },
    {
      _id: "3",
      blood_group: "B+",
      recipient_name: "Mike Brown",
      recipient_district: "Sylhet",
      recipient_upazila: "Sylhet Sadar",
      donation_status: "pending",
      createdAt: new Date(),
      hospital_name: "Sylhet MAG Osmani Medical College",
      donation_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      donation_time: "11:30 AM",
      requester_name: "Sarah Davis",
      requester_email: "sarah@example.com",
      recipient_district: "Sylhet",
      recipient_upazila: "Sylhet Sadar",
      full_address: "789 Medical Campus, Sylhet",
      request_message: "Blood needed for cancer treatment"
    }
  ]);
});

// Mock search endpoint
app.get("/search-requests", (req, res) => {
  const { bloodGroup, district, upazila } = req.query;
  
  // Mock filtered results based on query
  let results = [
    {
      _id: "search_1",
      blood_group: bloodGroup || "A+",
      recipient_name: "Search Result User",
      recipient_district: district || "Dhaka",
      recipient_upazila: upazila || "Dhanmondi",
      donation_status: "pending",
      createdAt: new Date(),
      hospital_name: "Search Hospital",
      donation_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      donation_time: "9:00 AM",
      requester_name: "Search Requester",
      requester_email: "search@example.com",
      full_address: "Search Address",
      request_message: "Search result blood request"
    }
  ];
  
  console.log("Search query:", { bloodGroup, district, upazila });
  res.json(results);
});

// Mock stats endpoint
app.get("/admin-stats", (req, res) => {
  res.json({
    totalUsers: 1250,
    totalRequests: 89,
    totalFunding: 15750
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server (only for local development)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Blood Donate Backend running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/`);
    console.log(`🔧 API test: http://localhost:${port}/api/test`);
  });
}

// Export for Vercel
module.exports = app;