# CodePulse — current learning stage

This snapshot includes authentication, problems, test cases, and submission APIs.
Redis/BullMQ packages are listed as installed dependencies, but the Redis connection,
queue producer, and worker have **not** been implemented yet.

## Requirements
- Node.js LTS
- MongoDB Atlas connection (or another MongoDB connection)
- PowerShell on Windows

## Setup
1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI` and a strong private `JWT_SECRET`.
3. Install packages with `npm.cmd install`.
4. Run with `npm.cmd run dev`.

Never commit `.env` or share database passwords/JWT tokens.

## Environment variables
- `PORT`: API port, default 5000
- `MONGO_URI`: MongoDB connection string
- `NODE_ENV`: development or production
- `JWT_SECRET`: secret used to sign JWTs
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: optional values for the admin seed script

To create an admin, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` privately in `.env`, then run:
`npm.cmd run create-admin`

## Routes
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `POST /api/problems` (ADMIN)
- `GET /api/problems`
- `GET /api/problems/:id`
- `POST /api/problems/:problemId/test-cases` (ADMIN)
- `GET /api/problems/:problemId/test-cases` (public test cases only)
- `POST /api/submissions` (Bearer token)
- `GET /api/submissions?page=1&limit=10` (Bearer token)
- `GET /api/submissions/:id` (Bearer token, owner only)

## Important current limitations
- Submissions are saved with `QUEUED`, but no worker processes them yet.
- Do not execute submitted source code on the API server. A future worker must use an isolated sandbox with CPU, memory, time, filesystem, and network restrictions.
- The current project is a learning-stage API, not production-hardened.
