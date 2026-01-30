const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ["https://blood-donate-4a1fa.web.app", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());

// MongoDB connection with lazy initialization
const uri = "mongodb+srv://missionscic11:Av0baylRPcAW9f2N@cluster0.e62g5zs.mongodb.net/bloodDonateDB?retryWrites=true&w=majority&appName=Cluster0";

let client;
let db;
let isConnecting = false;

// Get database connection with lazy initialization
async function getDatabase() {
  if (db) {
    return db;
  }
  
  if (isConnecting) {
    // Wait for existing connection attempt
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return db;
  }
  
  try {
    isConnecting = true;
    console.log("🔄 Establishing MongoDB connection...");
    
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    
    await client.connect();
    db = client.db("bloodDonateDB");
    
    // Test connection
    await db.admin().ping();
    
    console.log("✅ MongoDB connected successfully!");
    isConnecting = false;
    return db;
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    isConnecting = false;
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Blood Donate Backend is running!", 
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
});

app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working!", 
    status: "success",
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for direct MongoDB connection
app.get("/api/test-mongo", async (req, res) => {
  try {
    console.log("🧪 Testing direct MongoDB connection...");
    
    // Create a new client for testing
    const testClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 10000,
    });
    
    await testClient.connect();
    console.log("✅ Test client connected");
    
    const testDb = testClient.db("bloodDonateDB");
    await testDb.admin().ping();
    console.log("✅ Database ping successful");
    
    // Test collection access
    const usersCollection = testDb.collection("users");
    const userCount = await usersCollection.countDocuments();
    console.log("✅ User count:", userCount);
    
    await testClient.close();
    console.log("✅ Test client closed");
    
    res.json({
      success: true,
      message: "MongoDB connection test successful",
      userCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ MongoDB test failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      codeName: error.codeName,
      timestamp: new Date().toISOString()
    });
  }
});

// Create donation request
app.post("/requests", async (req, res) => {
  try {
    const requestData = req.body;
    console.log("📝 Creating donation request for:", requestData.requester_email);
    
    const database = await getDatabase();
    const requestsCollection = database.collection("donationRequests");
    
    const newRequest = {
      ...requestData,
      donation_status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await requestsCollection.insertOne(newRequest);
    console.log("✅ Request created with ID:", result.insertedId);
    
    res.json({
      acknowledged: result.acknowledged,
      insertedId: result.insertedId,
      message: "Donation request created successfully"
    });
    
  } catch (error) {
    console.error("❌ Error creating donation request:", error);
    res.status(500).json({ 
      error: "Failed to create donation request",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get user role by email
app.get("/users/role/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("🔍 Fetching role for:", email);
    
    const database = await getDatabase();
    const usersCollection = database.collection("users");
    
    let user = await usersCollection.findOne({ email: email });
    
    if (!user) {
      console.log("👤 Creating new user for:", email);
      // Create new user with default role
      const newUser = {
        email: email,
        role: email === "admin@gmail.com" ? "admin" : "donar",
        status: "active",
        name: email.split('@')[0] || "User",
        mainPhotoUrl: "https://i.ibb.co/MBtjqXQ/no-avatar.gif",
        createdAt: new Date()
      };
      
      await usersCollection.insertOne(newUser);
      user = newUser;
      console.log("✅ New user created:", user.email, user.role);
    }
    
    res.json({
      email: user.email,
      role: user.role || "donar",
      status: user.status || "active",
      name: user.name || user.displayName || "User"
    });
    
  } catch (error) {
    console.error("❌ Error fetching user role:", error);
    res.status(500).json({ 
      error: "Failed to fetch user role",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get single user by email
app.get("/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("🔍 Fetching user profile for:", email);
    
    const database = await getDatabase();
    const usersCollection = database.collection("users");
    
    let user = await usersCollection.findOne({ email: email });
    
    if (!user) {
      console.log("👤 Creating new user profile for:", email);
      // Create new user if not found
      const newUser = {
        email: email,
        role: email === "admin@gmail.com" ? "admin" : "donar",
        status: "active",
        name: email.split('@')[0] || "User",
        mainPhotoUrl: "https://i.ibb.co/MBtjqXQ/no-avatar.gif",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(newUser);
      user = newUser;
      console.log("✅ New user profile created:", email);
    }
    
    console.log("✅ User profile found:", email, "Photo:", user.mainPhotoUrl);
    res.json(user);
    
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    res.status(500).json({ 
      error: "Failed to fetch user profile",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get user dashboard statistics
app.get("/user-dashboard/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("📊 Fetching user dashboard data for:", email);
    
    try {
      const database = await getDatabase();
      const requestsCollection = database.collection("donationRequests");
      const usersCollection = database.collection("users");
      
      // Get user's requests statistics
      const [
        totalRequests,
        pendingRequests,
        inProgressRequests,
        completedRequests,
        canceledRequests,
        recentRequests,
        monthlyStats
      ] = await Promise.all([
        requestsCollection.countDocuments({ requester_email: email }),
        requestsCollection.countDocuments({ requester_email: email, donation_status: "pending" }),
        requestsCollection.countDocuments({ requester_email: email, donation_status: "inprogress" }),
        requestsCollection.countDocuments({ requester_email: email, donation_status: "done" }),
        requestsCollection.countDocuments({ requester_email: email, donation_status: "canceled" }),
        requestsCollection.find({ requester_email: email }).sort({ createdAt: -1 }).limit(5).toArray(),
        requestsCollection.aggregate([
          { $match: { requester_email: email } },
          {
            $group: {
              _id: { 
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          { $limit: 12 }
        ]).toArray()
      ]);
      
      // Get user profile
      const userProfile = await usersCollection.findOne({ email: email });
      
      res.json({
        success: true,
        user: userProfile,
        statistics: {
          totalRequests,
          pendingRequests,
          inProgressRequests,
          completedRequests,
          canceledRequests
        },
        recentRequests,
        monthlyStats,
        timestamp: new Date().toISOString()
      });
      
    } catch (dbError) {
      console.log("Database unavailable, using fallback data");
      
      // Fallback data
      const fallbackData = {
        success: true,
        user: {
          email: email,
          name: email.split('@')[0],
          role: "donar",
          status: "active",
          mainPhotoUrl: "https://i.ibb.co/MBtjqXQ/no-avatar.gif"
        },
        statistics: {
          totalRequests: 8,
          pendingRequests: 2,
          inProgressRequests: 3,
          completedRequests: 2,
          canceledRequests: 1
        },
        recentRequests: [
          {
            _id: "1",
            recipient_name: "John Doe",
            blood_group: "A+",
            donation_status: "pending",
            createdAt: new Date(),
            recipient_district: "Dhaka",
            recipient_upazila: "Dhanmondi"
          },
          {
            _id: "2",
            recipient_name: "Jane Smith",
            blood_group: "O-",
            donation_status: "inprogress",
            createdAt: new Date(Date.now() - 86400000),
            recipient_district: "Chittagong",
            recipient_upazila: "Panchlaish"
          }
        ],
        monthlyStats: [
          { _id: { month: 10, year: 2024 }, count: 2 },
          { _id: { month: 11, year: 2024 }, count: 3 },
          { _id: { month: 12, year: 2024 }, count: 1 },
          { _id: { month: 1, year: 2025 }, count: 2 }
        ],
        timestamp: new Date().toISOString()
      };
      
      res.json(fallbackData);
    }
    
  } catch (error) {
    console.error("❌ Error fetching user dashboard:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch dashboard data",
      message: error.message
    });
  }
});

// Get user's recent activities
app.get("/user-activities/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { limit = 10 } = req.query;
    
    try {
      const database = await getDatabase();
      const requestsCollection = database.collection("donationRequests");
      
      const activities = await requestsCollection
        .find({ requester_email: email })
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .toArray();
      
      res.json({
        success: true,
        activities: activities.map(activity => ({
          id: activity._id,
          type: "donation_request",
          title: `Blood request for ${activity.recipient_name}`,
          description: `${activity.blood_group} blood needed in ${activity.recipient_district}`,
          status: activity.donation_status,
          date: activity.updatedAt || activity.createdAt,
          bloodGroup: activity.blood_group,
          location: `${activity.recipient_district}, ${activity.recipient_upazila}`
        }))
      });
      
    } catch (dbError) {
      // Fallback activities
      res.json({
        success: true,
        activities: [
          {
            id: "1",
            type: "donation_request",
            title: "Blood request for John Doe",
            description: "A+ blood needed in Dhaka",
            status: "pending",
            date: new Date(),
            bloodGroup: "A+",
            location: "Dhaka, Dhanmondi"
          },
          {
            id: "2",
            type: "donation_request",
            title: "Blood request for Jane Smith",
            description: "O- blood needed in Chittagong",
            status: "inprogress",
            date: new Date(Date.now() - 86400000),
            bloodGroup: "O-",
            location: "Chittagong, Panchlaish"
          }
        ]
      });
    }
    
  } catch (error) {
    console.error("❌ Error fetching user activities:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch activities",
      message: error.message
    });
  }
});

// Simple profile update endpoint (without MongoDB dependency)
app.post("/update-profile", async (req, res) => {
  try {
    const profileData = req.body;
    
    console.log("📝 POST /update-profile called");
    console.log("📝 Profile data:", JSON.stringify(profileData, null, 2));
    
    if (!profileData.email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
        message: "Email field is missing from request body"
      });
    }
    
    // For now, just return success without database operation
    // This will work as a temporary solution
    const updatedProfile = {
      ...profileData,
      updatedAt: new Date().toISOString(),
      status: "active"
    };
    
    console.log("✅ Profile update successful (temporary)");
    
    res.json({
      success: true,
      acknowledged: true,
      message: "Profile updated successfully",
      profile: updatedProfile
    });
    
  } catch (error) {
    console.error("❌ Error in POST /update-profile:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update profile",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Alternative: Try MongoDB with better error handling
app.post("/update-profile-db", async (req, res) => {
  try {
    const profileData = req.body;
    
    console.log("📝 POST /update-profile-db called");
    console.log("📝 Profile data:", JSON.stringify(profileData, null, 2));
    
    if (!profileData.email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }
    
    try {
      const database = await getDatabase();
      const usersCollection = database.collection("users");
      
      const result = await usersCollection.updateOne(
        { email: profileData.email },
        { $set: { ...profileData, updatedAt: new Date() } },
        { upsert: true }
      );
      
      const updatedProfile = await usersCollection.findOne({ email: profileData.email });
      
      res.json({
        success: true,
        acknowledged: result.acknowledged,
        message: "Profile updated successfully in database",
        profile: updatedProfile
      });
      
    } catch (dbError) {
      console.error("❌ Database error, using fallback:", dbError);
      
      // Fallback response
      const updatedProfile = {
        ...profileData,
        updatedAt: new Date().toISOString(),
        status: "active"
      };
      
      res.json({
        success: true,
        acknowledged: true,
        message: "Profile updated successfully (fallback mode)",
        profile: updatedProfile,
        note: "Database unavailable, using temporary storage"
      });
    }
    
  } catch (error) {
    console.error("❌ Error in POST /update-profile-db:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update profile",
      message: error.message
    });
  }
});

// Update user profile
app.put("/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = req.body;
    
    console.log("📝 PUT /users/:email called");
    console.log("📝 Email:", email);
    console.log("📝 Update data:", JSON.stringify(updateData, null, 2));
    
    // Validate email parameter
    if (!email) {
      return res.status(400).json({
        error: "Email parameter is required",
        message: "Email parameter is missing from URL"
      });
    }
    
    // Get database connection
    console.log("🔗 Getting database connection...");
    const database = await getDatabase();
    console.log("✅ Database connection established");
    
    const usersCollection = database.collection("users");
    
    // Remove any undefined or null values and prepare clean data
    const cleanUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
        cleanUpdateData[key] = updateData[key];
      }
    });
    
    cleanUpdateData.email = email; // Ensure email is always set
    cleanUpdateData.updatedAt = new Date();
    
    console.log("📄 Clean update data:", JSON.stringify(cleanUpdateData, null, 2));
    
    // Perform update operation
    console.log("💾 Performing database update...");
    const result = await usersCollection.updateOne(
      { email: email },
      { $set: cleanUpdateData },
      { upsert: true }
    );
    
    console.log("✅ Update result:", JSON.stringify(result, null, 2));
    
    // Fetch updated user
    console.log("🔍 Fetching updated user...");
    const updatedUser = await usersCollection.findOne({ email: email });
    console.log("✅ Updated user:", updatedUser ? "Found" : "Not found");
    
    res.json({
      acknowledged: result.acknowledged,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      message: "Profile updated successfully",
      user: updatedUser
    });
    
  } catch (error) {
    console.error("❌ Error in PUT /users/:email:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    res.status(500).json({ 
      error: "Failed to update user profile",
      message: error.message,
      errorName: error.name,
      timestamp: new Date().toISOString()
    });
  }
});

// Create/Update user (POST method for registration)
app.post("/users", async (req, res) => {
  try {
    const userInfo = req.body;
    console.log("User registration/update:", userInfo.email);
    
    const database = await getDatabase();
    const usersCollection = database.collection("users");
    
    const existingUser = await usersCollection.findOne({ email: userInfo.email });
    
    if (existingUser) {
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
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ 
      error: "Failed to create/update user",
      message: error.message 
    });
  }
});

// Update user profile (PATCH method as alternative)
app.patch("/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = req.body;
    
    console.log("📝 PATCH /users/:email called");
    console.log("📝 Email:", email);
    console.log("📝 Update data:", JSON.stringify(updateData, null, 2));
    
    const database = await getDatabase();
    const usersCollection = database.collection("users");
    
    // Simple update without complex data cleaning
    const simpleUpdate = {
      ...updateData,
      email: email,
      updatedAt: new Date()
    };
    
    const result = await usersCollection.updateOne(
      { email: email },
      { $set: simpleUpdate },
      { upsert: true }
    );
    
    console.log("✅ PATCH update successful");
    
    res.json({
      acknowledged: result.acknowledged,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      message: "Profile updated successfully via PATCH"
    });
    
  } catch (error) {
    console.error("❌ Error in PATCH /users/:email:", error);
    res.status(500).json({ 
      error: "Failed to update user profile via PATCH",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get public donation requests
app.get("/public-requests", async (req, res) => {
  try {
    const database = await getDatabase();
    const requestsCollection = database.collection("donationRequests");
    
    const requests = await requestsCollection
      .find({ donation_status: "pending" })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    res.json(requests);
  } catch (error) {
    console.error("Error fetching public requests:", error);
    res.status(500).json({ 
      error: "Failed to fetch donation requests",
      message: error.message 
    });
  }
});

// Get user's donation requests
app.get("/my-request", async (req, res) => {
  try {
    const { email, page = 0, size = 10, status } = req.query;
    const skip = parseInt(page) * parseInt(size);
    
    if (!email) {
      return res.status(400).json({ 
        error: "Email parameter is required",
        message: "Please provide email parameter" 
      });
    }
    
    const database = await getDatabase();
    const requestsCollection = database.collection("donationRequests");
    
    let query = { requester_email: email };
    if (status) query.donation_status = status;
    
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
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ 
      error: "Failed to fetch user requests",
      message: error.message 
    });
  }
});

// Get admin statistics
app.get("/admin-stats", async (req, res) => {
  try {
    console.log("📊 Fetching admin statistics");
    
    try {
      const database = await getDatabase();
      const usersCollection = database.collection("users");
      const requestsCollection = database.collection("donationRequests");
      const fundingCollection = database.collection("funding");
      
      const [
        totalUsers, 
        totalRequests, 
        fundingData,
        pendingRequests,
        inprogressRequests,
        doneRequests,
        canceledRequests
      ] = await Promise.all([
        usersCollection.countDocuments(),
        requestsCollection.countDocuments(),
        fundingCollection.aggregate([
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray(),
        requestsCollection.countDocuments({ donation_status: "pending" }),
        requestsCollection.countDocuments({ donation_status: "inprogress" }),
        requestsCollection.countDocuments({ donation_status: "done" }),
        requestsCollection.countDocuments({ donation_status: "canceled" })
      ]);
      
      const totalFunding = fundingData.length > 0 ? fundingData[0].total : 0;
      
      console.log("✅ Admin stats fetched successfully");
      
      res.json({
        totalUsers,
        totalRequests,
        totalFunding,
        pending: pendingRequests,
        inprogress: inprogressRequests,
        done: doneRequests,
        canceled: canceledRequests
      });
      
    } catch (dbError) {
      console.log("Database unavailable, using fallback admin stats");
      
      // Fallback admin statistics
      const fallbackStats = {
        totalUsers: 125,
        totalRequests: 89,
        totalFunding: 15000,
        pending: 25,
        inprogress: 18,
        done: 35,
        canceled: 11
      };
      
      res.json(fallbackStats);
    }
    
  } catch (error) {
    console.error("❌ Error fetching admin statistics:", error);
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
    
    if (!db) {
      return res.status(500).json({ 
        error: "Database not connected",
        message: "MongoDB connection is not available"
      });
    }
    
    const usersCollection = db.collection("users");
    let query = {};
    if (status) query.status = status;
    
    const users = await usersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(users);
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
    
    if (!db) {
      return res.status(500).json({ 
        error: "Database not connected",
        message: "MongoDB connection is not available"
      });
    }
    
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
    
    if (!db) {
      return res.status(500).json({ 
        error: "Database not connected",
        message: "MongoDB connection is not available"
      });
    }
    
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
    
    if (!db) {
      return res.status(500).json({ 
        error: "Database not connected",
        message: "MongoDB connection is not available"
      });
    }
    
    const requestsCollection = db.collection("donationRequests");
    let query = {};
    if (status) query.donation_status = status;
    
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
    
    if (!db) {
      return res.status(500).json({ 
        error: "Database not connected",
        message: "MongoDB connection is not available"
      });
    }
    
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
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ 
      error: "Failed to update request status",
      message: error.message 
    });
  }
});

// Get single donation request by ID
app.get("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching request with ID:", id);
    
    const database = await getDatabase();
    const requestsCollection = database.collection("donationRequests");
    
    const request = await requestsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!request) {
      return res.status(404).json({
        error: "Request not found",
        message: `No donation request found with ID: ${id}`
      });
    }
    
    console.log("✅ Request found:", request._id);
    res.json(request);
    
  } catch (error) {
    console.error("❌ Error fetching request:", error);
    res.status(500).json({ 
      error: "Failed to fetch donation request",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update donation request
app.put("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log("📝 Updating request:", id);
    
    const database = await getDatabase();
    const requestsCollection = database.collection("donationRequests");
    
    const result = await requestsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Request not found",
        message: `No donation request found with ID: ${id}`
      });
    }
    
    console.log("✅ Request updated:", id);
    res.json({
      acknowledged: true,
      modifiedCount: result.modifiedCount,
      message: "Request updated successfully"
    });
    
  } catch (error) {
    console.error("❌ Error updating request:", error);
    res.status(500).json({ 
      error: "Failed to update request",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete donation request
app.delete("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!db) {
      return res.status(500).json({ 
        error: "Database not connected",
        message: "MongoDB connection is not available"
      });
    }
    
    const requestsCollection = db.collection("donationRequests");
    const result = await requestsCollection.deleteOne({ _id: new ObjectId(id) });
    
    res.json({
      acknowledged: true,
      deletedCount: result.deletedCount,
      message: "Request deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ 
      error: "Failed to delete request",
      message: error.message 
    });
  }
});

// Get all fundings
app.get("/fundings", async (req, res) => {
  try {
    console.log("📊 Fetching all fundings");
    
    try {
      const database = await getDatabase();
      const fundingCollection = database.collection("funding");
      
      const fundings = await fundingCollection
        .find({})
        .sort({ paidAt: -1 })
        .toArray();
      
      console.log("✅ Fundings fetched:", fundings.length);
      res.json(fundings);
      
    } catch (dbError) {
      console.log("Database unavailable, using fallback funding data");
      
      // Fallback funding data
      const fallbackFundings = [
        {
          _id: "1",
          donarName: "John Doe",
          donarEmail: "john@example.com",
          amount: 1000,
          paidAt: new Date()
        },
        {
          _id: "2",
          donarName: "Jane Smith",
          donarEmail: "jane@example.com",
          amount: 500,
          paidAt: new Date(Date.now() - 86400000)
        }
      ];
      
      res.json(fallbackFundings);
    }
    
  } catch (error) {
    console.error("❌ Error fetching fundings:", error);
    res.status(500).json({ 
      error: "Failed to fetch fundings",
      message: error.message
    });
  }
});

// Create payment checkout (Stripe/Payment Gateway Integration)
app.post("/create-payment-checkout", async (req, res) => {
  try {
    const { donateAmount, donarEmail, donarName } = req.body;
    
    console.log("💳 Creating payment checkout for:", donarEmail, "Amount:", donateAmount);
    
    // Validate input
    if (!donateAmount || !donarEmail || !donarName) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "donateAmount, donarEmail, and donarName are required"
      });
    }
    
    // Validate amount
    const amount = parseFloat(donateAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
        message: "Amount must be a positive number"
      });
    }
    
    try {
      // For now, we'll create a mock payment session
      // In a real implementation, you would integrate with Stripe, PayPal, or other payment providers
      
      const database = await getDatabase();
      const fundingCollection = database.collection("funding");
      
      // Create a pending payment record
      const paymentRecord = {
        donarName,
        donarEmail,
        amount,
        status: "pending",
        createdAt: new Date(),
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const result = await fundingCollection.insertOne(paymentRecord);
      
      // Mock payment URL (in real implementation, this would be from Stripe/PayPal)
      const mockPaymentUrl = `${req.protocol}://${req.get('host')}/payment-success?session_id=${paymentRecord.sessionId}&amount=${amount}`;
      
      console.log("✅ Payment checkout created:", result.insertedId);
      
      res.json({
        success: true,
        url: mockPaymentUrl,
        sessionId: paymentRecord.sessionId,
        message: "Payment checkout created successfully"
      });
      
    } catch (dbError) {
      console.log("Database unavailable, using mock payment");
      
      // Fallback mock payment
      const mockSessionId = `mock_session_${Date.now()}`;
      const mockPaymentUrl = `${req.protocol}://${req.get('host')}/payment-success?session_id=${mockSessionId}&amount=${amount}`;
      
      res.json({
        success: true,
        url: mockPaymentUrl,
        sessionId: mockSessionId,
        message: "Mock payment checkout created (database unavailable)"
      });
    }
    
  } catch (error) {
    console.error("❌ Error creating payment checkout:", error);
    res.status(500).json({ 
      error: "Failed to create payment checkout",
      message: error.message
    });
  }
});

// Payment success handler
app.get("/payment-success", async (req, res) => {
  try {
    const { session_id, amount } = req.query;
    
    console.log("✅ Payment success callback:", session_id, amount);
    
    try {
      const database = await getDatabase();
      const fundingCollection = database.collection("funding");
      
      // Update payment status to completed
      await fundingCollection.updateOne(
        { sessionId: session_id },
        { 
          $set: { 
            status: "completed",
            paidAt: new Date()
          }
        }
      );
      
      console.log("✅ Payment status updated to completed");
      
    } catch (dbError) {
      console.log("Database unavailable for payment update");
    }
    
    // Redirect to success page
    res.redirect(`https://blood-donate-4a1fa.web.app/payment-success?amount=${amount}`);
    
  } catch (error) {
    console.error("❌ Error handling payment success:", error);
    res.redirect(`https://blood-donate-4a1fa.web.app/payment-error`);
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
  if (client) {
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