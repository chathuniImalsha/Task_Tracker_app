# Intern Task Tracker (MERN)

A web app for supervisors to manage interns and tasks, and for interns to
view assigned work and submit progress updates or self-logged tasks.
Built to match the project brief: role-based access (Supervisor / Intern),
JWT auth, and immutable intern submissions.

## Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs
- **Frontend:** React (Vite), React Router, Axios

## Project structure
```
intern-task-tracker/
├── backend/
│   ├── config/db.js
│   ├── models/          User.js, Task.js, TaskUpdate.js
│   ├── middleware/       auth.js (JWT verify), role.js (role gate)
│   ├── controllers/      authController, userController, taskController, updateController
│   ├── routes/           authRoutes, userRoutes, taskRoutes, updateRoutes
│   ├── seed.js           creates demo Supervisor + Intern accounts
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js          axios instance, attaches JWT, handles 401
    │   ├── context/AuthContext.jsx
    │   ├── components/ProtectedRoute.jsx
    │   ├── pages/Login.jsx, SupervisorDashboard.jsx, InternDashboard.jsx
    │   └── App.jsx
    └── .env.example
```

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed               # creates demo accounts (see below)
npm run dev                 # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts on http://localhost:5173
```

Make sure MongoDB is running locally (`mongod`) or point `MONGO_URI` at
MongoDB Atlas.

## Demo credentials
| Role       | Email               | Password        |
|------------|---------------------|-----------------|
| Supervisor | supervisor@demo.com | Supervisor123!  |
| Intern     | intern@demo.com     | Intern123!      |

(Created by `npm run seed`.)

## How the access rules are enforced
- `middleware/auth.js` verifies the JWT and loads the user onto `req.user`.
- `middleware/role.js` (`allowRoles("supervisor")` etc.) gates each route.
- Interns only ever query by `assignedTo: req.user._id` /
  `createdBy: req.user._id` — they can never see or touch another user's
  data, even if they guess an ID.
- `TaskUpdate` has no update/delete controller logic for interns. The
  `PATCH`/`DELETE /api/updates/:id` routes exist only to return **403** for
  everyone (per the brief), instead of a generic 404.

## API summary
See `Intern_Task_Tracker.postman_collection.json` for ready-to-run requests.

| Method | Route | Role |
|---|---|---|
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Any authenticated user |
| POST | /api/users/intern | Supervisor |
| GET | /api/users/interns | Supervisor |
| PATCH | /api/users/intern/:id/status | Supervisor |
| POST | /api/tasks | Supervisor |
| GET | /api/tasks | Supervisor |
| PATCH | /api/tasks/:id | Supervisor |
| DELETE | /api/tasks/:id | Supervisor |
| GET | /api/updates?groupBy=intern\|task | Supervisor |
| GET | /api/tasks/my | Intern |
| POST | /api/updates | Intern |
| GET | /api/updates/my | Intern |
| PATCH/DELETE | /api/updates/:id | Blocked (403), all roles |

## Notes / next steps
- This is an MVP scaffold matching the brief's Section 3 feature list —
  wire in your own styling/UI framework as needed.
- Add request validation (e.g. `express-validator` or `zod`) before
  production use.
- Consider adding refresh tokens and rate limiting on `/api/auth/login`.
