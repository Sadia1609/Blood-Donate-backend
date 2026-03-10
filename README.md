# 🩸 Blood Donation Management System

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://blood-donate-4a1fa.web.app)
[![Backend API](https://img.shields.io/badge/Backend-API-blue)](https://blood-donate-backend-six.vercel.app)


A comprehensive full-stack blood donation management platform that connects donors with patients in need, featuring real-time blood request management, emergency response capabilities, and administrative oversight.

## 🌟 Features

### 🔐 Authentication & Authorization
- **Firebase Authentication** with email/password
- **Role-based access control** (Admin/Donor)
- **Firebase Authentication** with ID tokens
- **Protected routes** and API endpoints

### 👥 User Management
- **User registration and profile management**
- **Donor profile with blood type and contact information**
- **Admin dashboard for user oversight**
- **User activity tracking and statistics**

### 🩸 Blood Request System
- **Create and manage blood donation requests**
- **Advanced search and filtering** by blood type, location, urgency
- **Real-time request status updates** (Pending, In Progress, Completed, Canceled)
- **Emergency blood request notifications**
- **Request details with donor contact information**

### 📊 Dashboard & Analytics
- **Interactive dashboards** with real-time statistics
- **Data visualization** using Recharts (Bar, Pie, Area charts)
- **Donation history and tracking**
- **Admin analytics** for system oversight
- **User activity monitoring**

### 💰 Funding System
- **Donation/funding management**
- **Payment processing** with transaction tracking
- **Donation history and receipts**
- **Payment success/error handling**

### 📱 Responsive Design
- **Mobile-first responsive design**
- **Cross-device compatibility**
- **Modern UI with Tailwind CSS**
- **Consistent design system**

## 🚀 Live Demo

- **Frontend:** [https://blood-donate-4a1fa.web.app](https://blood-donate-4a1fa.web.app)
- **Backend API:** [https://blood-donate-backend-six.vercel.app](https://blood-donate-backend-six.vercel.app)


## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **DaisyUI** - Tailwind CSS components
- **React Router 7** - Client-side routing
- **Axios** - HTTP client for API calls
- **Recharts** - Data visualization library
- **React Icons** - Icon library
- **React Hot Toast** - Toast notifications
- **Firebase SDK** - Authentication and hosting

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database
- **Firebase Admin** - Server-side authentication
- **CORS** - Cross-origin resource sharing
- **Serverless HTTP** - Vercel deployment adapter

### DevOps & Deployment
- **Firebase Hosting** - Frontend deployment
- **Vercel** - Backend deployment
- **MongoDB Atlas** - Database hosting
- **Git & GitHub** - Version control

## 📁 Project Structure

```
Blood-Donate-backend/
├── 📁 Frontend/                 # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI components
│   │   ├── 📁 Pages/           # Application pages
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   ├── 📁 Provider/        # Context providers
│   │   └── 📁 routes/          # Route configurations
│   ├── 📁 public/              # Static assets
│   └── 📄 package.json         # Frontend dependencies
├── 📁 Backend/                  # Express backend
│   ├── 📁 api/                 # Vercel serverless functions
│   ├── 📄 index.js             # Main server file
│   ├── 📄 index-simple.js      # Development server
│   └── 📄 package.json         # Backend dependencies
└── 📄 README.md                # Project documentation
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** 
- **MongoDB Atlas account**
- **Firebase project**

<<<<<<< HEAD
### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/blood-donation-system.git
cd blood-donation-system
=======
### Quick Start

1. **Install backend dependencies:**
   ```bash
   cd Blood-Donate-backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Start both servers:**
   ```bash
   npm run dev
   ```

### Individual Server Commands

- **Backend only:** `npm run backend`
- **Frontend only:** `npm run frontend`
- **Production backend:** `npm start`


## API Endpoints

- `GET /` - Health check
- `GET /api/test` - API test
- `GET /public-requests` - Blood donation requests
- `GET /users/role/:email` - User role checking
- `POST /users` - User registration

## Deployment

- **Frontend:** Deployed on Firebase Hosting
- **Backend:** Deployed on Vercel

```

### 3. Frontend Setup
```bash
cd Frontend
npm install

# Configure Firebase
# Add your Firebase config in src/firebase/firebase.config.js
```

### 4. Environment Variables

Create `.env` file in Backend directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
FIREBASE_ADMIN_SDK=your_firebase_admin_sdk_key
```

### 5. Run the Application

**Development Mode:**
```bash
# Backend (from Backend directory)
npm run dev

<<<<<<< HEAD
# Frontend (from Frontend directory)
npm run dev
```

**Production Mode:**
```bash
# Backend
npm start

# Frontend
npm run build
npm run preview
```

## 🌐 API Endpoints

### Authentication
- `POST /users` - User registration
- `GET /users/role/:email` - Get user role

### Blood Requests
- `GET /public-requests` - Get all blood requests
- `POST /requests` - Create new blood request
- `GET /requests/:id` - Get specific request
- `PUT /requests/:id` - Update request
- `DELETE /requests/:id` - Delete request
- `GET /my-request` - Get user's requests

### User Management
- `GET /users` - Get all users (Admin)
- `GET /users/:email` - Get user profile
- `PUT /users/:email` - Update user profile
- `DELETE /users/:email` - Delete user (Admin)

### Dashboard & Analytics
- `GET /admin-stats` - Admin dashboard statistics
- `GET /user-stats` - User dashboard statistics
- `GET /user-activities` - User activity data

### Funding
- `POST /create-payment-checkout` - Create payment session
- `GET /fundings` - Get funding records

## 🎨 Key Features Implementation

### Role-Based Access Control
```javascript
// Admin routes are protected
const isAdmin = user?.role === 'admin';
if (!isAdmin) return <Navigate to="/dashboard" />;
```

### Real-time Data Visualization
```javascript
// Dashboard charts with live data
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <Bar dataKey="value" fill="#871e14" />
  </BarChart>
</ResponsiveContainer>
```

### Advanced Search & Filtering
```javascript
// Blood request filtering
const filteredRequests = requests.filter(request => 
  request.bloodGroup.includes(bloodFilter) &&
  request.district.includes(locationFilter) &&
  request.status.includes(statusFilter)
);
```

## 🔒 Security Features

- **Token-based authentication** using Firebase SDK
- **Role-based authorization**
- **Input validation and sanitization**
- **CORS configuration**
- **Environment variable protection**
- **Secure API endpoints**

## 📱 Responsive Design

- **Mobile-first approach**
- **Tailwind CSS responsive utilities**
- **Cross-browser compatibility**
- **Touch-friendly interface**
- **Optimized for all screen sizes**

## 🚀 Deployment

### Frontend (Firebase Hosting)
```bash
cd Frontend
npm run build
firebase deploy
```

### Backend (Vercel)
```bash
cd Backend
vercel --prod
```




## 🙏 Acknowledgments

- Firebase for authentication and hosting
- MongoDB Atlas for database services
- Vercel for backend deployment
- Tailwind CSS for styling framework
- React community for excellent documentation


---

