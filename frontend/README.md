# Secure Leave Management - Frontend

React + TypeScript + Vite single-page application for the secure leave management system.

## Security notes

- The UI hides buttons and pages per role, but this is **convenience only**. Every permission is
  re-enforced by the FastAPI backend (403 Forbidden when calling an API directly without the right role).
- JWT access + refresh tokens are stored in `sessionStorage` for the demo. A production deployment
  should move refresh tokens to `HttpOnly` cookies (see Known Limitations in the root README).
- API errors returned by the backend are displayed to the user; the frontend never invents
  authorization decisions.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The dev server runs at http://localhost:5173 and expects the backend at http://localhost:8000.

## Verification

```bash
npm run typecheck   # tsc --noEmit - 0 errors
npm run build       # vite production build
npm run preview     # serve the built bundle
```

## Demo accounts

| Email | Password | Role |
|---|---|---|
| admin@secureleave.io | Admin@123 | Administrator |
| hr@secureleave.io | Hr@12345 | HR |
| eng.manager@secureleave.io | Manager@123 | Manager (Engineering) |
| dev@secureleave.io | Employee@123 | Employee (Engineering) |
| dev2@secureleave.io | Employee@123 | Employee (Engineering) |
| ops.manager@secureleave.io | Manager@123 | Manager (Operations) |
| ops.worker@secureleave.io | Employee@123 | Employee (Operations) |

## Structure

- `src/pages` - role-specific pages (login, dashboard, leave, manager approvals, HR reports, admin users, audit log)
- `src/components` - layout, route guards (client-side only), shared UI pieces
- `src/services/api.ts` - typed API client with automatic token refresh
- `src/hooks/useAuth.tsx` - authentication context
- `src/types` - shared TypeScript interfaces

## Testing

Manual verification workflow is described in the root README (final demonstration section).
