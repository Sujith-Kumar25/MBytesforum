# Deployment Guide

## Quick Start

### Backend Deployment (Render)

1. **Create Render Account**
   - Sign up at https://render.com
   - Connect your GitHub repository

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select the repository branch
   - Set the following:
     - **Name**: mbytes-forum-backend
     - **Root Directory**: backend
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`

3. **Environment Variables**
   Add the following environment variables in Render dashboard:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mbytes-forum
   JWT_SECRET=your-very-secure-random-string-here
   NODE_ENV=production
   ADMIN_EMAIL=admin@mbytes.com
   ADMIN_PASSWORD=your-secure-admin-password
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **MongoDB Atlas Setup**
   - Create MongoDB Atlas account
   - Create a cluster
   - Create a database user
   - Whitelist IP addresses: Add `0.0.0.0/0` (allows all IPs) or Render's IP range
   - Get connection string and update `MONGODB_URI`

5. **Initialize Database**
   - After deployment, SSH into Render or use Render Shell
   - Run: `node scripts/init.js` to create admin user and posts

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Environment Variables**
   In Vercel dashboard, add:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```

4. **Rebuild**
   After setting environment variables, rebuild the deployment in Vercel dashboard.

## Local Development

### Backend
```bash
cd backend
npm install
# Create .env file with your variables
node scripts/init.js  # Initialize admin and posts
npm start  # or npm run dev for development
```

### Frontend
```bash
cd frontend
npm install
# Create .env file
npm run dev
```

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is deployed and accessible
- [ ] MongoDB Atlas connection is working
- [ ] Admin user is created (run init script)
- [ ] Environment variables are set correctly
- [ ] CORS is configured properly
- [ ] Socket.io connection is working
- [ ] CSV upload directory exists (backend/uploads)
- [ ] Test admin login
- [ ] Test student login
- [ ] Test voting flow
- [ ] Test result announcement

## Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify MongoDB connection string
- Check environment variables
- Ensure uploads directory exists

### Frontend Issues
- Check Vercel build logs
- Verify environment variables
- Check API URL in browser network tab
- Verify Socket.io connection

### Socket.io Issues
- Check CORS settings
- Verify FRONTEND_URL matches frontend domain
- Check firewall settings
- Test WebSocket connection in browser console

## Security Notes

- Change default admin credentials
- Use strong JWT_SECRET
- Restrict MongoDB Atlas IP whitelist if possible
- Use HTTPS in production
- Regularly update dependencies


