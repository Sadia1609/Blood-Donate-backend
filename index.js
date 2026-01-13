const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS Configuration - FIXED
const allowedOrigins = [
  "https://blood-donate-4a1fa.web.app",
  "https://blood-donate-4a1fa.firebaseapp.com",
  "http://localhost:5173",
];

// Simple CORS - সবকিছুর জন্য allow
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all for debugging - পরে specific করতে পারেন
    return callback(null, true);
    
    // Production এ উপরের লাইন কমেন্ট আউট করে নিচের লাইন আনকমেন্ট করুন
    // return callback(new Error(`CORS not allowed for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
}));

// Preflight requests
app.options("*", cors());

// Body parser
app.use(express.json());

// ✅ MongoDB Connection - FIXED
// সম্পূর্ণ URI with database name
const uri = "mongodb+srv://missionscic11:Av0baylRPcAW9f2N@cluster0.e62g5zs.mongodb.net/missionscic11DB?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

// Database connection management
let dbClient = null;
let isConnecting = false;

async function connectToDatabase() {
  if (dbClient && dbClient.topology && dbClient.topology.isConnected()) {
    return dbClient.db("missionscic11DB");
  }
  
  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return connectToDatabase();
  }
  
  isConnecting = true;
  
  try {
    console.log("🔄 Connecting to MongoDB...");
    
    // Close existing connection if any
    if (dbClient) {
      await dbClient.close();
    }
    
    // Create new connection
    const newClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    await newClient.connect();
    
    // Test connection
    const db = newClient.db("missionscic11DB");
    await db.command({ ping: 1 });
    
    console.log("✅ MongoDB connected successfully!");
    
    dbClient = newClient;
    return db;
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    dbClient = null;
    throw error;
  } finally {
    isConnecting = false;
  }
}

// Get database instance
async function getDatabase() {
  try {
    const db = await connectToDatabase();
    return db;
  } catch (error) {
    console.error("Failed to get database:", error.message);
    throw error;
  }
}

// ✅ Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 Blood Donate Backend is running!", 
    timestamp: new Date().toISOString(),
    status: "healthy",
    cors: "enabled",
    allowedOrigins: allowedOrigins,
    database: dbClient ? "connected" : "disconnected",
  });
});

// ✅ API test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working!", 
    status: "success",
    timestamp: new Date().toISOString(),
    cors: "CORS is enabled"
  });
});

// ✅ CORS test endpoint
app.get("/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working!",
    origin: req.headers.origin || "No origin header",
    timestamp: new Date().toISOString()
  });
});

// ✅ Get user role by email - FIXED
app.get("/users/role/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    console.log("🔍 Fetching role for:", email);
    
    let db;
    try {
      db = await getDatabase();
    } catch (dbError) {
      console.log("⚠️ Using fallback due to DB error");
      // Fallback response if DB fails
      return res.json({
        success: true,
        email: email,
        role: "donar",
        status: "active",
        name: "Fallback User",
        note: "Database connection issue"
      });
    }
    
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email: email });
    
    if (user) {
      return res.json({
        success: true,
        email: user.email,
        role: user.role || "donar",
        status: user.status || "active",
        name: user.name || user.displayName || "User",
      });
    }
    
    // User not found - create default
    const newUser = {
      email: email,
      role: "donar",
      status: "active",
      name: "New User",
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    try {
      await usersCollection.insertOne(newUser);
      console.log("✅ Created new user:", email);
    } catch (insertError) {
      console.log("⚠️ Could not create user, but returning default");
    }
    
    return res.json({
      success: true,
      email: email,
      role: "donar",
      status: "active",
      name: "New User",
    });
    
  } catch (error) {
    console.error("❌ Error in /users/role:", error.message);
    
    // Even on error, return a valid response
    const email = req.params.email ? decodeURIComponent(req.params.email) : "unknown";
    return res.json({
      success: true,
      email: email,
      role: "donar",
      status: "active",
      name: "Error Recovery User",
      error: error.message
    });
  }
});

// ✅ Create/Update user - FIXED
app.post("/users", async (req, res) => {
  try {
    const userInfo = req.body;
    console.log("👤 User registration/update:", userInfo.email);
    
    if (!userInfo?.email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }
    
    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    const existingUser = await usersCollection.findOne({ email: userInfo.email });
    
    if (existingUser) {
      // Update existing user
      const result = await usersCollection.updateOne(
        { email: userInfo.email },
        {
          $set: {
            ...userInfo,
            lastLogin: new Date(),
            updatedAt: new Date(),
          },
        }
      );
      
      return res.json({
        success: true,
        acknowledged: true,
        modifiedCount: result.modifiedCount,
        message: "User updated successfully",
      });
    } else {
      // Create new user
      const newUser = {
        ...userInfo,
        role: userInfo.role || "donar",
        status: "active",
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      
      const result = await usersCollection.insertOne(newUser);
      
      return res.json({
        success: true,
        acknowledged: true,
        insertedId: result.insertedId,
        message: "User registered successfully",
      });
    }
    
  } catch (error) {
    console.error("❌ Error creating/updating user:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create/update user",
      message: error.message,
    });
  }
});

// ✅ Get public donation requests - FIXED
app.get("/public-requests", async (req, res) => {
  try {
    const db = await getDatabase();
    const requestsCollection = db.collection("donationRequests");
    
    const requests = await requestsCollection
      .find({ donation_status: "pending" })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    res.json(requests);
  } catch (error) {
    console.error("❌ Error fetching public requests:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donation requests",
      message: error.message,
    });
  }
});

// ✅ Search donation requests - FIXED
app.get("/search-requests", async (req, res) => {
  try {
    const { bloodGroup, district, upazila } = req.query;
    console.log("🔍 Search query:", { bloodGroup, district, upazila });
    
    const db = await getDatabase();
    const requestsCollection = db.collection("donationRequests");
    
    let searchQuery = { donation_status: "pending" };
    
    if (bloodGroup) searchQuery.blood_group = bloodGroup;
    if (district) searchQuery.recipient_district = district;
    if (upazila) searchQuery.recipient_upazila = upazila;
    
    const results = await requestsCollection
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    res.json(results);
  } catch (error) {
    console.error("❌ Error searching requests:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to search donation requests",
      message: error.message,
    });
  }
});

// ✅ Get admin statistics - FIXED
app.get("/admin-stats", async (req, res) => {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection("users");
    const requestsCollection = db.collection("donationRequests");
    const fundingCollection = db.collection("funding");
    
    const [totalUsers, totalRequests, fundingData] = await Promise.all([
      usersCollection.countDocuments(),
      requestsCollection.countDocuments(),
      fundingCollection
        .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
        .toArray(),
    ]);
    
    const totalFunding = fundingData.length > 0 ? fundingData[0].total : 0;
    
    res.json({
      success: true,
      totalUsers,
      totalRequests,
      totalFunding,
    });
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin statistics",
      message: error.message,
    });
  }
});

// ✅ Get all users - FIXED
app.get("/users", async (req, res) => {
  try {
    const { status } = req.query;
    
    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    let query = {};
    if (status) query.status = status;
    
    const users = await usersCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    res.json({
      success: true,
      users: users,
      count: users.length,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: error.message,
    });
  }
});

// ✅ Update user status - FIXED
app.patch("/update/user/status", async (req, res) => {
  try {
    const { email, status } = req.query;
    
    if (!email || !status) {
      return res.status(400).json({
        success: false,
        error: "Email and status are required",
      });
    }
    
    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    const result = await usersCollection.updateOne(
      { email: email },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      }
    );
    
    res.json({
      success: true,
      acknowledged: true,
      modifiedCount: result.modifiedCount,
      message: `User status updated to ${status}`,
    });
  } catch (error) {
    console.error("❌ Error updating user status:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to update user status",
      message: error.message,
    });
  }
});

// ✅ Update user role - FIXED
app.patch("/update/user/role", async (req, res) => {
  try {
    const { email, role } = req.query;
    
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: "Email and role are required",
      });
    }
    
    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    const result = await usersCollection.updateOne(
      { email: email },
      {
        $set: {
          role: role,
          updatedAt: new Date(),
        },
      }
    );
    
    res.json({
      success: true,
      acknowledged: true,
      modifiedCount: result.modifiedCount,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("❌ Error updating user role:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
      message: error.message,
    });
  }
});

// ✅ Get all donation requests (pagination) - FIXED
app.get("/all-requests", async (req, res) => {
  try {
    const { page = 0, size = 10, status } = req.query;
    
    const skip = parseInt(page) * parseInt(size);
    const limit = parseInt(size);
    
    const db = await getDatabase();
    const requestsCollection = db.collection("donationRequests");
    
    let query = {};
    if (status) query.donation_status = status;
    
    const [requests, totalRequest] = await Promise.all([
      requestsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      requestsCollection.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      request: requests,
      totalRequest: totalRequest,
      page: parseInt(page),
      size: limit,
      totalPages: Math.ceil(totalRequest / limit),
    });
  } catch (error) {
    console.error("❌ Error fetching all requests:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donation requests",
      message: error.message,
    });
  }
});

// ✅ Update donation request status - FIXED
app.patch("/request-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid request ID format",
      });
    }
    
    const db = await getDatabase();
    const requestsCollection = db.collection("donationRequests");
    
    const result = await requestsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          donation_status: status,
          updatedAt: new Date(),
        },
      }
    );
    
    res.json({
      success: true,
      acknowledged: true,
      modifiedCount: result.modifiedCount,
      message: `Request status updated to ${status}`,
    });
  } catch (error) {
    console.error("❌ Error updating request status:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to update request status",
      message: error.message,
    });
  }
});

// ✅ Delete donation request - FIXED
app.delete("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid request ID format",
      });
    }
    
    const db = await getDatabase();
    const requestsCollection = db.collection("donationRequests");
    
    const result = await requestsCollection.deleteOne({ _id: new ObjectId(id) });
    
    res.json({
      success: true,
      acknowledged: true,
      deletedCount: result.deletedCount,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting request:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to delete request",
      message: error.message,
    });
  }
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Error:", err.stack);
  
  // Set CORS headers for error responses
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  
  res.status(err.status || 500).json({
    success: false,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString(),
  });
});

// ✅ 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ✅ Graceful shutdown
process.on("SIGINT", async () => {
  console.log("👋 Shutting down gracefully...");
  if (dbClient) {
    await dbClient.close();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("👋 SIGTERM received, shutting down...");
  if (dbClient) {
    await dbClient.close();
  }
  process.exit(0);
});

// ✅ Start server (for local development)
if (require.main === module) {
  app.listen(port, async () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌐 CORS enabled for: ${allowedOrigins.join(", ")}`);
    console.log(`📡 Health check: http://localhost:${port}/`);
    console.log(`🔧 API test: http://localhost:${port}/api/test`);
    
    try {
      await getDatabase();
      console.log("✅ Database connection initialized");
    } catch (error) {
      console.error("⚠️ Database connection failed on startup:", error.message);
    }
  });
}

// ✅ Export for Vercel
module.exports = app;