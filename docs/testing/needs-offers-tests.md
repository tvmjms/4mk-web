# Needs & Offers Test Scenarios

## Needs Creation & Management
- **Create need (happy path)**: requester fills required fields, upload optional media, verify record in Supabase `needs`
- **Validation errors**: missing title, invalid zip code, oversized attachment
- **Draft vs publish**: ensure `status` defaults to `new` and becomes `accepted/fulfilled` only via explicit transition
- **Edit need**: update description, address changes reflect in dashboard list
- **Soft delete**: mark need deleted; verify listing hidden and `deleted_at` set

## Need Listing & Filters
- **List view pagination**: `/needs` loads batches; infinite scroll or pagination works
- **Filter by category/state**: filter UI limits results correctly
- **Search**: keyword search returns matching title/description
- **Flagged needs**: flagged record displays alert badge and surfaces in admin dashboard

## Offers Lifecycle
- **Submit offer**: volunteer uses `/offers/manage`; record appears in `fulfillment` table with `status='proposed'`
- **Withdraw offer**: volunteer withdraws open offer; ensure status updated and need becomes available again
- **Accept offer**: requester accepts; `accepted_at` timestamp populated, volunteer notified
- **Decline offer**: requester declines; proper message shown and audit trail recorded
- **Complete fulfillment**: mark as fulfilled; triggers receipt email and sets `status='fulfilled'`
- **Return offer**: requester requests changes; confirm `return_reason` stored and volunteer notified

## Attachments & Comments
- **Need attachments**: upload/download flow, file accessible via protected URL
- **Offer attachments**: confirm storage bucket segregation and permission checks
- **Comments integration**: leave comments on fulfillment; verify they display chronologically

## Notifications & Receipts
- **Email confirmation**: creation of need sends acknowledgement
- **SMS/Email for offers**: acceptance, decline, completion all trigger notifications
- **Receipt generation**: `NeedReceipt` renders summary with correct totals

## Edge Cases
- **Duplicate offers from same user**: second submission prevented or merged
- **Need owner changes**: transferring ownership updates history without orphaning records
- **Bulk updates**: admin CSV import or mass status change maintains data integrity

