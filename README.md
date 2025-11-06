# Event Management System

A comprehensive event management system built with Node.js, Express, PostgreSQL, and React. This system facilitates end-to-end event planning, execution, and analysis with features for event creation, attendee registration, ticketing, check-in management, communication, and analytics.

## Features

### Core System Modules

- **Event Creation & Management**: Create events with detailed forms, multiple statuses (draft, published, canceled), and event duplication
- **Attendee Registration & Ticketing**: Customizable registration forms, multiple ticket types, secure payment processing, and waitlist functionality
- **Check-in & On-site Management**: Mobile-friendly QR code scanning, real-time check-in status updates, and badge generation
- **Communication Hub**: Bulk email messaging, pre/post-event email templates, and engagement tracking
- **Reporting & Analytics**: Registration trends, revenue tracking, attendance metrics, and data export capabilities

### User Roles & Permissions

- **Super Administrator**: Full system access, user management, system configuration
- **Event Manager**: Create/manage events, view analytics, manage attendees
- **Check-in Staff**: Mobile check-in interface, attendee verification

## Tech Stack

- **Frontend**: React.js with modern hooks and state management
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL with proper indexing and relationships
- **Authentication**: JWT-based authentication with role-based access control
- **Payments**: Stripe integration for secure payment processing
- **File Storage**: Local/cloud storage for event assets
- **Email**: Nodemailer with template support
- **QR Codes**: qrcode library for ticket generation

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- Redis (optional, for caching)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd event-management-system
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies (if using separate client directory)
cd client
npm install
cd ..
```

### 3. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE event_management;
CREATE USER event_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE event_management TO event_user;
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_management
DB_USER=event_user
DB_PASSWORD=your_password
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Seed the Database (Optional)

```bash
npm run seed
```

This will create sample data including:
- A super admin user (admin@example.com / admin123)
- Event managers (manager[1-3]@example.com / manager123)
- Check-in staff (staff[1-5]@example.com / staff123)
- Sample events and tickets

### 6. Configure Environment Variables

Update the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_management
DB_USER=event_user
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRE=30d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## Running the Application

### Development Mode

```bash
# Start backend server
npm run dev

# In another terminal, start frontend (if applicable)
cd client
npm start
```

The backend server will run on `http://localhost:5000`
The frontend will run on `http://localhost:3000`

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### User Management Endpoints

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/password` - Change password
- `PUT /api/users/:id/role` - Update user role (admin only)
- `PUT /api/users/:id/status` - Activate/deactivate user (admin only)

### Event Management Endpoints

- `GET /api/events` - List events with filtering
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/duplicate` - Duplicate event

### Ticket Management Endpoints

- `GET /api/events/:id/tickets` - Get event tickets
- `POST /api/events/:id/tickets` - Create ticket type
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Registration Endpoints

- `POST /api/events/:id/register` - Register for event
- `GET /api/registrations` - Get registrations (filtered)
- `GET /api/registrations/:id` - Get registration details
- `PUT /api/registrations/:id` - Update registration
- `DELETE /api/registrations/:id` - Cancel registration

### Payment Endpoints

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook handler

### Check-in Endpoints

- `GET /api/checkin/events/:id` - Get event check-ins
- `POST /api/checkin/scan` - Scan QR code for check-in
- `POST /api/checkin/manual` - Manual check-in
- `GET /api/checkin/stats/:eventId` - Get check-in statistics

### Communication Endpoints

- `GET /api/communications` - Get communications
- `POST /api/communications` - Create communication
- `POST /api/communications/:id/send` - Send communication
- `GET /api/communications/:id/logs` - Get communication logs

### Analytics Endpoints

- `GET /api/analytics/overview` - Get system overview
- `GET /api/analytics/events/:id` - Get event analytics
- `GET /api/analytics/trends` - Get registration trends
- `GET /api/analytics/export` - Export analytics data

## Database Schema

The system uses the following main tables:

- `users` - User accounts and authentication
- `events` - Event information and settings
- `tickets` - Ticket types and pricing
- `registrations` - Attendee registrations
- `checkins` - Check-in records
- `communications` - Email communications
- `analytics_*` - Various analytics tables

## Development Guidelines

### Code Structure

```
/
├── server/                 # Backend application
│   ├── controllers/        # Route controllers
│   ├── models/            # Database models
│   ├── middleware/        # Custom middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   └── migrations/        # Database migrations
├── client/                # Frontend React application
├── shared/                # Shared types and utilities
├── docs/                  # Documentation
└── tests/                 # Test files
```

### Coding Standards

- Use ES6+ syntax
- Follow RESTful API design principles
- Implement proper error handling and logging
- Write unit tests for business logic
- Use TypeScript for type safety
- Follow consistent naming conventions
- Implement proper database transactions

### Security Considerations

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting on API endpoints
- Secure password hashing
- Environment variable management

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Environment Setup

1. Set production environment variables
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx/Apache)
5. Set up monitoring and logging

### Database Migration

```bash
# Run production migrations
NODE_ENV=production npm run migrate
```

### Build and Deploy

```bash
# Build production assets
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.