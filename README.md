# Loomio - Community Task Management System

A comprehensive full-stack application for managing community tasks, events, attendance, and contributions with role-based access control.

## 🚀 Features

### Core Modules
- **User Management**: Registration, authentication, and profile management
- **Community Management**: Create and manage communities with member invitations
- **Task Management**: Create, assign, and track tasks with status workflow
- **Contribution System**: Point-based rewards for task completion and participation
- **Attendance Tracking**: Daily attendance marking and leave management
- **Event Calendar**: Community events and scheduling
- **Notifications**: Email and in-app notification system
- **Dashboard & Analytics**: Role-specific dashboards with reporting

### User Roles
- **Platform Admin**: System-wide management and oversight
- **Community Admin**: Community-specific management and member oversight
- **Member**: Task participation and contribution tracking

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database with Sequelize ORM
- **JWT** authentication
- **Nodemailer** for email notifications
- **Bcryptjs** for password hashing

### Frontend
- **React.js** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for form handling
- **Heroicons** for icons

## 📁 Project Structure

```
Loomio/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication and validation
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── env.example
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jvkousthub/Loomio.git
   cd Loomio
   ```

2. **Environment Configuration**
   ```bash
   copy .env.example .env
   ```
   
   Update the **single** `.env` file in the root directory with your credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=loomio_db
   DB_USER=root
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5000
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Install all dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

4. **Database Setup** (see Database Setup section below)

5. **Start the application**
   
   Option 1 - Use the quick start script (Windows):
   ```bash
   quick-start.bat
   ```
   
   Option 2 - Manual start:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

   - Backend API: `http://localhost:5000`
   - Frontend: `http://localhost:5173` (or the port shown in terminal)

### Backend Setup (Manual)

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=loomio_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key
   PORT=5000
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 📊 Database Schema

### Key Tables
- **Users**: User accounts with roles and community associations
- **Communities**: Community information and settings
- **Tasks**: Task details with assignments and status tracking
- **TaskAssignments**: Many-to-many relationship between tasks and users
- **Contributions**: Point-based contribution tracking
- **Attendance**: Daily attendance records
- **LeaveRequests**: Leave request management
- **Events**: Community events and calendar entries
- **Notifications**: In-app and email notifications

## 🔐 Authentication & Authorization

- **JWT-based authentication** with role-based access control
- **Protected routes** with middleware validation
- **Role-based permissions** for different user types
- **Secure password hashing** with bcryptjs

## 🎨 UI/UX Features

- **Responsive design** with Tailwind CSS
- **Modern interface** with clean, intuitive navigation
- **Role-specific dashboards** with relevant information
- **Real-time updates** for task status and notifications
- **Accessible components** following best practices

## 📈 Contribution System

### Point Allocation
- **Task Completion**: 10 points
- **Event Attendance**: 5 points
- **Discussion Participation**: 2 points

### Features
- **Personal dashboards** with contribution tracking
- **Community leaderboards** with ranking system
- **Monthly reports** and analytics
- **Achievement tracking** and milestones

## 🚀 Deployment

### Backend Deployment (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy the Express.js application

### Frontend Deployment (Vercel)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy the React application

### Database Setup
- Use a cloud MySQL provider (PlanetScale, Railway DB, or similar)
- Update environment variables with production database credentials

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Communities
- `GET /api/communities` - Get all communities
- `POST /api/communities` - Create community
- `GET /api/communities/:id` - Get community by ID
- `PUT /api/communities/:id` - Update community
- `DELETE /api/communities/:id` - Delete community
- `POST /api/communities/:id/invite` - Invite user to community

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/assign` - Assign task to users
- `PUT /api/tasks/:id/status` - Update task status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.

## 🔮 Future Enhancements

- **Real-time notifications** with WebSocket integration
- **File upload system** for task submissions
- **Advanced analytics** with charts and graphs
- **Mobile application** with React Native
- **Integration APIs** with external services
- **Advanced reporting** with PDF export
- **Multi-language support** for international communities