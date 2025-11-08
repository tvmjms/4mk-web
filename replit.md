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
3. **AI Content Moderation**: Real-time safety checks using OpenAI's free Moderation API for Title and Description fields
4. **Image Uploads**: Upload up to 3 images per need with automatic compression (max 800px, 500KB for sustainability)
5. **Dashboard**: Personal dashboard for managing your needs
6. **Email Notifications**: Automated emails for need updates via Gmail
7. **Receipt System**: Track and display need fulfillment details
8. **SMS Notifications**: Currently disabled (showing "Coming Soon"). Twilio integration available for future implementation when budget allows.

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

## AI Content Moderation System

The platform uses **OpenAI's free Moderation API** to ensure community safety and legal compliance. This is completely free and perfect for charity use cases.

### Features
- ✅ **Real-time checking**: Content is checked as users type (500ms debounce)
- ✅ **Visual feedback**: Blue "checking" indicator while moderating, red alert for violations
- ✅ **Form-level locking**: When inappropriate content is detected, the ENTIRE form locks - only the violating field remains editable
- ✅ **Independent field moderation**: Title and Description are checked separately without cross-cancellation
- ✅ **Stale response prevention**: Request ID tracking ensures old API responses don't override newer clean states
- ✅ **Submission blocking**: Form submission is prevented if any field has moderation errors or checks are in progress
- ✅ **Fail-open design**: If moderation service is down, users can still submit (prioritizes availability)

### How it works
1. **Text Moderation**:
   - User types in Title or Description field
   - After 500ms of no typing, content is sent to `/api/moderate-text`
   - API calls OpenAI Moderation API to check for violations
   - If flagged: Red alert shows specific violation categories + entire form locks
   - If clean: No error, user can continue
   - On submit: Form checks both fields and blocks submission if either has violations

2. **Image Moderation**:
   - User selects an image to upload
   - Image is compressed (max 800px, 500KB)
   - Compressed image is sent to `/api/moderate-image` for checking
   - API calls OpenAI Moderation API (vision) to analyze the image
   - If flagged: Upload is rejected with clear error message showing violation categories
   - If clean: Image is uploaded to Supabase Storage

### Moderation Categories
The system checks for:
- Violence, self-harm, hate speech
- Sexual content, harassment
- Illegal activities

### Files
- `lib/contentModerator.ts` - Core moderation logic using OpenAI
- `pages/api/moderate-text.ts` - API endpoint for real-time text moderation
- `pages/api/moderate-image.ts` - API endpoint for image moderation
- `pages/needs/create.tsx` - UI integration with debouncing, form locking, and error handling

### Testing
To test the moderation:
1. Login and go to "Create Need"
2. Try typing inappropriate content like "violence" or "hate" in Title or Description
3. Wait 500ms - you should see a red alert with the violation
4. Replace with safe content like "help with groceries"
5. The error should clear and you can submit the form

## Future Enhancements
- **SMS Integration**: Twilio integration code exists in `/pages/api/send-sms.ts`. To enable:
  1. Sign up for free Twilio trial ($15 credit, ~500 SMS)
  2. Add environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  3. Update send-sms.ts to use Twilio API instead of email gateways
  4. Enable SMS button in `pages/needs/create.tsx` (currently showing as "Coming Soon")
- **Image Display**: Add image thumbnails to needs listings and dashboard
- **Image Display in Receipts**: Show uploaded images in email/SMS receipts
- **Image Moderation**: Extend AI moderation to uploaded images (OpenAI Moderation API supports images)
