# BJ Library Management System

A production-ready web application for managing students, seats, fees, renewals, and
reports for a private study library.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** (v4)
- **PostgreSQL** database
- **Prisma ORM** (v6)
- **Server Actions** for data mutations
- **JWT-based authentication**
- **Responsive UI** (mobile + desktop)

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud like Neon, Supabase)

## Getting Started

### 1. Clone and install

```bash
cd bj-library
npm install
```

### 2. Configure environment

Edit `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bj_library?schema=public"
JWT_SECRET="change-this-to-a-random-secret-key"
NEXTAUTH_SECRET="change-this-to-another-random-key"
```

### 3. Setup database

```bash
# Push schema to database
npx prisma db push

# Seed with default data (admin, 4 time slots, 50 seats)
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts
```

### 4. Run development server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Login

- Username: `admin`
- Password: `admin123`

Or click **"First time? Setup admin account"** on the login page.

## Features

### Authentication
- Username/password login with JWT
- Protected routes (all pages redirect to login)
- Logout via sidebar

### Dashboard
- Total / Active / Expired students
- Total / Occupied / Available seats
- Monthly collection & pending fees
- Upcoming expiries & due fee count
- Quick action buttons

### Student Management
- Add / Edit / Delete students
- Search by name, mobile, or father name
- Filter by All / Active / Expired
- Student detail page with full profile
- Seat assignments per student

### Seat Management
- Visual occupancy table (Seats × Time Slots)
- 50 default seats, configurable
- One-click seat assignment
- Prevent duplicate booking in same slot
- Assign different seats per time slot

### Time Slots
- Four fixed slots (6-10 AM, 10-2 PM, 2-6 PM, 6-10 PM)
- Configurable name, times, and fee
- Create / Edit / Delete slots

### Fee Management
- Monthly fee = sum of assigned slot fees
- Manual fee tracking per student
- Record partial payments with notes
- Payment history ledger
- Auto-calculated pending amount

### Renewal System
- One-click +1 to +12 months renewal
- Custom expiry date setting
- Full renewal history tracking
- Expired student detection

### Due Fee Tracking
- Overdue students (expired)
- Upcoming expiry (within 7 days)
- Pending fee students

### Reports
- Student report (All / Active / Expired)
- Fee report with payment history
- Seat occupancy report with charts
- Export to CSV
- Print-friendly tables

### Import / Export
- Import students from CSV
- Download import template
- Export all students to CSV
- Drag & drop file upload

## Database Schema

Tables:
- **Admin** - Single system administrator
- **Student** - Student profiles with billing cycle
- **Seat** - Seat numbers (default 50)
- **TimeSlot** - Four configurable time slots with fees
- **StudentAssignment** - Junction: Student ↔ Seat ↔ TimeSlot
- **Payment** - Payment history with notes
- **Renewal** - Renewal history tracking

## Project Structure

```
bj-library/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── login/             # Login page
│   │   ├── (dashboard)/       # Dashboard layout (sidebar + header)
│   │   │   ├── dashboard/     # Dashboard stats
│   │   │   ├── students/      # Student management
│   │   │   ├── seats/         # Seat occupancy table
│   │   │   ├── slots/         # Time slot config
│   │   │   ├── fees/          # Fee management
│   │   │   ├── renewals/      # Renewal system
│   │   │   ├── due-fees/      # Due fee tracking
│   │   │   ├── reports/       # Reports & export
│   │   │   └── import-export/ # CSV import/export
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Header.tsx         # Page header
│   │   ├── DataTable.tsx      # Reusable table component
│   │   └── Modal.tsx          # Modal dialog component
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # JWT auth helpers
│   │   └── actions/           # Server actions
│   └── types/
│       └── index.ts           # TypeScript types
```

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Set `DATABASE_URL`, `JWT_SECRET` in Vercel environment variables.

### Docker / Self-host

```bash
npm run build
npm start
```
