# OmniTrack User Guide

> **Version:** 1.0 · **Last Updated:** April 2026  
> **Live URL:** [https://modest-essence-production-e9fc.up.railway.app](https://modest-essence-production-e9fc.up.railway.app)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Live Tracking](#4-live-tracking)
5. [Reports & Analytics](#5-reports--analytics)
6. [Alert Management](#6-alert-management)
7. [User Management (Admin)](#7-user-management-admin)
8. [Settings & Preferences](#8-settings--preferences)
9. [Troubleshooting](#9-troubleshooting)
10. [FAQ](#10-faq)

---

## 1. Introduction

OmniTrack is a **real-time indoor asset tracking platform** designed for hospitals, warehouses, and large facilities. It lets you:

- **Track assets** (equipment, badges, carts) on interactive floor plans in real time
- **Receive alerts** when assets leave designated zones or have low battery
- **Analyze historical data** with reports and charts
- **Manage users** with role-based access control

OmniTrack ingests telemetry from multiple vendor systems (Cisco DNA Spaces, Aruba Meridian, etc.), normalizes the data, and presents it through a unified web dashboard.

---

## 2. Getting Started

### 2.1 Accessing OmniTrack

Open your browser and navigate to:

```
https://modest-essence-production-e9fc.up.railway.app
```

Supported browsers: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+.

### 2.2 Logging In

1. You will be automatically logged in with demo credentials during the MVP phase.
2. In production, enter your **email** and **password** on the login screen.
3. Click **Sign In**.

> **Tip:** If you cannot log in, contact your system administrator to verify your account is active.

### 2.3 First-Time Setup

After logging in for the first time:

1. Review your **Settings** page to confirm timezone and notification preferences.
2. Navigate to the **Dashboard** to see your venues and assets.
3. Familiarize yourself with the sidebar navigation.

---

## 3. Dashboard Overview

### 3.1 Navigation

The sidebar (left panel) provides access to all sections:

| Icon | Section | Description |
|------|---------|-------------|
| 📊 | **Dashboard** | Live tracking view with floor plans |
| 📈 | **Reports** | Historical analytics and charts |
| 🔔 | **Alerts** | View and manage system alerts |
| 👥 | **Users** | User management (Admin only) |
| ⚙️ | **Settings** | Application preferences |

The **header bar** at the top shows:
- Current page title
- Search icon
- Notification bell (with unread alert count)
- Your user profile (name and role)

### 3.2 Summary Cards

At the top of the Dashboard you'll see four summary cards:

- **Total Assets** — Number of tracked assets across all venues
- **Active Assets** — Assets currently reporting positions
- **Active Alerts** — Unresolved alerts requiring attention
- **Venues** — Total number of configured venues

---

## 4. Live Tracking

### 4.1 Selecting a Venue & Floor

1. On the Dashboard, use the **Venue** dropdown to choose a facility (e.g., "OmniTrack Demo Hospital").
2. Use the **Floor** tabs to switch between floors (e.g., "Ground Floor", "First Floor").

### 4.2 Floor Plan View

The floor plan displays:

- **Colored dots** — Each dot represents an asset. Colors indicate asset type:
  - 🔵 Blue = Equipment
  - 🟢 Green = Personnel
  - 🟡 Yellow = Supply
  - 🔴 Red = Patient
- **Shaded zones** — Colored polygons representing defined areas (Emergency Room, ICU, etc.)
- **Grid lines** — Reference grid for spatial orientation

**Interactions:**
- **Click an asset dot** to select it and view details
- **Hover over an asset** to see a tooltip with name and position
- Selected assets display a **pulsing animation**

### 4.3 Asset List Panel

The right-side panel shows all assets with:

- **Search bar** — Filter assets by name
- **Type filter** — Filter by Equipment, Personnel, Supply, Patient
- **Status filter** — Filter by Active, Inactive, Maintenance

Each asset entry shows:
- Asset name and type icon
- Current status (color-coded badge)
- Position coordinates
- Battery level indicator
- Last seen timestamp

Click any asset in the list to select it on the floor plan.

### 4.4 Asset Detail Panel

When an asset is selected, a detail panel appears showing:

- **Name** and **type**
- **Status** with color indicator
- **Device ID** (hardware identifier)
- **Current position** (X, Y coordinates)
- **Floor** assignment
- **Battery level** (with color warning for low battery)
- **Last seen** timestamp

Click the **✕** button to close the detail panel.

### 4.5 Real-Time Updates

OmniTrack uses **WebSocket connections** for live updates:
- Asset positions update automatically as new telemetry arrives
- New alerts appear instantly in the Alert Ticker
- No need to refresh the page — data streams in real time

The **Alert Ticker** bar at the top of the dashboard shows the 5 most recent active alerts with severity indicators and quick action buttons.

---

## 5. Reports & Analytics

Navigate to **Reports** from the sidebar.

### 5.1 Date Range Selection

Use the **Start Date** and **End Date** fields at the top to filter data for a specific time period.

### 5.2 Summary Statistics

Four cards display:
- **Total Assets** tracked
- **Telemetry Events** received in the period
- **Total Alerts** generated
- **Unique Devices** reporting data

### 5.3 Charts & Visualizations

| Chart | Description |
|-------|-------------|
| **Telemetry Over Time** | Area chart showing event volume trends |
| **Assets by Type** | Pie chart breaking down asset categories |
| **Alerts by Severity** | Bar chart showing info / warning / critical distribution |
| **Battery Distribution** | Bar chart showing battery level ranges across devices |

### 5.4 Data Tables

- **Alert Breakdown** — Table showing alert types with counts and percentages
- **Recent Telemetry** — Table of the latest telemetry events with device IDs and timestamps

### 5.5 Exporting Data

Click the **Export CSV** button to download asset data as a comma-separated file for use in spreadsheets or external tools.

---

## 6. Alert Management

Navigate to **Alerts** from the sidebar.

### 6.1 Alert Overview

Three summary cards show counts of:
- 🔴 **Active** — New, unacknowledged alerts
- 🟡 **Acknowledged** — Alerts being investigated
- 🟢 **Resolved** — Closed alerts

### 6.2 Filtering Alerts

Use the filter dropdowns:
- **Severity:** All, Info, Warning, Critical
- **Status:** All, Active, Acknowledged, Resolved

### 6.3 Alert Details

Each alert card displays:
- **Severity badge** (color-coded)
- **Alert message** (e.g., "Low battery on Wheelchair WC-001")
- **Asset name** and **alert type**
- **Zone** where the alert was triggered
- **Triggered time**
- **Acknowledged / Resolved timestamps** (if applicable)

### 6.4 Managing Alerts

#### Acknowledging an Alert
1. Find the active alert you want to acknowledge.
2. Click the **Acknowledge** button (✓ icon).
3. The alert status changes to "Acknowledged" and a confirmation toast appears.

#### Resolving an Alert
1. Find an active or acknowledged alert.
2. Click the **Resolve** button (✓✓ icon).
3. The alert status changes to "Resolved" with a timestamp.

> **Note:** Resolved alerts remain visible for audit purposes. Use the status filter to hide them.

---

## 7. User Management (Admin)

Navigate to **Users** from the sidebar. *This section is only available to Admin users.*

### 7.1 Viewing Users

The user table displays:
- **Name** and **email**
- **Role** (Admin, Operator, Viewer)
- **Status** (Active / Inactive)
- **Last login** date
- **Created** date

Use the **search bar** to filter users by name or email.

### 7.2 Adding a User

1. Click **Add User** button.
2. Fill in the form:
   - **Full Name** (required)
   - **Email** (required)
   - **Role** — Admin, Operator, or Viewer
   - **Status** — Active or Inactive
3. Click **Add User** to save.

### 7.3 Editing a User

1. Click the **pencil icon** (✏️) on the user row.
2. Modify any fields.
3. Click **Save Changes**.

### 7.4 Deleting a User

1. Click the **trash icon** (🗑️) on the user row.
2. Confirm the deletion when prompted.

### 7.5 Role Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: manage users, venues, assets, alerts, and settings |
| **Operator** | View and manage assets, acknowledge/resolve alerts, view reports |
| **Viewer** | Read-only access: view dashboard, reports, and alerts |

---

## 8. Settings & Preferences

Navigate to **Settings** from the sidebar.

### 8.1 Connection Settings

- **API URL** — Backend API endpoint (read-only in production)
- **WebSocket URL** — Real-time data endpoint
- **Data Refresh Interval** — How often data is polled (in seconds)

### 8.2 Notification Preferences

| Setting | Description |
|---------|-------------|
| **Alert Notifications** | Toggle browser notifications for new alerts |
| **Sound Alerts** | Play an audio cue for critical alerts |
| **Auto-Acknowledge** | Automatically acknowledge info-level alerts |

### 8.3 Localization

- **Language** — Select display language (English default)
- **Timezone** — Set your local timezone for timestamp display

### 8.4 System Information

Displays read-only details about the running system:
- Application version
- Backend service status
- API Gateway endpoint

---

## 9. Troubleshooting

### Assets not appearing on the floor plan

1. **Check venue/floor selection** — Ensure the correct venue and floor are selected.
2. **Verify asset status** — Inactive assets may not display. Check the asset list filters.
3. **Check WebSocket connection** — Look for the green connection indicator in the sidebar. If red, try refreshing the page.

### Real-time updates stopped

1. **Refresh the page** — WebSocket connections may drop due to network issues.
2. **Check your internet connection** — OmniTrack requires a stable connection for real-time data.
3. **Clear browser cache** — Sometimes stale cached files cause issues. Use Ctrl+Shift+R (Cmd+Shift+R on Mac).

### Alerts not showing

1. **Check filters** — Make sure severity and status filters aren't hiding alerts.
2. **Verify time range** — Some alerts may be outside the current view window.

### Export not working

1. **Check browser pop-up settings** — The CSV download may be blocked by pop-up blockers.
2. **Try a different browser** — Some browsers handle file downloads differently.

### Page loads slowly

1. **Reduce the date range** in Reports to limit data volume.
2. **Close unused browser tabs** to free up memory.
3. **Check network speed** — OmniTrack works best on broadband connections.

### Cannot log in

1. **Verify credentials** — Check with your administrator for correct email/password.
2. **Clear cookies** — Old session cookies can interfere with login.
3. **Contact support** — If the issue persists, contact your OmniTrack administrator.

---

## 10. FAQ

**Q: What devices does OmniTrack support?**  
A: OmniTrack supports telemetry from Cisco DNA Spaces, Aruba Meridian, and any system that can send JSON payloads via HTTP. A generic normalizer handles non-standard formats.

**Q: How accurate is the position tracking?**  
A: Accuracy depends on the underlying positioning system. Typical indoor accuracy ranges from 1-5 meters depending on infrastructure density and technology used.

**Q: Can I track assets across multiple buildings?**  
A: Yes. Create separate venues for each building, each with its own floors and zones. The dashboard allows switching between venues.

**Q: How often do positions update?**  
A: Position updates depend on device reporting frequency. Most systems report every 1-30 seconds. OmniTrack processes and displays updates in real time via WebSockets.

**Q: Is my data secure?**  
A: OmniTrack uses HTTPS for all communications, role-based access control, and input validation. See the production roadmap for planned security enhancements.

**Q: Can I set up custom zones?**  
A: Yes. Administrators can create zones via the API with custom geometry. A UI-based zone editor is planned for a future release.

**Q: How do I add a new venue or floor?**  
A: Currently, venues and floors are managed via the REST API. An admin UI for venue management is on the roadmap.

**Q: What browsers are supported?**  
A: Chrome 90+, Firefox 88+, Edge 90+, and Safari 14+. Mobile browsers are supported but a dedicated mobile app is not yet available.

**Q: Can I integrate OmniTrack with other systems?**  
A: Yes. OmniTrack provides a REST API and WebSocket interface. See the API documentation at `/api/health` for available endpoints.

**Q: Who do I contact for support?**  
A: Contact your organization's OmniTrack administrator or submit an issue on the [GitHub repository](https://github.com/your-org/OmniTrack2).

---

*Thank you for using OmniTrack! For the latest updates and documentation, visit the GitHub repository.*
