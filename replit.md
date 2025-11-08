# 4MK (ForMyKin) - Community Needs Platform

## Project Overview
4MK (ForMyKin) is a Next.js-based community platform that connects people who need help with those who can provide it. The platform facilitates posting needs, offering help, and coordinating community support.

## Technical Stack
- **Framework**: Next.js 15.5.4 (Pages Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Gmail/Nodemailer + Resend
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Project Structure
- `/pages` - Next.js pages and API routes
- `/components` - React components (Header, Footer, NeedsList, etc.)
- `/lib` - Utility libraries (Supabase client, mailer, logger, etc.)
- `/hooks` - Custom React hooks (useAuthGuard, etc.)
- `/types` - TypeScript type definitions
- `/styles` - Global CSS styles
- `/public` - Static assets

## Key Features
1. **Authentication**: Supabase-based auth with email/password and magic links
2. **Needs Management**: Create, view, and manage community needs
3. **Dashboard**: Personal dashboard for managing your needs
4. **Email Notifications**: Automated emails for need updates
5. **Receipt System**: Track and display need fulfillment details

## Environment Variables
All credentials are stored in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `RESEND_API_KEY` - Resend email service key
- `EMAIL_USER` - Gmail username
- `EMAIL_PASS` - Gmail app password
- `EMAIL_FROM` - From email address

## Running Locally
The app runs on port 5000 via Next.js dev server:
```bash
npm run dev
```

## Authentication Flow
1. User visits homepage (not logged in)
2. Clicks "My Dashboard" or "Create Need"
3. `useAuthGuard` hook checks authentication
4. If not authenticated, redirects to `/login?next=[destination]`
5. After login, user is redirected back to intended destination

## Important Pages
- `/` - Homepage with needs feed
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard
- `/needs/create` - Create a new need
- `/auth/callback` - OAuth callback handler

## Current Status
- ✅ Application imported from GitHub
- ✅ All dependencies installed
- ✅ Environment variables configured
- ✅ Database connected
- ✅ Server running on port 5000
