# Growth Valley - Performance Marketer Dashboard

A production-ready MERN stack dashboard for performance marketers, featuring a stage-gated workflow for managing marketing projects.

## Features

### Stage-Gated Workflow
1. **Customer Onboarding** - Initial customer information collection
2. **Market Research** - Customer avatar, pain points, desires, competitor analysis
3. **Offer Engineering** - Value propositions, bonus stacks, guarantees, pricing
4. **Traffic Strategy** - Channel selection, hooks, budget allocation
5. **Landing Page & Lead Capture** - Page type selection, lead capture methods, nurturing
6. **Creative Strategy** - Creative cards for awareness, consideration, conversion stages

### Core Functionality
- User authentication with JWT
- Project management with progress tracking
- Stage-gating (cannot access next stage until current is complete)
- File uploads for vision boards and strategy sheets
- Real-time notifications via Socket.io
- Toast notifications
- Responsive design with TailwindCSS

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- Socket.io for real-time
- JWT Authentication
- Multer + Cloudinary (file uploads)

### Frontend
- React 18 with Vite
- TailwindCSS
- React Router v6
- React Hook Form + Zod
- Axios + Socket.io Client

---

## 🚀 Deployment Guide

### Prerequisites
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier available)
- [Vercel](https://vercel.com) account (for frontend)
- [Railway](https://railway.app) account (for backend) - free tier available
- GitHub repository

---

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster
2. Create a database user:
   - Database Access → Add New Database User
   - Username: `growthvalley`
   - Password: (generate a secure password)
   - Permissions: Read and write to any database
3. Whitelist all IPs:
   - Network Access → Add IP → `0.0.0.0/0` (allows Railway/Vercel access)
4. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password

---

### 2. Backend Deployment (Railway)

1. Go to [Railway](https://railway.app) and sign up (use GitHub for easier integration)

2. Create New Project:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Set **Root Directory** to `server`

3. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://growthvalley:YOUR_PASSWORD@cluster.mongodb.net/growth-valley?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRE=7d
   CLIENT_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   PORT=5000
   ```

4. Railway will auto-detect Node.js and deploy

5. Get your backend URL:
   - Settings → Domains → Generate Domain
   - Your URL will be like: `https://your-app.railway.app`

6. Seed the database:
   ```bash
   # Using Railway CLI
   railway login
   railway link
   railway run npm run seed

   # Or locally (with MONGODB_URI pointing to Atlas)
   cd server
   npm install
   npm run seed
   ```

---

### 3. Frontend Deployment (Vercel)

1. Go to [Vercel](https://vercel.com) and sign up (use GitHub for easier integration)

2. Import Project:
   - Click "New Project"
   - Import from GitHub
   - Select your repository

3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

5. Click "Deploy"

6. Get your frontend URL:
   - Your URL will be like: `https://your-app.vercel.app`

---

### 4. Update CORS (Important!)

After both deployments are complete:

1. Go to Railway dashboard
2. Update `CLIENT_URL` in environment variables to your Vercel URL
3. Railway will auto-redeploy

---

## Local Development

### Backend Setup
```bash
cd server
npm install
# Create .env file (copy from server/.env.example)
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
# Create .env with VITE_API_URL=http://localhost:5000/api
npm run dev
```

### Seed Database
```bash
cd server
npm run seed
```

---

## Environment Variables

### Server (.env)
```env
MONGODB_URI=mongodb://localhost:27017/growth-valley
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@growthvalley.com | admin123 |
| Performance Marketer | marketer@growthvalley.com | marketer123 |
| Content Creator | content@growthvalley.com | content123 |
| UI/UX Designer | uiux@growthvalley.com | uiux123 |
| Graphic Designer | graphic@growthvalley.com | graphic123 |
| Developer | developer@growthvalley.com | developer123 |
| Tester | tester@growthvalley.com | tester123 |

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/progress` - Get project progress
- `GET /api/projects/dashboard/stats` - Get dashboard stats

### Market Research
- `GET /api/market-research/:projectId` - Get market research
- `POST /api/market-research/:projectId` - Create/update market research
- `POST /api/market-research/:projectId/vision-board` - Upload vision board
- `POST /api/market-research/:projectId/strategy-sheet` - Upload strategy sheet

### Offer Engineering
- `GET /api/offers/:projectId` - Get offer
- `POST /api/offers/:projectId` - Create/update offer
- `POST /api/offers/:projectId/bonuses` - Add bonus
- `DELETE /api/offers/:projectId/bonuses/:bonusId` - Remove bonus

### Traffic Strategy
- `GET /api/traffic-strategy/:projectId` - Get traffic strategy
- `POST /api/traffic-strategy/:projectId` - Create/update traffic strategy

### Landing Pages
- `GET /api/landing-pages/:projectId` - Get landing page strategy
- `POST /api/landing-pages/:projectId` - Create/update landing page strategy

### Creative Strategy
- `GET /api/creatives/:projectId` - Get creative strategy
- `POST /api/creatives/:projectId` - Create/update creative strategy

---

## Stage Gating Logic

The system enforces a strict stage-gated workflow:

1. Onboarding (automatically completed on project creation)
2. Market Research (requires Onboarding complete)
3. Offer Engineering (requires Market Research complete)
4. Traffic Strategy (requires Offer Engineering complete)
5. Landing Page (requires Traffic Strategy complete)
6. Creative Strategy (requires Landing Page complete)

---

## License

MIT License - Growth Valley