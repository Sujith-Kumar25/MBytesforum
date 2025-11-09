# M-Bytes Forum Election System

A comprehensive MERN stack election system for managing forum committee elections with real-time voting, result announcement, and admin controls.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io
- **Frontend**: React, Vite, Tailwind CSS, Socket.io Client
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: MongoDB Atlas (or local MongoDB)

## Features

### Admin Features
- Admin authentication with JWT
- Import students via CSV or manual entry
- Add candidates for each post
- Control voting lifecycle (Start, Pause, End)
- Real-time post-by-post voting (20 seconds per post)
- Announce results per post
- View aggregated vote totals
- View Forum Committee

### Student Features
- Student login (no public signup - preloaded credentials only)
- Real-time voting interface
- Vote for one candidate per post
- View announced results
- View Forum Committee
- Automatic completion message when all posts voted

### Security Features
- Password hashing with bcrypt
- JWT-based authentication
- Server-side vote validation
- Atomic vote operations (MongoDB transactions)
- Duplicate vote prevention
- Vote count visibility control (hidden during voting)

## Project Structure

```
MBytes-forum/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── socket/          # Socket.io handlers
│   ├── scripts/         # Initialization scripts
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React context providers
│   │   ├── pages/       # Page components
│   │   ├── utils/       # API utilities
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mbytes-forum
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
PORT=5000
ADMIN_EMAIL=admin@mbytes.com
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:5173
```

4. Initialize database (create admin user and posts):
```bash
node scripts/init.js
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/student/login` - Student login

### Admin (Protected)
- `POST /api/admin/students/import` - Import students from CSV
- `POST /api/admin/students` - Add single student
- `GET /api/admin/students` - List all students
- `POST /api/admin/candidates` - Add candidate
- `GET /api/admin/candidates` - List all candidates
- `POST /api/admin/control/start` - Start voting
- `POST /api/admin/control/next` - Move to next post (manual)
- `POST /api/admin/control/end` - End voting
- `GET /api/admin/post-totals` - Get aggregated vote totals per post
- `POST /api/admin/announce/:post` - Announce result for a post

### Student (Protected)
- `GET /api/student/posts/current` - Get current post info

### Public
- `GET /api/posts` - List all posts
- `GET /api/candidates/:post` - Get candidates for a post (no vote counts)
- `GET /api/forum-committee` - Get forum committee members

### Voting
- `POST /api/vote` - Submit vote (body: { studentRegisterNo, post, candidateId })

## Socket.io Events

### Server Emits
- `votingStatus` - Current voting status: `{ status: "not_started" | "in_progress" | "ended" }`
- `votingStarted` - Voting has started
- `votingEnded` - Voting has ended
- `showPost` - Show post for voting: `{ post: string, remainingTime: number }`
- `resultAnnounced` - Result announced for a post: `{ post, winnerId, winnerName, totalVotesPerCandidate, announcedAt }`
- `studentCompleted` - Student has completed voting: `{ registerNo, name }`

### Client Emits
- `joinVoting` - Student joins voting: `{ registerNo }`
- `vote` - Submit vote via socket (optional, REST API is primary)

## Database Models

### Student
```javascript
{
  registerNo: String (unique),
  name: String,
  password: String (hashed),
  department: String,
  year: String,
  hasVoted: Boolean,
  votedPosts: Map<post, candidateId>
}
```

### Candidate
```javascript
{
  name: String,
  post: String,
  department: String,
  year: String,
  manifesto: String,
  photoUrl: String,
  votes: Number
}
```

### Post
```javascript
{
  name: String (unique),
  order: Number
}
```

### Vote
```javascript
{
  studentId: ObjectId,
  studentRegisterNo: String,
  post: String,
  candidateId: ObjectId
}
```

### Result
```javascript
{
  post: String (unique),
  winnerId: ObjectId,
  winnerName: String,
  totalVotesPerCandidate: Array<{candidateId, name, votes}>,
  announcedAt: Date
}
```

### ForumCommittee
```javascript
{
  post: String (unique),
  candidateId: ObjectId,
  name: String,
  dept: String,
  year: String,
  announcedAt: Date
}
```

### AdminControl
```javascript
{
  status: "not_started" | "in_progress" | "ended",
  currentPost: String | null,
  postStartAt: Date | null,
  currentPostIndex: Number
}
```

## CSV Import Format

The CSV file for importing students should have the following columns:

```csv
registerNo,name,Password,year,department
REG001,John Doe,password123,2023,CSE
REG002,Jane Smith,password456,2023,ECE
```

**Note**: Column names are case-sensitive. The password column must be named `Password` (capital P).

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - A secure random string
   - `NODE_ENV` - `production`
   - `PORT` - Render will provide this automatically
   - `FRONTEND_URL` - Your frontend URL (e.g., `https://your-frontend.vercel.app`)
   - `ADMIN_EMAIL` - Admin email
   - `ADMIN_PASSWORD` - Admin password

6. Ensure MongoDB Atlas allows connections from `0.0.0.0/0` (or Render's IP range)

### Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Build the project: `npm run build`
4. Deploy: `vercel`
5. Set environment variables in Vercel dashboard:
   - `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.onrender.com/api`)
   - `VITE_SOCKET_URL` - Your backend Socket.io URL (e.g., `https://your-backend.onrender.com`)

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist IP addresses:
   - For development: Add your local IP
   - For production: Add `0.0.0.0/0` (allows all IPs) or Render's IP range
5. Get connection string and update `MONGODB_URI` in `.env`

## Testing

### Test Plan

1. **Login Test**
   - Test admin login with correct credentials
   - Test student login with preloaded credentials
   - Test student login with non-existent register number
   - Test student login after already voting

2. **Voting Flow Test**
   - Admin starts voting
   - Students see "Join" button
   - Students join and see first post
   - 20-second timer counts down
   - Students vote for candidates
   - System moves to next post automatically
   - Student completes all posts and sees completion message

3. **Admin Controls Test**
   - Import students via CSV
   - Add students manually
   - Add candidates
   - Start voting
   - View post totals (aggregated)
   - Announce results for each post
   - View Forum Committee

4. **Result Announcement Test**
   - Admin announces result for a post
   - Students see winner details
   - Forum Committee updates in real-time
   - Vote counts displayed for announced posts

## Usage Workflow

1. **Initial Setup**
   - Deploy backend and frontend
   - Initialize admin user (run `node scripts/init.js`)
   - Login as admin
   - Import students via CSV or manual entry
   - Add candidates for each post

2. **Voting Process**
   - Admin clicks "Start Voting"
   - Students login and click "Join"
   - System shows posts one by one (20 seconds each)
   - Students vote for candidates
   - After all posts, students see completion message

3. **Result Announcement**
   - Admin views post totals
   - Admin clicks "Announce Result" for each post
   - Results are displayed to all users
   - Forum Committee is updated in real-time

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Vote submissions use MongoDB transactions for atomicity
- Duplicate votes are prevented at database level
- Vote counts are hidden from students during voting
- Only admins can view candidate-level vote counts

## Troubleshooting

### MongoDB Connection Issues
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has proper permissions

### Socket.io Connection Issues
- Check CORS settings in server.js
- Verify `FRONTEND_URL` environment variable
- Check firewall settings

### Vote Submission Issues
- Verify student is authenticated
- Check voting status (must be "in_progress")
- Ensure current post matches vote post
- Check for duplicate votes

## License

This project is licensed under the ISC License.

## Support

For issues or questions, please contact the development team.


