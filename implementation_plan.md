# PulseCare MVP Implementation Plan

## Scope Delivered

1. `Patient flows`
   - Doctor search with speciality, city, and free-text filters
   - Profile and slot inspection
   - Appointment booking with online or cash payment states
   - Appointment history, cancellation, rescheduling, notifications, and reviews

2. `Doctor flows`
   - Editable doctor profile
   - Slot creation and break toggling
   - Appointment dashboard with earnings snapshot
   - Status updates: `confirmed`, `completed`, `no_show`
   - Patient history access restricted to doctor-linked patients

3. `Admin flows`
   - View all users and doctor verification state
   - Verify or block doctors
   - Add specialities
   - Monitor appointments and payments
   - Broadcast notifications
   - View platform reports and activity logs

## Technical Notes

- Backend runs in a single `server.js` file using Node's built-in HTTP server.
- Data persists in `data/store.json`.
- Auth uses Bearer tokens stored in local JSON sessions.
- The API is intentionally shaped close to the PRD so the project can later migrate to Express, PostgreSQL, MongoDB, JWT, and real third-party integrations.

## MVP Gaps For Future Iterations

- Replace SHA-256 demo hashing with `bcrypt`
- Replace local token sessions with JWT + refresh tokens
- Move persistence to PostgreSQL or MongoDB
- Add Razorpay or Stripe checkout flows
- Add SMS and email providers for production reminders
- Split frontend into React or Next.js for larger-scale development
