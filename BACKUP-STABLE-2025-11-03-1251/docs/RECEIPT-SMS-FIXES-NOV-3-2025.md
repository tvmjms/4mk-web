# Receipt & SMS Fixes - November 3, 2025

## Issues Fixed ✅

### 1. Receipt Button Inconsistency
**Problem**: Receipt showed "View Need" first time, "Dashboard" subsequent times
**Root Cause**: Two different receipt templates with different button configurations

**Fix Applied**:
- **React Component**: Changed "View Need" button to "Dashboard" 
- **Email Template**: Rearranged buttons for consistency:
  - Primary: "Dashboard" (was "View Need")  
  - Secondary: "Edit Need"
  - Bottom: "View Full Details" (was "Return to Home")

**Files Changed**:
- `pages/needs/create.tsx` - Receipt modal buttons
- `pages/api/send-email.tsx` - Email template buttons

### 2. SMS Phone Format Error  
**Problem**: SMS failing due to phone number format validation
**Root Cause**: Phone stored as formatted string (e.g., "248-935-5617") but API expected digits only

**Fix Applied**:
- **Frontend**: Strip formatting before sending to SMS API
  ```typescript
  const phoneDigitsOnly = contactPhone.replace(/\D/g, '');
  ```
- **Backend**: Better error messages and logging for debugging
- **Validation**: Keep existing 10/11 digit US phone validation

**Files Changed**:
- `pages/needs/create.tsx` - Phone formatting before SMS API call
- `pages/api/send-sms.ts` - Enhanced error messages and logging

## Technical Details

### Phone Number Flow
1. **User Input**: Can type "2489355617" or "248-935-5617"
2. **Display Format**: Auto-formats to "248-935-5617" for readability  
3. **Database Storage**: Stores as user typed (with formatting)
4. **SMS API**: Strips to digits only "2489355617" before sending

### Receipt Button Logic (Now Consistent)
```
┌─────────────┬─────────────┐
│  Dashboard  │  Edit Need  │  
└─────────────┴─────────────┘
┌─────────────────────────────┐
│      View Full Details      │
└─────────────────────────────┘
```

### Error Handling Improvements
- **SMS Errors**: More descriptive messages with digit count
- **Rate Limiting**: 10 SMS per minute (reasonable for receipts)
- **Frontend Feedback**: Shows specific SMS error messages to user

## Testing Recommendations
1. **Receipt Consistency**: Create multiple needs, verify buttons are always the same
2. **Phone Formats**: Test with:
   - `2489355617` (10 digits, no formatting)
   - `248-935-5617` (formatted)  
   - `1-248-935-5617` (11 digits with country code)
3. **SMS Delivery**: Check server logs if SMS still fails

## Environment Requirements
For SMS to work, ensure email credentials are configured:
```bash
EMAIL_USER=your-email@gmail.com  
EMAIL_PASS=your-app-password
```

SMS uses email-to-SMS gateways for major carriers (AT&T, T-Mobile, Verizon, Sprint, Metro PCS).

## Troubleshooting SMS
If SMS still fails, check:
1. **Console Logs**: Look for "SMS API called with" debug messages
2. **Phone Validation**: Verify exactly 10 digits are being sent
3. **Email Config**: Ensure EMAIL_USER/EMAIL_PASS are set
4. **Carrier Gateways**: Some carriers may block email-to-SMS

The fixes should resolve both the receipt inconsistency and SMS phone formatting issues.