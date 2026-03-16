# Debug Checklist: User Creation Not Saving to MongoDB

## Issue Description
When Admin creates a new team member (user), the data appears in the UI but is not being stored in MongoDB.

---

## Debug Checklist

### 1. Check MongoDB Connection

**Symptoms:** No errors in UI, but data not persisting

**Debug Steps:**
```bash
# Check if MongoDB is running (local)
# Windows:
net start MongoDB

# Or with Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Test Connection:**
```bash
# Test API health endpoint
curl http://localhost:5000/api/health

# Test database debug endpoint (requires admin auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/auth/debug/test-db
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "database": {
      "state": "connected",
      "readyState": 1,
      "host": "...",
      "name": "growth-valley"
    },
    "users": {
      "total": X,
      "active": Y
    }
  }
}
```

---

### 2. Check Environment Variables

**File:** `server/.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/growth-valley
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Common Issues:**
- [ ] `MONGODB_URI` not set or incorrect
- [ ] MongoDB Atlas IP whitelist (if using Atlas)
- [ ] Wrong database name

---

### 3. Check Server Logs

**Start server with debug output:**
```bash
cd server
npm run dev
```

**Look for:**
- `✅ MongoDB Connected: ...` - Success message
- `❌ Failed to connect to MongoDB...` - Connection failure
- `Error creating team member: ...` - Creation errors

---

### 4. Test API Directly (Postman/curl)

**Create User Request:**
```bash
curl -X POST http://localhost:5000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "performance_marketer",
    "specialization": "Facebook Ads",
    "availability": "available"
  }'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Team member created successfully",
  "data": {
    "_id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "performance_marketer",
    "specialization": "Facebook Ads",
    "availability": "available",
    "isActive": true
  }
}
```

---

### 5. Check Frontend Console

**Open Browser DevTools (F12):**
- Check Console for errors
- Check Network tab for API requests
- Look for failed POST requests to `/api/auth/create-user`

**Common Frontend Errors:**
- CORS issues
- Authentication token missing/expired
- Network timeout
- Request body format issues

---

### 6. Check Authentication

**Verify Admin Token:**
```bash
# Login as admin first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "adminpassword"}'
```

**Use the returned token for subsequent requests.**

---

### 7. Database Direct Query

**Connect to MongoDB directly:**
```bash
# Local MongoDB
mongosh

# Or with MongoDB Compass (GUI)
```

**Check users collection:**
```javascript
use growth-valley
db.users.find().pretty()
db.users.countDocuments()
```

---

### 8. Common Issues & Fixes

#### Issue: User created but can't login
**Cause:** Password not being hashed correctly
**Fix:** Check bcrypt is installed and working:
```bash
npm list bcryptjs
```

#### Issue: Duplicate email error
**Cause:** Email already exists in database
**Fix:** Use different email or delete existing user

#### Issue: Validation error
**Cause:** Missing required fields or invalid role
**Fix:** Ensure all required fields are provided:
- `name` (required)
- `email` (required, valid format)
- `password` (required, min 6 chars)
- `role` (must be one of: admin, performance_marketer, ui_ux_designer, graphic_designer, developer, tester)

#### Issue: JWT_SECRET not defined
**Cause:** Environment variable not loaded
**Fix:** Create `.env` file in server directory

---

### 9. Verify Frontend API Configuration

**File:** `client/src/services/api.js`

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Create `client/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 10. Seed Admin User

If no admin exists, create one:

```bash
cd server
npm run seed
```

Or manually via MongoDB:
```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$...(hashed password)",
  role: "admin",
  isActive: true,
  availability: "available"
})
```

---

## Quick Fix Commands

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start server
cd server && npm run dev

# Start client
cd client && npm run dev

# Test API health
curl http://localhost:5000/api/health
```

---

## Files Modified for This Fix

1. **server/src/controllers/authController.js**
   - Added validation for all input fields
   - Added project assignment capability
   - Improved error handling and logging
   - Added debug endpoint

2. **server/src/routes/auth.js**
   - Added debug route for testing

3. **server/src/models/User.js**
   - Improved password hashing error handling
   - Added static method for finding active users

4. **client/src/pages/team/TeamManagementPage.jsx**
   - Added project assignment dropdown
   - Improved error display
   - Better form validation

---

## Need Help?

1. Check server console for detailed error messages
2. Use the debug endpoint: `GET /api/auth/debug/test-db`
3. Verify MongoDB connection string in `.env`
4. Ensure admin user exists and can login
5. Check that all required fields are being sent from frontend