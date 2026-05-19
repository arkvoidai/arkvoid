# ARKVOID Fix Changelog

## 2026-05-19 — Production Stability + Vercel Fixes

---

## Critical Fixes

### 1. Vercel API Migration
Created serverless API functions because `server.ts` does not run on Vercel static deployments.

### Added Files
- `api/chat.ts`
- `api/create-order.ts`
- `api/verify-payment.ts`
- `api/health.ts`

### Reason
All `/api/*` routes were returning `404` in production.

---

## Security Fixes

### Removed Exposed API Key

Removed:

```ts
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

### Reason
The Gemini API key was exposed inside the frontend JS bundle.

### Added Environment Variables
- `SUPABASE_SERVICE_ROLE_KEY`
- `MISTRAL_API_KEY`
- `VITE_ADMIN_PATH`
- `RAZORPAY_KEY_SECRET`

---

## Replaced Files

### Updated Files
- `index.html`
- `vite.config.ts`
- `tailwind.config.ts`
- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/hooks/usePremiumGate.tsx`
- `src/pages/dashboard/Settings.tsx`
- `src/pages/auth/Login.tsx`
- `.env.example`

---

## Deleted Files

### Removed
- `next.config.js`

### Reason
ARKVOID uses Vite, not Next.js.

---

## Routing Fixes

### Billing Route Fix

Changed:

```txt
/dashboard/settings/billing
```

To:

```txt
/dashboard/settings?tab=billing
```

### Reason
The billing route did not exist.

---

## Guest Modal Fix

### Removed Duplicate Modal

Removed second `GuestExpiredModal` from:

```txt
src/layouts/DashboardLayout.tsx
```

### Reason
Two guest expiration modals were rendering simultaneously.

---

## Auth UX Fix

### Removed Browser Alert

Removed:

```ts
window.alert("Session expired")
```

### Replaced With

```txt
/auth/login?reason=session_expired
```

### Reason
Native browser alerts create poor mobile UX.

---

## Favicon Fix

### Changed

```html
/favicon.svg
```

To:

```html
/favicon.png
```

### Reason
`favicon.svg` file does not exist in `/public`.

---

## Tailwind Cleanup

### Removed Invalid Content Paths
- `./pages/**`
- `./app/**`
- `./components/**`

### Reason
These were leftover Next.js paths and not used in the Vite project.

---

## Admin Security Improvement

### Changed
Removed hardcoded admin path from public frontend bundle.

### Added

```env
VITE_ADMIN_PATH
```

### Reason
Hardcoded admin URLs can be discovered from browser JS bundles.

---

## Full File Tracking

### New Files Created
- `api/chat.ts`
- `api/create-order.ts`
- `api/verify-payment.ts`
- `api/health.ts`
- `CHANGELOG_FIXES.md`

---

## Files Modified
- `index.html`
- `vite.config.ts`
- `tailwind.config.ts`
- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/hooks/usePremiumGate.tsx`
- `src/pages/dashboard/Settings.tsx`
- `src/pages/auth/Login.tsx`
- `.env.example`
- `vercel.json`

---

## Files Reviewed
- `server.ts`
- `package.json`
- `tsconfig.json`
- `README.md`
- `metadata.json`

---

## Files Removed
- `next.config.js`

---

## Existing Project Structure

### Root
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `vercel.json`
- `index.html`
- `.gitignore`
- `.env.example`
- `README.md`
- `metadata.json`
- `server.ts`
- `CHANGELOG_FIXES.md`

---

### Directories
- `src/`
- `api/`
- `public/`
- `sdk/`
- `supabase/`

---

## Testing Files Present
- `test_agents.mjs`
- `test_db.mjs`
- `test_key.mjs`
- `test_policies.mjs`
- `test_profile.mjs`
- `test_supabase.mjs`
- `test_tables.mjs`

---

## Deployment Checklist

### GitHub
- [x] Backup ZIP downloaded
- [x] Fix tracking enabled
- [ ] Fix branch created
- [ ] Incremental commits started

### Vercel
- [ ] Environment variables added
- [ ] API routes verified
- [ ] Production redeployed
- [ ] Build logs checked

---

## Functional Testing Checklist
- [ ] AI chat working
- [ ] Razorpay payment flow working
- [ ] Guest mode working
- [ ] Login/logout working
- [ ] Dashboard navigation working
- [ ] Mobile responsive
- [ ] Streaming responses working

---

## Backup Notes

### Backup Created
Downloaded full GitHub ZIP backup before applying fixes.

### Rollback Plan
If deployment breaks:
1. Restore backup ZIP
2. Revert GitHub commit
3. Redeploy previous stable version
4. Apply fixes incrementally

---

## Current Status
IN PROGRESS
