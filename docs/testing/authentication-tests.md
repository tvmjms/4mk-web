# Authentication Test Scenarios

## Email & Password
- **Login success**: valid credentials redirect to original `next` path
- **Login failure**: invalid password shows Supabase error message
- **Account lockout**: attempt 5 consecutive failures; ensure rate-limit messaging appears
- **Logout**: header `Logout` clears session and redirects to `/login`

## Magic Link
- **Link request**: requesting OTP sends email (check Supabase Auth log)
- **Link consumption**: clicking link signs user in and redirects to stored destination
- **Expired link**: use an expired token; app should display error via `auth/callback`

## Registration
- **New account**: complete `/register`, verify confirmation email is queued
- **Duplicate email**: registration with existing address surfaces Supabase error

## Password Reset
- **Reset request**: `/forgot` triggers email
- **Reset completion**: use link to set new password and log in

## OAuth Providers
- **Google**
  - Consent screen renders, user returns to `auth/callback`
  - Supabase session persists after page refresh
- **Microsoft (Azure)**
  - Redirects to developer tenant login
  - Tenant restricted account denied (negative test)
- **Facebook**
  - Works for approved tester account or live app
  - Declining permissions returns to `/login` with error alert

## Session & Guard
- **Existing session redirect**: visiting `/login` while signed in sends user to `/`
- **Auth guard**: protected pages redirect anonymous users to `/login?next=...`
- **Session expiry**: revoke token in Supabase; confirm client prompts login

## Localization & Accessibility Checks
- Verify `/login` strings switch when `LanguageContext` changes
- Run keyboard-only navigation to ensure focusable controls on login/register screens

