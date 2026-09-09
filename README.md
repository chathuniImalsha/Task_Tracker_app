# Task Tracker App

A simple MERN stack task management application with separate **Supervisor** and **Intern** roles.

## Features

* 🔐 User authentication
* 👨‍💼 Supervisor and Intern roles
* 📋 Task creation and management
* 📊 Task status and priority tracking
* 👤 Role-based access
* 📱 Responsive dashboard

## Tech Stack

**Frontend**

* React.js
* Axios
* CSS

**Backend**

* Node.js
* Express.js
* MongoDB
* JWT Authentication
  
### Tools

- Git & GitHub
- Postman
- VS Code
  
## Project Structure

```text
Task_Tracker_app/
├── frontend/
└── backend/
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/chathuniImalsha/Task_Tracker_app.git
cd Task_Tracker_app
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `.env` files.

### Backend

```env
PORT=5000
MONGO_URI=mongodb+srv://admin:admin2003@cluster0.s5spy7o.mongodb.net/intern_task_tracker?appName=Cluster0
JWT_SECRET=someLongRandomSecretString12345
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

## Demo Credentials

### Supervisor

```text
Email: supervisor@demo.com
Password: Supervisor123!
```

### Intern

```text
Email: intern@demo.com
Password: Intern123!
```

## API Documentation

Postman collection/API documentation is included in the project repository.

## Repository

GitHub: https://github.com/chathuniImalsha/Task_Tracker_app.git
