# Flight Crew Scheduling & Duty Time Compliance System

## Features
### Core Functionality
- **Authentication & Authorization**: Secure JWT-based auth with role-based access control
- **Crew Management**: Complete crew profiles with license/certification tracking
- **Flight Scheduling**: Schedule flights with aircraft and crew management
- **Duty Time Compliance**: Real-time validation against FAA/ICAO/DGCA regulations
- **Crew Assignment**: Intelligent assignment with automatic compliance checking
- **Compliance Monitoring**: Dashboard for tracking crew compliance status
- **Analytics & Reporting**: Visual charts and compliance metrics

### Prerequisites
- Node.js 18+ and pnpm
- MongoDB account (free tier available)
- Modern web browser

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

## Database Models

The system uses MongoDB with 7 collections:

1. **User** - System users with roles
2. **CrewMember** - Crew profiles and certifications
3. **Flight** - Flight schedules and details
4. **DutyAssignment** - Crew-to-flight assignments
5. **DutyTimeTracking** - Period-based duty tracking
6. **ScheduleRequest** - Leave and schedule requests
7. **ComplianceRule** - Configurable compliance rules

## Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm tsc          # Type check
pnpm lint         # Run linter
```

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
