# Blood Donate Application

A full-stack blood donation management system with React frontend and Express backend.

## Project Structure

```
Blood-Donate-backend/
├── frontend/          # React frontend application
├── api/              # Vercel serverless API endpoints
├── index.js          # Main Express server (production)
├── index-simple.js   # Simple Express server (development)
├── start-dev.js      # Development server starter
└── package.json      # Backend dependencies
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm

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

## Server URLs

- **Backend:** https://blood-donate-backend-six.vercel.app/
- **Frontend:** https://blood-donate-4a1fa.web.app/

## API Endpoints

- `GET /` - Health check
- `GET /api/test` - API test
- `GET /public-requests` - Blood donation requests
- `GET /users/role/:email` - User role checking
- `POST /users` - User registration

## Deployment

- **Frontend:** Deployed on Firebase Hosting
- **Backend:** Deployed on Vercel

## Environment Variables

Create a `.env` file in the root directory with:
```
PORT=3000
# Add other environment variables as needed
```

## Technologies Used

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hot Toast

### Backend
- Express.js
- CORS
- MongoDB (production)
- Firebase Admin (authentication)
- Stripe (payments)
