# OmniTrack Frontend

React-based dashboard for the OmniTrack Indoor Positioning Platform.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Zustand** for state management
- **Recharts** for data visualization
- **Socket.io Client** for real-time WebSocket updates
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API Gateway running on `http://localhost:4000`

### Install & Run

```bash
cd web/omnitrack-frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:3000**.

### Environment Variables

Copy `.env.example` to `.env` and adjust if needed:

```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
```

### Build for Production

```bash
npm run build
npm run preview
```

## Pages

| Route        | Description                                       |
|-------------|---------------------------------------------------|
| `/dashboard` | Live tracking with floor plan, asset list, alerts |
| `/reports`   | Analytics, charts, telemetry history, CSV export  |
| `/alerts`    | Alert management with filtering and actions       |
| `/users`     | User management with CRUD operations              |
| `/settings`  | Application configuration                         |

## Architecture

```
src/
├── components/
│   ├── common/       # Reusable UI components (Modal, StatCard, etc.)
│   ├── dashboard/    # Dashboard-specific components
│   └── layout/       # App layout, sidebar, header
├── pages/            # Route page components
├── services/         # API client, WebSocket, auth store
├── store/            # Zustand state stores
├── types/            # TypeScript type definitions
└── hooks/            # Custom React hooks
```

## API Integration

- REST API via Axios with auto-auth token injection
- WebSocket via Socket.io for real-time position & alert updates
- Vite proxy forwards `/api` requests to backend at port 4000
