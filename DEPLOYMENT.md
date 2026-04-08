# OmniTrack Deployment Guide

This guide covers deploying the OmniTrack platform to **Railway** (recommended) with **Render** as an alternative.

---

## Architecture Overview

OmniTrack consists of the following services:

| Service                | Type       | Port | Directory                          |
|------------------------|------------|------|------------------------------------|
| **Frontend**           | React/Vite | 80   | `web/omnitrack-frontend/`          |
| **API Gateway**        | Express.js | 4000 | `services/api-gateway/`            |
| **Normalization Svc**  | Node.js    | —    | `services/normalization-service/`  |
| **PostgreSQL + PostGIS** | Database | 5432 | Managed by Railway                 |
| **NATS**               | Message Broker | 4222 | Docker image / external       |

---

## Option A: Deploy to Railway (Recommended)

### Prerequisites

- A [Railway](https://railway.app) account (GitHub login recommended)
- Your OmniTrack repository pushed to GitHub
- A Railway project created (free tier or paid — Hobby plan recommended at ~$5/mo)

### Step 1: Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select the **OmniTrack** repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically provisions a PostgreSQL instance
3. The `DATABASE_URL` variable is automatically available to other services via `${{Postgres.DATABASE_URL}}`
4. **Note**: PostGIS extension can be enabled by running the following SQL in the Railway database console:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

### Step 3: Add NATS Message Broker

Railway doesn't have a built-in NATS service, so you have two options:

#### Option A: Deploy NATS as a Docker service on Railway
1. Click **"+ New"** → **"Docker Image"**
2. Enter image: `nats:latest`
3. Set the following variables:
   - Add a **command override**: `--jetstream`
4. Note the internal hostname (e.g., `nats.railway.internal`)

#### Option B: Use an external NATS service
- [Synadia Cloud](https://www.synadia.com/cloud) offers free-tier NATS
- Set the `NATS_URL` environment variable to your external NATS URL

### Step 4: Deploy API Gateway

1. In your Railway project, click **"+ New"** → **"GitHub Repo"** → select your repo
2. In the service settings:
   - **Root Directory**: `services/api-gateway`
   - **Builder**: Dockerfile
3. Set **environment variables**:

   | Variable                  | Value                                          |
   |---------------------------|-------------------------------------------------|
   | `NODE_ENV`                | `production`                                    |
   | `PORT`                    | `4000`                                          |
   | `SERVICE_NAME`            | `omnitrack-api-gateway`                         |
   | `DATABASE_URL`            | `${{Postgres.DATABASE_URL}}`                    |
   | `NATS_URL`                | `nats://nats.railway.internal:4222`             |
   | `NATS_TOPIC_RAW`          | `telemetry.raw`                                 |
   | `NATS_TOPIC_NORMALIZED`   | `telemetry.normalized`                          |
   | `AUTH_ENABLED`            | `false`                                         |
   | `JWT_SECRET`              | *(generate a secure random string)*             |
   | `CORS_ORIGIN`             | `https://<your-frontend-domain>.railway.app`    |
   | `RATE_LIMIT_WINDOW_MS`    | `900000`                                        |
   | `RATE_LIMIT_MAX_REQUESTS` | `100`                                           |
   | `LOG_LEVEL`               | `info`                                          |

4. Click **"Deploy"**
5. Once deployed, generate a **public domain** under Settings → Networking → "Generate Domain"

### Step 5: Deploy Normalization Service

1. Click **"+ New"** → **"GitHub Repo"** → select your repo
2. In the service settings:
   - **Root Directory**: `services/normalization-service`
   - **Builder**: Dockerfile
3. Set **environment variables**:

   | Variable                  | Value                                      |
   |---------------------------|--------------------------------------------|
   | `NODE_ENV`                | `production`                               |
   | `SERVICE_NAME`            | `omnitrack-normalization-service`          |
   | `NATS_URL`                | `nats://nats.railway.internal:4222`        |
   | `NATS_TOPIC_RAW`          | `telemetry.raw`                            |
   | `NATS_TOPIC_NORMALIZED`   | `telemetry.normalized`                     |
   | `LOG_LEVEL`               | `info`                                     |

4. Click **"Deploy"**
5. This service does **not** need a public domain (internal only)

### Step 6: Deploy Frontend

1. Click **"+ New"** → **"GitHub Repo"** → select your repo
2. In the service settings:
   - **Root Directory**: `web/omnitrack-frontend`
   - **Builder**: Dockerfile
3. Set **build arguments** (these are injected at Docker build time):

   | Variable            | Value                                           |
   |---------------------|-------------------------------------------------|
   | `VITE_API_BASE_URL` | `https://<your-api-gateway-domain>.railway.app/api` |
   | `VITE_WS_URL`       | `https://<your-api-gateway-domain>.railway.app`     |

4. Click **"Deploy"**
5. Generate a **public domain** under Settings → Networking → "Generate Domain"

### Step 7: Seed the Database (Optional)

To populate the database with demo data:

1. Go to the **API Gateway** service in Railway
2. Open the **"Shell"** tab (or use Railway CLI)
3. Run:
   ```bash
   npx prisma db seed
   ```

### Step 8: Configure Custom Domain (Optional)

1. Go to the service (Frontend or API Gateway)
2. Settings → Networking → **"Custom Domain"**
3. Add your domain (e.g., `omnitrack.yourdomain.com`)
4. Add the CNAME record shown in Railway to your DNS provider
5. Railway automatically provisions an SSL certificate

### Step 9: Verify Deployment

- **Frontend**: Visit `https://<your-frontend-domain>.railway.app`
- **API Health**: Visit `https://<your-api-gateway-domain>.railway.app/health`
- **WebSocket**: The dashboard should show live connection status

---

## Monitoring & Troubleshooting

### Railway Logs
- Click on any service → **"Logs"** tab to view real-time logs
- Filter by severity or search for specific text

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection fails | Check `DATABASE_URL` references `${{Postgres.DATABASE_URL}}` |
| CORS errors | Ensure `CORS_ORIGIN` matches your frontend's exact domain |
| NATS connection fails | Verify NATS service is running and hostname is correct |
| Frontend shows blank page | Check `VITE_API_BASE_URL` build arg points to correct API domain |
| Prisma migration fails | Run `npx prisma migrate deploy` manually via Railway shell |
| WebSocket not connecting | Ensure `VITE_WS_URL` matches API Gateway domain (with `https://`) |

### Health Check Endpoints
- API Gateway: `GET /health` → `{ "status": "ok", "service": "api-gateway" }`

---

## Option B: Deploy to Render (Alternative)

### Step 1: Create Services

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create the following services:

#### PostgreSQL Database
- Click **"New"** → **"PostgreSQL"**
- Name: `omnitrack-db`
- Plan: Free (or Starter for production)
- Note the **Internal Database URL**

#### API Gateway (Web Service)
- Click **"New"** → **"Web Service"**
- Connect your GitHub repo
- Name: `omnitrack-api-gateway`
- Root Directory: `services/api-gateway`
- Environment: Docker
- Set environment variables (same as Railway table above)
- Use the internal database URL from the PostgreSQL service

#### Normalization Service (Background Worker)
- Click **"New"** → **"Background Worker"**
- Connect your GitHub repo
- Name: `omnitrack-normalization`
- Root Directory: `services/normalization-service`
- Environment: Docker
- Set environment variables

#### Frontend (Static Site)
- Click **"New"** → **"Static Site"**
- Connect your GitHub repo
- Name: `omnitrack-frontend`
- Root Directory: `web/omnitrack-frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Set environment variables for `VITE_API_BASE_URL` and `VITE_WS_URL`

### Step 2: NATS on Render
- Deploy NATS as a **Private Service** using Docker image `nats:latest`
- Or use an external NATS provider (Synadia Cloud)

### Step 3: Configure and Deploy
- Follow similar environment variable setup as Railway
- Render auto-deploys on push to your default branch

---

## Cost Estimates

### Railway
| Service           | Estimated Cost/Month |
|-------------------|---------------------|
| Hobby Plan        | $5 (includes credits) |
| PostgreSQL        | ~$5-10              |
| API Gateway       | ~$5-10              |
| Normalization Svc | ~$2-5               |
| Frontend (nginx)  | ~$2-5               |
| NATS              | ~$2-5               |
| **Total**         | **~$20-40/month**   |

*Railway Hobby plan includes $5/month in credits. Trial tier is also available.*

### Render
| Service           | Estimated Cost/Month |
|-------------------|---------------------|
| PostgreSQL (Free) | $0                  |
| API Gateway       | $7 (Starter)        |
| Normalization Svc | $7 (Starter)        |
| Frontend (Static) | $0 (Free)           |
| **Total**         | **~$14-20/month**   |

*Free tier available with limitations (spin-down after inactivity).*

---

## Scaling Considerations

### Horizontal Scaling
- **API Gateway**: Scale replicas in Railway (Settings → Scaling)
- **Normalization Service**: Can run multiple instances (NATS handles load balancing via queue groups)
- **Frontend**: Static assets — scales automatically via CDN

### Database Scaling
- Start with Railway's default PostgreSQL
- For production: Consider upgrading to a dedicated PostgreSQL instance
- Enable connection pooling (PgBouncer) for high concurrency

### Performance Tips
- Enable Redis for caching (add as Railway service if needed)
- Use Railway's metrics dashboard to monitor resource usage
- Set appropriate rate limits for production traffic

---

## CI/CD

Railway automatically deploys when you push to your default branch. To customize:

1. **Auto-deploy**: Enabled by default — every push triggers a build
2. **Branch deploys**: Configure in Railway to deploy specific branches
3. **PR previews**: Railway can create preview environments for pull requests

### Manual Deploy via Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

---

## Environment Variable Reference

### API Gateway
| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | Server port (4000) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NATS_URL` | Yes | NATS server URL |
| `NATS_TOPIC_RAW` | Yes | Raw telemetry topic |
| `NATS_TOPIC_NORMALIZED` | Yes | Normalized telemetry topic |
| `AUTH_ENABLED` | No | Enable auth middleware (default: false) |
| `JWT_SECRET` | No | JWT signing secret |
| `CORS_ORIGIN` | Yes | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (default: 900000) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: 100) |
| `LOG_LEVEL` | No | Logging level (default: info) |

### Normalization Service
| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `NATS_URL` | Yes | NATS server URL |
| `NATS_TOPIC_RAW` | Yes | Raw telemetry subscription topic |
| `NATS_TOPIC_NORMALIZED` | Yes | Normalized telemetry publish topic |
| `LOG_LEVEL` | No | Logging level (default: info) |

### Frontend (Build-time)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Full URL to API Gateway `/api` endpoint |
| `VITE_WS_URL` | Yes | WebSocket URL (API Gateway domain) |
