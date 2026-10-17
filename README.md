# Volaitile Friday

**Volaitile Friday** is a modern, high-performance real-time collaborative workspace and development environment. It pairs a secure Express 5 backend with a responsive Vite React 19 frontend, complete with multi-user project access, cloud-based file management, live team chat, and Friday AI developer assistance powered by Google Gemini (with an offline fallback engine).

---

## Architecture & Tech Stack

- **Backend**: Node.js (ES Modules), Express 5, Mongoose 9, ioredis (with hybrid in-memory TTL fallback), express-rate-limit, express-validator, Helmet, Compression, Morgan, Vitest, Supertest.
- **Frontend**: Vite, React 19, Tailwind CSS v3, Axios, React Router v7, Remix Icon.
- **Datastores**: MongoDB 7 (primary persistence), Redis 7 (JWT blacklist and distributed cache).
- **Deployment**: Docker, Docker Compose, Nginx, GitHub Actions CI.

---

## Directory Layout

```
.
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow (Node 20)
├── Backend/                   # Express 5 REST API & WebSocket service
│   ├── config/
│   │   └── env.js             # Startup environment validation & CORS origin helper
│   ├── controllers/           # Express route controllers
│   ├── db/
│   │   └── db.js              # Resilient MongoDB connection with event logging
│   ├── middleware/
│   │   ├── auth.middleware.js # JWT verification & Redis blacklist check
│   │   └── projectAccess.js   # requireProjectMember & requireProjectOwner
│   ├── models/                # Registered Mongoose models: User, Project, File, Message
│   ├── routes/                # Express API route modules
│   ├── scripts/
│   │   └── migrate-owner.js   # Idempotent owner migration script
│   ├── service/               # Core business services (AI, File, Project, Cache, Tool)
│   ├── tests/                 # Database-independent integration & security tests
│   ├── Dockerfile             # Multi-stage production container (node:20-bookworm-slim)
│   └── package.json
├── frontend/                  # Vite + React 19 client application
│   ├── nginx.conf             # Production Nginx reverse proxy & SPA fallback configuration
│   ├── Dockerfile             # Multi-stage build with nginx:alpine
│   ├── vercel.json            # Vercel SPA routing rewrites
│   └── public/
│       └── _redirects         # Netlify / Cloudflare Pages SPA redirect rule
├── docker-compose.yml         # Container orchestration (Mongo, Redis, Backend, Frontend)
└── README.md
```

---

## Getting Started Locally

### Prerequisites

- Node.js 20+ and npm 10+
- MongoDB instance (local or MongoDB Atlas)
- Redis instance (optional; backend seamlessly falls back to resilient in-memory TTL caching)

### Backend Setup

1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Copy the example environment file and configure your values:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server with file watching:
   ```bash
   npm run dev
   ```
5. Run the automated test suite:
   ```bash
   npm test
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Default / Example | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `3000` | Port for the Express server to listen on. |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`). |
| `CLIENT_URL` | Yes (prod) | `http://localhost:5173` | Allowed CORS origins (comma-separated list supported). |
| `TRUST_PROXY` | No | `1` | Number of reverse proxies to trust for client IP detection. |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/volaitile_friday` | MongoDB connection connection string. |
| `JWT_SECRET` | **Yes** | `>= 32 characters` | Secret key for signing and verifying JWTs. |
| `JWT_EXPIRES_IN`| No | `24h` | Token expiration duration (e.g. `15m`, `24h`, `7d`). |
| `REDIS_URL` | No | `redis://localhost:6379` | Full connection URI (supports `rediss://` for TLS). |
| `REDIS_HOST` | No | `127.0.0.1` | Redis host when `REDIS_URL` is omitted. |
| `REDIS_PORT` | No | `6379` | Redis port when `REDIS_URL` is omitted. |
| `REDIS_PASSWORD`| No | _None_ | Redis authentication password. |
| `GEMINI_API_KEY`| No | _None_ | Google Gemini API key for live AI assistant features. |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model name (e.g. `gemini-1.5-pro`). |

### Frontend (`frontend/.env`)

| Variable | Required | Default / Example | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | No | `http://localhost:3000` | Backend API base endpoint. |

---

## Database Migration (`migrate:owner`)

Existing database deployments must run the idempotent project owner migration:

```bash
cd Backend
npm run migrate:owner
```

### What this migration does:
1. Connects to `MONGODB_URI`.
2. Drops the legacy single-field unique index `name_1` on the `projects` collection if present.
3. Finds any legacy projects lacking an `owner` field and assigns `owner = users[0]`.
4. Executes `Project.syncIndexes()` to apply the compound unique index `{ owner: 1, name: 1 }` and the index on `{ users: 1 }`.
5. Is completely safe to run multiple times without duplicating data or failing.

---

## Docker & Containerization

To run the complete production stack (MongoDB, Redis, Backend, and Frontend) locally via Docker:

```bash
docker-compose up -d --build
```

### Key Security & Architecture Features:
- **Internal Datastores**: MongoDB and Redis containers do **not** publish ports to the host machine. They communicate strictly over the internal Docker network.
- **Backend Container**: Uses `node:20-bookworm-slim`, non-root `node` user, and a native `HEALTHCHECK` pinging `/health/ping`.
- **Frontend Container**: Multi-stage build with `nginx:alpine`, asset caching headers, SPA routing fallback, gzip compression, and security headers.

---

## Deployment Notes (Split Host Architecture)

For production environments, running the frontend on a static hosting CDN and the backend on a managed container service is recommended:

### 1. Frontend (Static Hosting)
- **Platforms**: Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront.
- **Routing**: SPA routing is pre-configured via `frontend/vercel.json` and `frontend/public/_redirects`.
- **Environment**: Set `VITE_API_BASE_URL` to your production backend URL (e.g., `https://api.yourdomain.com`).

### 2. Backend (Node / Container Host)
- **Platforms**: Render, Fly.io, Railway, AWS ECS / App Runner, DigitalOcean App Platform.
- **Dockerfile**: Use `Backend/Dockerfile`.
- **Environment**: Configure all mandatory variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL=https://your-frontend-domain.com`, `TRUST_PROXY=1`, etc.).

### 3. Managed Database & Cache
- **MongoDB**: MongoDB Atlas (Replica Set).
- **Redis**: Upstash Redis or AWS ElastiCache. Pass the connection string via `REDIS_URL`. If using TLS, use the `rediss://` protocol prefix.

---

## API Reference Summary

### Authentication & Users (`/users`)
- `POST /users/register` - Register a new account (Rate limited: 5 / hour; Password: 8-72 chars).
- `POST /users/login` - Authenticate account (Rate limited: 10 / 15 min, skips successful requests).
- `GET /users/search?q=:query` - Prefix search users by email (requires query length >= 3, excludes self, limit 10).
- `PUT /users/change-password` - Update password (validates old password, 8-72 chars, revokes old token).
- `GET /users/profile` - Retrieve current user profile.
- `POST /users/logout` - Invalidate session token in Redis.

### Projects (`/projects`)
- `POST /projects/create` - Create a new project (sets creator as `owner`, returns 409 on duplicate owner+name).
- `GET /projects/all` - List all projects where user is a member (populates `owner` and `users`).
- `GET /projects/get-project/:projectId` - Get project details (requires membership).
- `PUT /projects/add-user` - Add members to project (requires membership, capped at 25 members).
- `DELETE /projects/:projectId` - Delete project (owner only; cascades deletion of files and messages).
- `DELETE /projects/:projectId/members/:userId` - Remove member or leave project (owner can remove members; non-owners can leave; owner cannot leave without deleting).

### Project Messages (`/projects/:projectId/messages`)
- `GET /projects/:projectId/messages?after=:id&limit=50` - Retrieve project chat history (ascending order, paginated, max limit 100).
- `POST /projects/:projectId/messages` - Send a project message (1-2000 chars, rate limit 30 / min per user). Broadcasts to room via `chat:message`.

### Real-Time WebSocket Events (`Socket.IO`)

Real-time room chat, user presence, and typing indicators are powered by Socket.IO attached to the Node.js HTTP server.

> [!NOTE]
> WebSockets require reverse proxies and load balancers to support HTTP/1.1 connection upgrades (`Upgrade: websocket` and `Connection: upgrade`). In Nginx, ensure `proxy_http_version 1.1`, WebSocket upgrade headers, and appropriate read/send timeouts are configured (see `frontend/nginx.conf`).

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `project:join` | Client &rarr; Server | `{ projectId: string }` | Request to join a project chat room and register presence. Verifies membership. |
| `project:joined` | Server &rarr; Client | `{ projectId: string }` | Confirms successful joining of the project room. |
| `project:leave` | Client &rarr; Server | `{ projectId: string }` | Leave a project chat room and decrement presence count. |
| `project:error` | Server &rarr; Client | `{ message: string }` | Emitted when joining or room authorization fails. |
| `presence:update` | Server &rarr; Client | `{ projectId: string, onlineUserIds: string[] }` | Broadcast to the room whenever a member joins, leaves, or disconnects. |
| `chat:typing` | Client &rarr; Server | `{ projectId: string, isTyping: boolean }` | Notifies that the current user is typing (or stopped typing). |
| `chat:typing` | Server &rarr; Client | `{ projectId: string, userId: string, email: string, isTyping: boolean }` | Broadcast to other room members. Throttled and auto-cleared after 4 seconds. |
| `chat:send` | Client &rarr; Server | `{ projectId: string, content: string, tempId?: string }` (Ack callback) | Send message via WebSocket (1-2000 chars, per-user rate limit). Ack returns `{ ok: true, message, tempId }` or `{ ok: false, error }`. |
| `chat:message` | Server &rarr; Client | `Message Document` | Broadcast to all room members whenever a message is saved (via socket or REST). |

### Project Files (`/projects/:projectId/files`)
- `GET /projects/:projectId/files` - List all files in project (empty project remains empty).
- `POST /projects/:projectId/files` - Create file (max 100 files/project, max 100 char name, max 200 char path, max 200 KB content).
- `GET /projects/:projectId/files/:fileId` - Retrieve single file content and metadata.
- `PUT /projects/:projectId/files/:fileId` - Update file content or rename (renaming updates path and detects conflicts).
- `DELETE /projects/:projectId/files/:fileId` - Delete file.

### AI Assistant (`/ai`)
- `POST /ai/chat` - Chat with Friday AI (rate limited: 20 / min per user, message max 4000 chars; if `projectId` provided, validates membership, saves AI response as a `Message`, returns `source: 'gemini' | 'offline'`).
- `POST /ai/generate-code` - Generate code snippet (prompt max 20000 chars, returns `source`).
- `POST /ai/review` - Static code analysis and security review (code max 20000 chars, returns `source`).

### Tools & Utility (`/tools`)
- `POST /tools/generate-secret` - Generate secure cryptographic tokens.
- `POST /tools/validate-json` - Validate and format JSON payloads.
- `GET /tools/project-stats/:projectId` - Retrieve project LOC and statistics (requires membership).

### Health Checks (`/health`)
- `GET /health/ping` - Unconditional 200 health ping.
- `GET /health/ready` - Readiness check (returns 200 if MongoDB connected, 503 otherwise).
- `GET /health` - Overall system health (returns `{ status, db }` in production, full diagnostics in dev).
