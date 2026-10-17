# Backend

Backend modules are reserved for the API implementation. PostgreSQL connection
settings are configured through the root `.env` file, which is ignored by Git.

## PostgreSQL connection

The configured database is:

- Host: `localhost`
- Port: `5432`
- Database: `lottery_distribution`
- User: `postgres`

Copy `.env.example` to `.env` and replace the placeholder password when setting
up another machine. The current local password is intentionally stored only in
the ignored `.env` file.

Create the database once:

```sql
CREATE DATABASE lottery_distribution;
```

Then connect to `lottery_distribution` and execute
`database/scripts/init.sql` from the repository root.

For Node.js database clients, use `DATABASE_URL` from the environment rather
than hard-coding credentials:

```js
const connectionString = process.env.DATABASE_URL;
```

The reusable connection pool is available at
`backend/src/db.ts`. It exports `pool`, `checkDatabaseConnection()`, and
`closeDatabaseConnection()`.

## API

Start the development API:

```bash
npm run dev:api
```

Build and start the API:

```bash
npm run build:api
npm run start:api
```

Available endpoints:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/programs`
- `GET /api/programs/:programId`
- `GET /api/programs/:programId/tickets`
- `POST /api/programs/:programId/hold`
- `POST /api/orders`
- `POST /api/orders/:orderId/pay`
- `GET /api/me/orders`
- `GET /api/results`
- `POST /api/admin/programs`
- `POST /api/admin/programs/:programId/draw`

Protected endpoints require `Authorization: Bearer <token>`.