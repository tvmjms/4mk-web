# Email & SMS Setup Guide for 4MK

## 🔧 Quick Fix for Current Issues

The email and SMS APIs are failing because email credentials aren't configured. Here's how to fix it:

### 1. Create `.env.local` file

Create a file called `.env.local` in your project root with:

```env
# Gmail Configuration for Email/SMS
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=your-gmail-address@gmail.com

# Your existing Supabase config (don't change these)
NEXT_PUBLIC_SUPABASE_URL=your-existing-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-existing-supabase-key
```

### 2. Get Gmail App Password

1. Go to Google Account settings
2. Enable 2-Factor Authentication (required)
3. Go to Security → 2-Step Verification → App passwords
4. Generate an app password for "Mail"
5. Use this 16-character password as `EMAIL_PASS`

### 3. Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 🎯 Testing Instructions

Once configured:

1. **Create a need** with your email/phone
2. **Click "Show Receipt"** 
3. **Try email receipt** - should work instantly
4. **Try SMS receipt** - works via email-to-SMS gateways

## 📱 How SMS Works

SMS uses email-to-SMS gateways:
- **AT&T**: number@txt.att.net
- **Verizon**: number@vtext.com
- **T-Mobile**: number@tmomail.net
- **Sprint**: number@messaging.sprintpcs.com

## 🚀 For Production (Vercel)

Add environment variables in Vercel dashboard:
1. Go to project settings
2. Add Environment Variables
3. Redeploy

## ⚠️ Current Status

- ❌ Email APIs failing (no credentials)
- ❌ SMS APIs failing (depends on email)
- ✅ Need creation working
- ✅ Receipt modal working
- ✅ All other features working

## 🔍 Debugging

Check browser console and server terminal for detailed error messages. The APIs now provide better error information.