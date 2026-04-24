# PulseCare Doctor Appointment App

PulseCare is a full stack doctor appointment MVP that implements the PRD in this workspace with three primary roles:

- `Patient`: search doctors, book appointments, reschedule, cancel, review, and view reminders
- `Doctor`: manage profile, create slots, mark breaks, review appointments, and inspect patient history
- `Admin`: verify or block doctors, manage specialities, track payments, broadcast notifications, and view reports

## Stack

- Frontend: static HTML, CSS, and vanilla JavaScript SPA
- Backend: Node.js HTTP server in `server.js`
- Persistence: local JSON store in `data/store.json`
- Auth: token-based sessions plus SHA-256 password hashing for demo purposes

## Run locally

```bash
node server.js
```

Open `http://127.0.0.1:3000`.

## Demo accounts

- Patient: `patient@pulsecare.app` / `patient12345`
- Doctor: `doctor@pulsecare.app` / `doctor12345`
- Admin: `admin@pulsecare.app` / `admin12345`

## Main API groups

- `GET /api/health`
- `GET /api/specialities`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/doctors`
- `GET /api/doctors/:id`
- `GET /api/doctors/:id/slots?date=YYYY-MM-DD`
- `POST /api/appointments`
- `GET /api/appointments/me`
- `PUT /api/appointments/:id/cancel`
- `PUT /api/appointments/:id/reschedule`
- `POST /api/appointments/:id/review`
- `GET /api/doctor/profile`
- `PUT /api/doctor/profile`
- `GET /api/doctor/slots`
- `POST /api/doctor/slots`
- `PUT /api/doctor/slots/:id`
- `GET /api/doctor/appointments`
- `PUT /api/doctor/appointments/:id/status`
- `GET /api/doctor/patients/:patientId/history`
- `GET /api/admin/users`
- `PUT /api/admin/doctors/:id/verify`
- `GET /api/admin/appointments`
- `GET /api/admin/payments`
- `GET /api/admin/reports`
- `POST /api/admin/specialities`
- `POST /api/admin/notifications/broadcast`

## Documentation

- [implementation_plan.md](./implementation_plan.md)
- [docs/api.md](./docs/api.md)
- [docs/database-design.md](./docs/database-design.md)
- [docs/deployment-guide.md](./docs/deployment-guide.md)

## Notes

- The current MVP simulates payments and notifications instead of integrating Razorpay, Stripe, Twilio, or SendGrid.
- If an old JSON store exists from the previous project, the server backs it up to `data/store.legacy.json` and initializes the new healthcare schema.
