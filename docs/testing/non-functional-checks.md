# Non-Functional Testing Checklist

## Performance
- **Initial load**: Measure TTFB, FCP, and LCP for `/`, `/login`, `/dashboard` using Chrome Lighthouse (target LCP < 2.5s)
- **API latency**: Log response times for `pages/api` routes (fulfillment, needs). Alert if > 500ms at 95th percentile
- **Concurrent offers**: Simulate 20 simultaneous offer submissions; verify no Supabase rate-limit errors (`429`)
- **Media uploads**: Upload 10MB total assets and confirm upload duration < 5s on broadband

## Accessibility
- **WCAG contrast**: Run Lighthouse accessibility audit; resolve flags below score 90
- **Keyboard navigation**: Tab through header, login, forms—ensure focus rings visible and skip links available
- **Screen reader labels**: Validate ARIA labels on buttons (e.g., OAuth buttons, attachment controls)
- **Language switch**: Ensure `lang` attribute updates when toggling between English/Spanish

## Security
- **Authentication guard**: Attempt direct API calls without JWT; expect `401`
- **Role enforcement**: Admin-only endpoints deny normal users (check Supabase RLS policies)
- **Input sanitization**: Submit scripts in text fields; confirm content is escaped in UI
- **Rate limiting**: Repeated password attempts should invoke protection (captcha or 429)
- **Storage permissions**: Verify Supabase storage buckets restrict public read except via signed URLs

## Monitoring & Logging
- Ensure Supabase logs capture auth and storage errors
- Confirm client error tracking (Sentry or console) flags unhandled rejections
- Document fallback procedures for provider outages (e.g., disable OAuth in header)

