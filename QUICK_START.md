# Quick Start Guide

## Prerequisites
- Node.js v16+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## Setup (5 minutes)

### 1. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mbytes-forum
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
PORT=5000
ADMIN_EMAIL=admin@mbytes.com
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:5173
```

Initialize database:
```bash
npm run init
```

Start server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start development server:
```bash
npm run dev
```

### 3. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## First Steps

### 1. Login as Admin
- Go to http://localhost:5173/admin/login
- Email: `admin@mbytes.com`
- Password: `admin123` (or your custom password)

### 2. Import Students
- Go to "Import Students" tab
- Upload `sample-students.csv` or add students manually
- CSV format: `registerNo,name,Password,year,department`

### 3. Add Candidates
- Go to "Add Candidate" tab
- Fill in candidate details for each post
- Add candidates for all 8 posts:
  - President
  - Vice President
  - Secretary
  - Joint Secretary
  - Treasurer
  - Event Organizer
  - Sports Coordinator
  - Media Coordinator

### 4. Start Voting
- Go to "Dashboard" tab
- Click "Start Voting"
- Students can now login and vote

### 5. Test Student Login
- Go to http://localhost:5173/student/login
- Use one of the imported student credentials
- Register Number: `REG001`
- Password: `password123` (from CSV)

### 6. Announce Results
- After voting, go to Admin Dashboard
- Click "Announce Result" for each post
- Results will be displayed to all users

## Testing Checklist

- [ ] Admin login works
- [ ] Student import works (CSV or manual)
- [ ] Candidates can be added
- [ ] Voting can be started
- [ ] Students can login and vote
- [ ] Timer counts down (20 seconds per post)
- [ ] Results can be announced
- [ ] Forum committee displays correctly

## Troubleshooting

### MongoDB Connection Error
- Check MongoDB Atlas IP whitelist
- Verify connection string in `.env`
- Ensure database user has proper permissions

### Socket.io Not Connecting
- Check CORS settings in `backend/server.js`
- Verify `FRONTEND_URL` in backend `.env`
- Check browser console for errors

### CSV Import Fails
- Verify CSV format matches sample
- Check column names are exact: `registerNo,name,Password,year,department`
- Ensure `Password` has capital P

### Votes Not Submitting
- Check voting status (must be "in_progress")
- Verify current post matches vote post
- Check for duplicate votes
- Review server logs for errors

## Next Steps

1. Read `README.md` for detailed documentation
2. Read `DEPLOYMENT.md` for production deployment
3. Read `IMPLEMENTATION_SUMMARY.md` for technical details

## Support

For issues, check the logs:
- Backend: Check terminal/console output
- Frontend: Check browser console
- MongoDB: Check Atlas logs

Happy voting! 🗳️


