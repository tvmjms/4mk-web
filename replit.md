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
3. **Image Uploads**: Upload up to 3 images per need with automatic compression (max 800px, 500KB for sustainability)
4. **Dashboard**: Personal dashboard for managing your needs
5. **Email Notifications**: Automated emails for need updates via Gmail
6. **Receipt System**: Track and display need fulfillment details
7. **SMS Notifications**: Currently disabled (showing "Coming Soon"). Twilio integration available for future implementation when budget allows.

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
- ✅ Database connected (Supabase)
- ✅ Server running on port 5000
- ✅ Email functionality working (Gmail integration)
- ✅ Image upload feature implemented (client-side compression + Supabase Storage)
- ⚠️ **Database migration required for images** - run migration in `supabase/migrations/add_images_column.sql`
- ⏸️ SMS functionality disabled (greyed out "Coming Soon")

## Image Upload Setup

The image upload feature uses your existing Supabase Storage configuration:

1. **✅ Storage Bucket**: Uses existing `need-attachments` bucket (already configured)
2. **⚠️ Database Migration Required**:
   - Open Supabase Dashboard → SQL Editor
   - Run the migration in `supabase/migrations/add_images_column.sql`
   - This adds the `images` column to the `needs` table

**How it works**:
- Users can upload 1-3 images when creating a need
- Images are automatically compressed (max 800px, ~500KB) for sustainability
- Uploaded directly to Supabase Storage `need-attachments` bucket
- URLs stored in database `needs.images` array
- Free tier includes 1GB storage (~10,000 compressed images)

## Future Enhancements
- **SMS Integration**: Twilio integration code exists in `/pages/api/send-sms.ts`. To enable:
  1. Sign up for free Twilio trial ($15 credit, ~500 SMS)
  2. Add environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  3. Update send-sms.ts to use Twilio API instead of email gateways
  4. Enable SMS button in `pages/needs/create.tsx` (currently showing as "Coming Soon")
- **Image Display**: Add image thumbnails to needs listings and dashboard
- **Image Display in Receipts**: Show uploaded images in email/SMS receipts
