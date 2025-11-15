# 🎫 Event Management Pro

A comprehensive, modern event management platform built with React, Node.js, and TypeScript. Features complete event lifecycle management, real-time analytics, registration systems, and professional check-in capabilities.

![Event Management](https://img.shields.io/badge/React-18-blue)
![Node](https://img.shields.io/badge/Node.js-18-green)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38B2AC)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎯 Core Event Management
- **Full CRUD Operations** - Create, read, update, delete events
- **Advanced Filtering** - Search by title, description, location, status
- **Event Status Management** - Draft, published, featured events
- **Venue Management** - Multiple venue support with capacity tracking
- **Tag System** - Categorize events with flexible tags

### 🎟️ Registration & Ticketing
- **Multi-tier Ticketing** - General, VIP, Student, Early Bird tickets
- **Real-time Registration** - Live attendee tracking and capacity management
- **QR Code Generation** - Automatic QR codes for check-in management
- **Registration Status** - Pending, confirmed, checked-in states
- **Attendee Analytics** - Comprehensive registration data and insights

### 📊 Analytics Dashboard
- **Real-time Metrics** - Live event statistics and performance data
- **Revenue Tracking** - Financial insights and ticket sales analytics
- **Attendance Analytics** - Check-in rates and attendance patterns
- **Monthly Performance** - Trend analysis and growth metrics
- **Top Performing Events** - Ranking and performance comparison

### 💬 Communication System
- **Email Campaigns** - Targeted communication with event attendees
- **Template Management** - Pre-built and custom email templates
- **Bulk Messaging** - Send notifications to specific attendee groups
- **Campaign Tracking** - Monitor communication effectiveness
- **Scheduled Communications** - Plan and automate message delivery

### 🔐 Security & Admin
- **Role-based Access Control** - Admin, event manager, check-in staff roles
- **JWT Authentication** - Secure token-based authentication system
- **Admin-only Registration** - Controlled user account creation
- **API Security** - Protected endpoints with middleware
- **Data Validation** - Input sanitization and validation

### 📱 User Experience
- **Responsive Design** - Mobile-first, works on all devices
- **Real-time Updates** - Live data synchronization
- **Intuitive Dashboard** - Clean, professional interface
- **Search & Discovery** - Powerful event search functionality
- **Performance Optimized** - Fast loading and smooth interactions

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern component-based UI
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **React Hot Toast** - Elegant notifications

### Backend
- **Node.js 18** - Server runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe backend development
- **SQLite** - Database (PostgreSQL-ready schema)
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **UUID** - Unique identifier generation
- **CORS** - Cross-origin resource sharing

### DevOps & Tools
- **Git** - Version control
- **GitHub Actions** - CI/CD pipeline
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **NPM** - Package management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- NPM or Yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/salvadalba/event-management-system.git
cd event-management-system
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

3. **Environment Configuration**
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit environment variables
nano server/.env
```

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_management
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key

# Server Configuration
PORT=5001
NODE_ENV=development
```

### Running the Application

1. **Start the backend server**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5001`

2. **Start the frontend application**
```bash
cd client
npm run dev
```
Application runs on `http://localhost:3000`

### Default Login
- **Email**: admin@eventmanager.com
- **Password**: admin123

## 📱 Usage

### Creating Events
1. Navigate to Events → Create Event
2. Fill in event details (title, description, venue, capacity)
3. Add ticket types and pricing
4. Set event dates and tags
5. Publish your event

### Managing Registrations
1. View event registrations in the Registrations tab
2. Monitor attendee check-in status
3. Generate QR codes for event entry
4. Export registration data

### Analytics & Insights
1. Access the Analytics dashboard
2. Monitor real-time event metrics
3. Track revenue and attendance
4. View performance trends

### Communication
1. Create email campaigns for events
2. Target specific attendee segments
3. Schedule automated communications
4. Track campaign performance

## 🏗️ Project Structure

```
event-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   ├── public/
│   └── package.json
├── server/                # Node.js backend
│   ├── database/         # Database schemas
│   ├── comprehensive-server.js  # Main server file
│   └── package.json
├── shared/               # Shared types and utilities
├── docs/                 # Documentation
└── README.md
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Registrations
- `GET /api/registrations` - List registrations
- `POST /api/registrations` - Create registration
- `POST /api/registrations/:id/checkin` - Check-in attendee

### Analytics
- `GET /api/analytics/overview` - Get analytics dashboard data

### Communications
- `GET /api/communications` - List communications
- `POST /api/communications` - Create communication
- `POST /api/communications/:id/send` - Send communication

## 🗄️ Database Schema

The application uses a comprehensive relational database schema with the following main tables:

- **users** - User accounts and authentication
- **events** - Event information and metadata
- **venues** - Event venues and locations
- **tickets** - Event ticket types and pricing
- **registrations** - Attendee registrations and check-ins
- **checkins** - Event check-in records
- **communications** - Email campaigns and messages
- **analytics** - Performance metrics and insights

The schema is PostgreSQL-ready and includes proper foreign key relationships, indexes, and constraints.

## 🧪 Testing

```bash
# Run frontend tests
cd client
npm test

# Run backend tests
cd server
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Build & Deployment

### Development Build
```bash
cd client
npm run build
```

### Production Deployment

#### Option 1: Railway + Vercel (Recommended)
1. **Backend**: Deploy to [Railway](https://railway.app)
2. **Frontend**: Deploy to [Vercel](https://vercel.com)
3. **Cost**: ~$5/month total
4. **Setup time**: 30 minutes

#### Option 2: GitHub Actions + VPS
1. **VPS**: Get $5/month VPS (DigitalOcean/Linode)
2. **CI/CD**: Set up GitHub Actions workflow
3. **Database**: PostgreSQL on VPS
4. **Cost**: $5/month + domain
5. **Setup time**: 1-2 hours

### Docker Deployment (Demo API + Static Frontend)
```bash
# Build and run demo API (in-memory) and static frontend
docker-compose up -d

# Frontend: http://localhost:8080
# API:      http://localhost:5000/api
```

### Production Deployment (Recommended)

#### Frontend (Vercel)
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `client/build`
- Environment:
  - `VITE_API_BASE_URL=https://<your-api-host>/api`

#### Backend (Render/Railway)
- Runtime: `Node 18`
- Start command: `node server/index.js` (full API) or `node server/demo.js` (demo)
- Environment:
  - `PORT=5000`
  - `CLIENT_URL=https://<your-frontend-host>`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRE`, `JWT_REFRESH_EXPIRE`
  - Database vars if using full API (PostgreSQL)

### GitHub Actions CI
- Located at `.github/workflows/ci.yml`
- Builds client, runs server tests, and Playwright E2E
- Can be extended with deployment steps using provider secrets

## 🔧 Configuration

### Frontend Configuration
```env
# client/.env
VITE_API_BASE_URL=https://<your-api-host>/api
```

### Backend Configuration
```env
PORT=5000
CLIENT_URL=https://<your-frontend-host>
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d
# Database vars if using full API
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Write clean, documented code
- Test your changes thoroughly
- Maintain code formatting with Prettier

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Redux Toolkit for state management
- Express.js for the robust backend framework
- All contributors and users of this project

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/salvadalba/event-management-system/issues)
- **Email**: salvadalba@example.com
- **Documentation**: [Project Wiki](https://github.com/salvadalba/event-management-system/wiki)

---

<div align="center">

**Built with ❤️ for the event management community**

[⭐ Star this repository](https://github.com/salvadalba/event-management-system) | [🐛 Report issues](https://github.com/salvadalba/event-management-system/issues) | [📖 View documentation](https://github.com/salvadalba/event-management-system/wiki)

</div>

## 📈 Roadmap

### Version 1.1
- [ ] Mobile application
- [ ] Payment gateway integration
- [ ] Advanced reporting
- [ ] Multi-language support

### Version 1.2
- [ ] Event calendar view
- [ ] Social media integration
- [ ] Advanced analytics
- [ ] API rate limiting

### Version 2.0
- [ ] Microservices architecture
- [ ] Real-time notifications
- [ ] Mobile push notifications
- [ ] Advanced user roles

---

**🎉 Thank you for using Event Management Pro! Your feedback and contributions help make this project better.**
