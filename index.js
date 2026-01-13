const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
// app.use(
//   cors({
//     origin: ["https://blood-donate-4a1fa.web.app", "https://blood-donate-4a1fa.firebaseapp.com", "http://localhost:5173"],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     credentials: true,
//   })
// );
const allowedOrigins = [
  "https://blood-donate-4a1fa.web.app",
  "https://blood-donate-4a1fa.firebaseapp.com",
  "http://localhost:5173",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Postman / server-to-server request e origin thake na
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

app.options("*", cors());


app.use(express.json());

// MongoDB connection - Using your provided connection string
const uri = "mongodb+srv://missionscic11:Av0baylRPcAW9f2N@cluster0.e62g5zs.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let isConnected = false;

// Connect to MongoDB
async function connectDB() {
  try {
    // Connect the client to the server
    await client.connect();
    
    // Set database
    db = client.db("bloodDonateDB");
    
    // Send a ping to confirm a successful connection
    await db.admin().ping();
    
    isConnected = true;
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    isConnected = false;
  }
}

// Initialize DB connection
connectDB();

// Fallback data for when MongoDB is not connected
const fallbackUsers = [
  {
    email: "admin@gmail.com",
    role: "admin",
    status: "active",
    name: "Admin User"
  },
  {
    email: "user@gmail.com",
    role: "donar", 
    status: "active",
    name: "Regular User"
  }
];

const fallbackRequests = [
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
    full_address: "456 Hospital Road, Chittagong",
    request_message: "Emergency blood requirement"
  }
];

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Blood Donate Backend is running!", 
    timestamp: new Date().toISOString(),
    status: "healthy",
    database: isConnected ? "MongoDB connected" : "Using fallback data",
    mongoStatus: isConnected
  });
});

// API test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working!", 
    status: "success",
    timestamp: new Date().toISOString(),
    database: isConnected ? "MongoDB" : "Fallback"
  });
});

// Get user role by email
app.get("/users/role/:email", async (req, res) => {
  try {
    // const { email } = req.params;
    const email = decodeURIComponent(req.params.email);
    console.log("Fetching role for:", email);
    
    if (isConnected && db) {
      // Use MongoDB
      const usersCollection = db.collection("users");
      const user = await usersCollection.findOne({ email: email });
      
      if (user) {
        res.json({
          email: user.email,
          role: user.role || "donar",
          status: user.status || "active",
          name: user.name || user.displayName || "User"
        });
      } else {
        // Return default role for new users
        res.json({
          email: email,
          role: "donar",
          status: "active",
          name: "New User"
        });
      }
    } else {
      // Use fallback data
      const user = fallbackUsers.find(u => u.email === email);
      
      if (user) {
        res.json(user);
      } else {
        res.json({
          email: email,
          role: "donar",
          status: "active",
          name: "New User"
        });
      }
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(500).json({ 
      error: "Failed to fetch user role",
      message: error.message 
    });
  }
});

// Create/Update user
app.post("/users", async (req, res) => {
  try {
    const userInfo = req.body;
    console.log("User registration/update:", userInfo);
    
    if (isConnected && db) {
      // Use MongoDB
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
              updatedAt: new Date()
            }
          }
        );
        
        res.json({
          acknowledged: true,
          modifiedCount: result.modifiedCount,
          message: "User updated successfully"
        });
      } else {
        // Create new user
        const newUser = {
          ...userInfo,
          role: userInfo.role || "donar",
          status: "active",
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        const result = await usersCollection.insertOne(newUser);
        
        res.json({
          acknowledged: true,
          insertedId: result.insertedId,
          message: "User registered successfully"
        });
      }
    } else {
      // Use fallback (just return success)
      res.json({
        acknowledged: true,
        insertedId: "fallback_" + Date.now(),
        message: "User registered successfully (fallback mode)"
      });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ 
      error: "Failed to create/update user",
      message: error.message 
    });
  }
});

// Get public donation requests
app.get("/public-requests", async (req, res) => {
  try {
    if (isConnected && db) {
      // Use MongoDB
      const requestsCollection = db.collection("donationRequests");
      const requests = await requestsCollection
        .find({ donation_status: "pending" })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      
      res.json(requests);
    } else {
      // Use fallback data
      res.json(fallbackRequests);
    }
  } catch (error) {
    console.error("Error fetching public requests:", error);
    res.status(500).json({ 
      error: "Failed to fetch donation requests",
      message: error.message 
    });
  }
});

// Search donation requests
app.get("/search-requests", async (req, res) => {
  try {
    const { bloodGroup, district, upazila } = req.query;
    console.log("Search query:", { bloodGroup, district, upazila });
    
    if (isConnected && db) {
      // Use MongoDB
      const requestsCollection = db.collection("donationRequests");
      
      let searchQuery = { donation_status: "pending" };
      
      if (bloodGroup) {
        searchQuery.blood_group = bloodGroup;
      }
      
      if (district) {
        searchQuery.recipient_district = district;
      }
      
      if (upazila) {
        searchQuery.recipient_upazila = upazila;
      }
      
      const results = await requestsCollection
        .find(searchQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();
      
      res.json(results);
    } else {
      // Use fallback data with filtering
      let results = fallbackRequests.filter(request => request.donation_status === "pending");
      
      if (bloodGroup) {
        results = results.filter(request => request.blood_group === bloodGroup);
      }
      
      if (district) {
        results = results.filter(request => request.recipient_district === district);
      }
      
      if (upazila) {
        results = results.filter(request => request.recipient_upazila === upazila);
      }
      
      res.json(results);
    }
  } catch (error) {
    console.error("Error searching requests:", error);
    res.status(500).json({ 
      error: "Failed to search donation requests",
      message: error.message 
    });
  }
});

// Get admin statistics
app.get("/admin-stats", async (req, res) => {
  try {
    if (isConnected && db) {
      // Use MongoDB
      const usersCollection = db.collection("users");
      const requestsCollection = db.collection("donationRequests");
      const fundingCollection = db.collection("funding");
      
      const [totalUsers, totalRequests, fundingData] = await Promise.all([
        usersCollection.countDocuments(),
        requestsCollection.countDocuments(),
        fundingCollection.aggregate([
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray()
      ]);
      
      const totalFunding = fundingData.length > 0 ? fundingData[0].total : 0;
      
      res.json({
        totalUsers,
        totalRequests,
        totalFunding
      });
    } else {
      // Use fallback data
      res.json({
        totalUsers: 150,
        totalRequests: 25,
        totalFunding: 15750
      });
    }
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch admin statistics",
      message: error.message 
    });
  }
});

// Get all users (Admin only)
app.get("/users", async (req, res) => {
  try {
    const { status } = req.query;
    
    if (isConnected && db) {
      // Use MongoDB
      const usersCollection = db.collection("users");
      
      let query = {};
      if (status) {
        query.status = status;
      }
      
      const users = await usersCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      
      res.json(users);
    } else {
      // Use fallback data
      let users = [
        {
          email: "admin@gmail.com",
          role: "admin",
          status: "active",
          name: "Admin User",
          mainPhotoUrl: "https://i.ibb.co/MBtjqXQ/no-avatar.gif"
        },
        {
          email: "user@gmail.com",
          role: "donar", 
          status: "active",
          name: "Regular User",
          mainPhotoUrl: "https://i.ibb.co/MBtjqXQ/no-avatar.gif"
        },
        {
          email: "volunteer@gmail.com",
          role: "volunteer",
          status: "active", 
          name: "Volunteer User",
          mainPhotoUrl: "https://i.ibb.co/MBtjqXQ/no-avatar.gif"
        },
        {
          email: "blocked@gmail.com",
          role: "donar",
          status: "blocked",
          name: "Blocked User", 
          mainPhotoUrl: "https://i.ibb.co/MBtjqXQ/no-avatar.gif"
        }
      ];
      
      if (status) {
        users = users.filter(user => user.status === status);
      }
      
      res.json(users);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      error: "Failed to fetch users",
      message: error.message 
    });
  }
});

// Update user status (Admin only)
app.patch("/update/user/status", async (req, res) => {
  try {
    const { email, status } = req.query;
    
    if (isConnected && db) {
      // Use MongoDB
      const usersCollection = db.collection("users");
      
      const result = await usersCollection.updateOne(
        { email: email },
        { 
          $set: { 
            status: status,
            updatedAt: new Date()
          }
        }
      );
      
      res.json({
        acknowledged: true,
        modifiedCount: result.modifiedCount,
        message: `User status updated to ${status}`
      });
    } else {
      // Use fallback (just return success)
      res.json({
        acknowledged: true,
        modifiedCount: 1,
        message: `User status updated to ${status} (fallback mode)`
      });
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ 
      error: "Failed to update user status",
      message: error.message 
    });
  }
});

// Update user role (Admin only)
app.patch("/update/user/role", async (req, res) => {
  try {
    const { email, role } = req.query;
    
    if (isConnected && db) {
      // Use MongoDB
      const usersCollection = db.collection("users");
      
      const result = await usersCollection.updateOne(
        { email: email },
        { 
          $set: { 
            role: role,
            updatedAt: new Date()
          }
        }
      );
      
      res.json({
        acknowledged: true,
        modifiedCount: result.modifiedCount,
        message: `User role updated to ${role}`
      });
    } else {
      // Use fallback (just return success)
      res.json({
        acknowledged: true,
        modifiedCount: 1,
        message: `User role updated to ${role} (fallback mode)`
      });
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ 
      error: "Failed to update user role",
      message: error.message 
    });
  }
});

// Get all donation requests (Admin/Volunteer)
app.get("/all-requests", async (req, res) => {
  try {
    const { page = 0, size = 10, status } = req.query;
    const skip = parseInt(page) * parseInt(size);
    
    if (isConnected && db) {
      // Use MongoDB
      const requestsCollection = db.collection("donationRequests");
      
      let query = {};
      if (status) {
        query.donation_status = status;
      }
      
      const [requests, totalRequest] = await Promise.all([
        requestsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(size))
          .toArray(),
        requestsCollection.countDocuments(query)
      ]);
      
      res.json({
        request: requests,
        totalRequest
      });
    } else {
      // Use fallback data
      let requests = fallbackRequests;
      
      if (status) {
        requests = requests.filter(req => req.donation_status === status);
      }
      
      const totalRequest = requests.length;
      const paginatedRequests = requests.slice(skip, skip + parseInt(size));
      
      res.json({
        request: paginatedRequests,
        totalRequest
      });
    }
  } catch (error) {
    console.error("Error fetching all requests:", error);
    res.status(500).json({ 
      error: "Failed to fetch donation requests",
      message: error.message 
    });
  }
});

// Update donation request status (Admin/Volunteer)
app.patch("/request-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (isConnected && db) {
      // Use MongoDB
      const requestsCollection = db.collection("donationRequests");
      
      const result = await requestsCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            donation_status: status,
            updatedAt: new Date()
          }
        }
      );
      
      res.json({
        acknowledged: true,
        modifiedCount: result.modifiedCount,
        message: `Request status updated to ${status}`
      });
    } else {
      // Use fallback (just return success)
      res.json({
        acknowledged: true,
        modifiedCount: 1,
        message: `Request status updated to ${status} (fallback mode)`
      });
    }
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ 
      error: "Failed to update request status",
      message: error.message 
    });
  }
});

// Delete donation request (Admin only)
app.delete("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isConnected && db) {
      // Use MongoDB
      const requestsCollection = db.collection("donationRequests");
      
      const result = await requestsCollection.deleteOne({ _id: new ObjectId(id) });
      
      res.json({
        acknowledged: true,
        deletedCount: result.deletedCount,
        message: "Request deleted successfully"
      });
    } else {
      // Use fallback (just return success)
      res.json({
        acknowledged: true,
        deletedCount: 1,
        message: "Request deleted successfully (fallback mode)"
      });
    }
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ 
      error: "Failed to delete request",
      message: error.message 
    });
  }
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (client && isConnected) {
    await client.close();
  }
  process.exit(0);
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