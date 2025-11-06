# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive event management system built with a modern tech stack. The system facilitates end-to-end event planning, execution, and analysis with features for event creation, attendee registration, ticketing, check-in management, communication, and analytics.

## Technology Stack

- **Frontend**: React.js with modern hooks and state management
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL with proper indexing and relationships
- **Authentication**: JWT-based authentication with role-based access control
- **Payments**: Stripe integration for secure payment processing
- **File Storage**: Local/cloud storage for event assets
- **Email**: Nodemailer with template support
- **QR Codes**: qrcode library for ticket generation

## Development Commands

### Backend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

### Frontend Development
```bash
# Navigate to frontend directory
cd client

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Run linting
npm run lint
```

### Database Operations
```bash
# Reset database
npm run db:reset

# Create new migration
npm run migration:create <migration_name>

# Run specific migration
npm run migrate:up <migration_file>

# Rollback migration
npm run migrate:down <migration_file>
```

## Project Structure

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
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # React context providers
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS/styling files
│   └── public/            # Static assets
├── shared/                # Shared types and utilities
├── docs/                  # Documentation
└── tests/                 # Test files
```

## Core System Architecture

### User Roles & Permissions
- **Super Administrator**: Full system access, user management, system configuration
- **Event Manager**: Create/manage events, view analytics, manage attendees
- **Check-in Staff**: Mobile check-in interface, attendee verification

### Key Modules
1. **Event Management**: CRUD operations for events with draft/published/canceled statuses
2. **Registration & Ticketing**: Multi-tier ticket system with pricing and inventory management
3. **Payment Processing**: Stripe integration with secure payment handling
4. **Check-in System**: QR code scanning and real-time status updates
5. **Communication Hub**: Email templates and bulk messaging
6. **Analytics Dashboard**: Registration trends, revenue tracking, attendance metrics

### Database Schema
- **Users**: Authentication and role management
- **Events**: Event details with status tracking
- **Tickets**: Ticket types with pricing and limits
- **Registrations**: Attendee registrations with payment status
- **CheckIns**: Check-in records and status tracking
- **Communications**: Email logs and templates

## API Design Patterns

### RESTful Endpoints
- `GET /api/events` - List events with filtering
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/register` - Register for event
- `POST /api/registrations/:id/checkin` - Check-in attendee

### Authentication Flow
- JWT tokens for API authentication
- Role-based middleware for route protection
- Refresh token mechanism for extended sessions

## Security Considerations

- Input validation and sanitization
- SQL injection prevention with parameterized queries
- XSS protection with proper escaping
- CSRF protection for state-changing operations
- Rate limiting on API endpoints
- Secure password hashing with bcrypt
- Environment variable management for sensitive data

## Development Guidelines

- Follow RESTful API design principles
- Implement proper error handling and logging
- Use async/await for asynchronous operations
- Validate all user inputs
- Write unit tests for business logic
- Use TypeScript for type safety
- Follow consistent naming conventions
- Implement proper database transactions for complex operations

## Testing Strategy

- Unit tests for utility functions and services
- Integration tests for API endpoints
- Database tests with test fixtures
- Frontend component testing with React Testing Library
- End-to-end tests for critical user flows

## Performance Optimization

- Database indexing on frequently queried columns
- Pagination for large datasets
- Caching strategies for static data
- Image optimization for event assets
- Lazy loading for frontend components
- API response compression

This system is designed to be scalable, secure, and user-friendly for both event organizers and attendees.