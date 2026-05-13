# Quick Start Guide - Flight Crew Scheduling System

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- MongoDB account (free tier available at mongodb.com)
- Git (optional)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables

**Create `.env.local` file in project root:**

```env
MONGODB_URI=mongodb://localhost:27017/flight-crew-scheduling
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
```

**To get MongoDB Connection String:**
1. Create account at mongodb.com
2. Create a free MongoDB Atlas cluster
3. Click "Connect" and copy the connection string
4. Replace `<username>` and `<password>` with your credentials

### 4. Start Development Server
```bash
pnpm dev
```

Server will run at `http://localhost:3000`

## Demo Access

### Login Credentials
- **Email**: admin@airline.com
- **Password**: password123

Or create your own account by clicking "Create Account" on the login page.

## System Structure

```
/app
  ├── api/                    # API endpoints
  │   ├── auth/              # Authentication routes
  │   ├── crew/              # Crew management
  │   ├── flights/           # Flight management
  │   ├── assignments/       # Crew assignments
  │   └── compliance/        # Compliance checking
  ├── dashboard/             # Protected pages
  │   ├── page.tsx           # Main dashboard
  │   ├── crew/              # Crew management UI
  │   ├── flights/           # Flight scheduling UI
  │   ├── scheduling/        # Assignment UI
  │   └── compliance/        # Compliance monitoring UI
  ├── login/                 # Authentication pages
  ├── register/
  └── globals.css            # Theme & styling

/models                       # MongoDB schemas
  ├── User.ts
  ├── Crew.ts
  ├── Flight.ts
  ├── DutyAssignment.ts
  ├── DutyTimeTracking.ts
  ├── ScheduleRequest.ts
  └── ComplianceRule.ts

/lib
  ├── db.ts                  # MongoDB connection
  ├── auth.ts                # JWT utilities
  └── utils.ts               # Helper functions

/services
  └── complianceService.ts   # Duty time compliance engine

/middleware.ts               # Route protection
```

## Core Features

### Dashboard
- Overview of crew and flight statistics
- Compliance status summary
- Weekly activity charts
- Quick navigation to other modules

### Crew Management
- Add/edit crew member profiles
- Track licenses and certifications
- Monitor crew availability status
- View employment details

### Flight Scheduling
- Schedule new flights
- Assign crews to flights
- Automatic compliance checking
- Flight status tracking

### Duty Time Compliance
- Real-time duty time monitoring
- 7-day, 14-day, and 28-day cycle limits
- Flight duty period restrictions
- Minimum rest requirements
- Visual status indicators

### Crew Assignment
- Intelligent crew-to-flight matching
- Compliance validation during assignment
- Violation alerts and warnings
- Assignment history

## Compliance Rules (FAA Part 117)

| Rule | Limit |
|------|-------|
| 7-Day Duty Time | 60 hours max |
| 14-Day Duty Time | 110 hours max |
| Flight Duty Period | 9 hours max |
| Minimum Rest | 10 hours minimum |
| Consecutive Duty Days | 7 days max |

## Common Tasks

### Add a New Crew Member
1. Go to Dashboard → Crew Management
2. Click "Add Crew Member"
3. Fill in all required fields
4. Submit form

### Schedule a Flight
1. Go to Dashboard → Flights
2. Click "Schedule Flight"
3. Enter flight details
4. Confirm to create

### Assign Crew to Flight
1. Go to Dashboard → Scheduling
2. Select crew member
3. Select flight number
4. Choose crew position
5. Click "Assign"
6. System validates compliance automatically

### Check Compliance
1. Go to Dashboard → Compliance
2. View compliance status of all crew
3. Color coding: Green (compliant), Yellow (warning), Red (violation)
4. Click "View Details" for specific crew member

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@airline.com","password":"password123"}'
```

### Get All Crew
```bash
curl http://localhost:3000/api/crew \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Flight
```bash
curl -X POST http://localhost:3000/api/flights \
  -H "Content-Type: application/json" \
  -d '{
    "flightNumber":"AA100",
    "departureAirport":"JFK",
    "arrivalAirport":"LAX",
    "aircraftType":"Boeing 777",
    "aircraftRegistration":"N123AA",
    "scheduledDepartureTime":"2024-06-15T10:00:00Z",
    "scheduledArrivalTime":"2024-06-15T14:00:00Z",
    "estimatedFlightDuration":240
  }'
```

### Check Compliance
```bash
curl -X POST http://localhost:3000/api/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "crewMemberId":"CREW_ID",
    "proposedFlightDuration":240,
    "proposedRestBefore":600,
    "regulationType":"FAA_Part_117"
  }'
```

## Troubleshooting

### MongoDB Connection Error
- Check MongoDB URI in `.env.local`
- Ensure MongoDB cluster is active
- Verify IP whitelist in MongoDB Atlas

### Authentication Issues
- Clear browser cookies/localStorage
- Verify JWT_SECRET is set in environment
- Check token expiration (7 days)

### Compliance Not Calculating
- Verify crew has duty assignments
- Check date ranges are correct
- Ensure compliance rules are active

## Next Steps

1. **Production Deployment**
   - Set up production MongoDB cluster
   - Deploy to Vercel or similar platform
   - Configure environment variables

2. **Data Import**
   - Import existing crew database
   - Set up flight schedule
   - Configure compliance rules

3. **User Management**
   - Create admin accounts
   - Set up role-based access
   - Configure department restrictions

4. **Integration**
   - Connect to payroll system
   - Export reports to accounting
   - Integrate with crew management software

## Support Resources

- **Documentation**: See `SYSTEM_GUIDE.md`
- **MongoDB Docs**: https://docs.mongodb.com
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com

## License

This system is built for commercial airline operations.

---

For detailed information, see `SYSTEM_GUIDE.md`
