# Flight Crew Scheduling & Duty Time Compliance System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-Commercial-red)](LICENSE)

A comprehensive, production-ready web application for managing flight crew scheduling with real-time duty time compliance monitoring against regulatory standards (FAA Part 117, ICAO, DGCA).

## Features

### Core Functionality
- **Authentication & Authorization**: Secure JWT-based auth with role-based access control
- **Crew Management**: Complete crew profiles with license/certification tracking
- **Flight Scheduling**: Schedule flights with aircraft and crew management
- **Duty Time Compliance**: Real-time validation against FAA/ICAO/DGCA regulations
- **Crew Assignment**: Intelligent assignment with automatic compliance checking
- **Compliance Monitoring**: Dashboard for tracking crew compliance status
- **Analytics & Reporting**: Visual charts and compliance metrics

### Technical Highlights
- ✅ Full TypeScript implementation for type safety
- ✅ Responsive dark-themed UI with shadcn/ui components
- ✅ Real-time compliance engine with configurable rules
- ✅ MongoDB for scalable data storage
- ✅ RESTful API with comprehensive error handling
- ✅ Security-first architecture with encrypted authentication
- ✅ Production-ready with Docker support (optional)

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- MongoDB account (free tier available)
- Modern web browser

### Installation

1. **Clone or extract the project**
   ```bash
   cd flight-crew-scheduling
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB credentials
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Access the application**
   - Open http://localhost:3000
   - Login with: admin@airline.com / password123

## Documentation

### Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - Setup guide and quick reference
- **[SYSTEM_GUIDE.md](./SYSTEM_GUIDE.md)** - Detailed system documentation
- **[PROJECT_SUMMARY.txt](./PROJECT_SUMMARY.txt)** - Complete project overview

### Deployment & Operations
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification
- **[.env.example](./.env.example)** - Environment configuration template

## System Architecture

### Directory Structure
```
├── app/                           # Next.js App Router
│   ├── api/                       # RESTful API routes
│   ├── dashboard/                 # Protected UI pages
│   ├── login/ & register/         # Public auth pages
│   └── globals.css                # Theme & styling
├── models/                        # MongoDB schemas (7 collections)
├── lib/                           # Utilities (DB, Auth, etc.)
├── services/                      # Business logic (Compliance Engine)
└── middleware.ts                  # Route protection
```

### Technology Stack

**Backend:**
- Next.js 16 with App Router
- Node.js with TypeScript
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs Password Hashing

**Frontend:**
- React 19
- Tailwind CSS (Dark Theme)
- shadcn/ui Components
- Recharts (Analytics)
- Axios + SWR (Data)

## API Overview

### Authentication
```
POST   /api/auth/register    - Create user account
POST   /api/auth/login       - Authenticate user
POST   /api/auth/logout      - End session
```

### Crew Management
```
GET    /api/crew             - List all crew
POST   /api/crew             - Create crew member
GET    /api/crew/:id         - Get crew details
PUT    /api/crew/:id         - Update crew
DELETE /api/crew/:id         - Deactivate crew
```

### Flight Management
```
GET    /api/flights          - List flights
POST   /api/flights          - Schedule flight
GET    /api/flights/:id      - Get flight details
PUT    /api/flights/:id      - Update flight
DELETE /api/flights/:id      - Cancel flight
```

### Crew Assignment & Compliance
```
POST   /api/assignments      - Assign crew (with compliance check)
GET    /api/assignments      - List assignments
POST   /api/compliance/check - Check crew compliance
```

## Compliance Rules

### FAA Part 117 (Default)
| Rule | Limit |
|------|-------|
| 7-Day Duty Time | 60 hours max |
| 14-Day Duty Time | 110 hours max |
| Flight Duty Period | 9 hours max |
| Minimum Rest | 10 hours required |
| Consecutive Days | 7 days maximum |

Additional regulations (ICAO, DGCA) are supported and configurable.

## Database Models

The system uses MongoDB with 7 collections:

1. **User** - System users with roles
2. **CrewMember** - Crew profiles and certifications
3. **Flight** - Flight schedules and details
4. **DutyAssignment** - Crew-to-flight assignments
5. **DutyTimeTracking** - Period-based duty tracking
6. **ScheduleRequest** - Leave and schedule requests
7. **ComplianceRule** - Configurable compliance rules

## Pages & Features

### Public Pages
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - New account creation

### Dashboard Pages
- **Dashboard** (`/dashboard`) - Overview and statistics
- **Crew Management** (`/dashboard/crew`) - Manage crew members
- **Flight Scheduling** (`/dashboard/flights`) - Schedule flights
- **Scheduling** (`/dashboard/scheduling`) - Assign crews
- **Compliance** (`/dashboard/compliance`) - Monitor compliance

## Security Features

- ✅ JWT-based authentication with 7-day expiration
- ✅ HTTP-only cookies (XSS protection)
- ✅ Password hashing with bcryptjs
- ✅ Role-based access control
- ✅ Protected routes with middleware
- ✅ Input validation on all endpoints
- ✅ Secure environment variables

## Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm tsc          # Type check
pnpm lint         # Run linter
```

### Code Quality
- Full TypeScript type safety
- Component-based architecture
- Clear separation of concerns
- Comprehensive error handling
- Well-documented code

## Deployment

### Prerequisites
- MongoDB Atlas cluster or self-hosted MongoDB
- Node.js 18+ environment
- Environment variables configured

### Deployment Options
1. **Vercel** (Recommended for Next.js)
   - Connect GitHub repository
   - Set environment variables in Vercel dashboard
   - Auto-deploys on push

2. **Docker**
   - Build: `docker build -t flight-crew-system .`
   - Run: `docker run -e MONGODB_URI=... port 3000:3000`

3. **Traditional Hosting**
   - Run `pnpm build && pnpm start`
   - Configure reverse proxy (Nginx)
   - Set up SSL/TLS certificates

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed steps.

## Performance

- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Database Optimization**: Indexed queries
- **Caching**: SWR for client-side caching
- **Bundle Size**: Optimized with Next.js

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- [ ] PDF Report Generation
- [ ] Email Notifications
- [ ] SMS Alerts
- [ ] Calendar-Based UI
- [ ] Advanced Analytics
- [ ] Leave Request System
- [ ] Mobile App (React Native)
- [ ] External Integrations (Payroll, etc.)

## Support & Issues

For questions or issues:
1. Check the documentation files
2. Review the API endpoints
3. Check error logs in the browser console
4. Contact the development team

## License

Commercial License - All rights reserved

## Version

**Version**: 1.0.0  
**Release Date**: May 12, 2026  
**Status**: Production Ready

---

## Quick Reference

### Default Credentials (Demo)
- Email: `admin@airline.com`
- Password: `password123`

### MongoDB Setup
1. Create account at [mongodb.com](https://www.mongodb.com)
2. Create free cluster (M0 tier)
3. Create database user
4. Copy connection string
5. Add to `.env.local`

### Environment Variables Required
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=production
```

---

**Built with Next.js 16, React 19, MongoDB, and TypeScript**

For detailed information, see the documentation files above.
"# flight-crew-management" 
