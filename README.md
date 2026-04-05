# KTripZ — Smart Ride Sharing Platform

BlaBlaCar-style intercity ride sharing for India.

## Project Structure

```
KTripZ/
├── backend/     Node.js + Express + Socket.io + MongoDB
├── mobile/      React Native (Android + iOS)
└── admin/       React.js Admin Panel
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env   # fill in your credentials
npm install
npm run dev            # runs on :5000
```

### Admin Panel
```bash
cd admin
npm install
npm start              # runs on :3000
```

### Mobile App
```bash
cd mobile
npm install
npx react-native run-android
# or
npx react-native run-ios
```

## Environment Variables
See `backend/.env.example` for all required keys:
- MongoDB Atlas URI
- JWT Secret
- Razorpay Key ID + Secret
- Cloudinary credentials
- Firebase project credentials
- Ola Maps API Key
- SendGrid API Key

## Tech Stack
| Layer | Tech |
|-------|------|
| Mobile | React Native, Redux Toolkit, Socket.io Client |
| Backend | Node.js, Express, MongoDB, Socket.io, JWT |
| Admin | React.js, Recharts, React Router |
| Payments | Razorpay |
| Maps | Ola Maps API |
| Notifications | Firebase FCM |
| Media | Cloudinary |
| Email | SendGrid |

## API Base Routes
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET  /api/rides/search` — Search rides
- `POST /api/rides/calculate-route` — Route info
- `POST /api/bookings` — Book a ride
- `POST /api/payments/order` — Create Razorpay order
- `POST /api/payments/verify` — Verify payment
- `GET  /api/admin/dashboard` — Admin stats
