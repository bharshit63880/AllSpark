# Admin Service

Event-driven admin control panel microservice for the coding platform. Uses Kafka for all communication; does not access other services' databases directly.

## Features

- **Dashboard**: Aggregated stats (total users, contests, problems, submissions, system status) stored in own MongoDB; updated via Kafka events from other services.
- **REST API**: Express routes under `/api/v1/admin` with RBAC (ADMIN, CONTEST_SCHEDULER, SUPPORT).
- **CRUD via events**: Create/update/delete contests and problems, delete users by publishing Kafka events (`admin.createContest`, `admin.updateContest`, `admin.deleteContest`, `admin.createProblem`, `admin.deleteProblem`, `admin.deleteUser`). Contests, problems, and users services consume these and perform the operations.
- **Real-time dashboard**: When stats change, publishes to Redis channel `admin:dashboard:live`; API gateway subscribes and broadcasts to WebSocket clients.

## Kafka

### Consumes (request topics – from API gateway via permissions)

- `admin.getDashboard` – returns dashboard stats from DB, responds via Redis `response`.
- `admin.users.getAll` – forwards to `users.control.search`.
- `admin.users.delete` – publishes `admin.deleteUser` (users service performs delete).
- `admin.contests.create` / `admin.contests.update` / `admin.contests.delete` – publish `admin.createContest` / `admin.updateContest` / `admin.deleteContest`.
- `admin.problems.create` / `admin.problems.delete` – publish `admin.createProblem` / `admin.deleteProblem`.

### Consumes (stats topics – for dashboard counters)

- `users.created`, `users.deleted`, `contests.created`, `problems.created`, `submissions.created` – increment/decrement stats in admin DB and publish to `admin:dashboard:live`.

### Produces

- `admin.createContest`, `admin.updateContest`, `admin.deleteContest`, `admin.createProblem`, `admin.deleteProblem`, `admin.deleteUser` – consumed by contests, problems, and users services.

## Permissions (MongoDB)

Ensure the permissions collection has entries so that after auth and permission check, the request is routed to the correct topic. Example (adjust roles as needed; include ADMIN, CONTEST_SCHEDULER, SUPPORT):

- `admin.dashboard` → `nextTopicToPublish`: `admin.getDashboard`
- `admin.users.getAll` → `admin.users.getAll`
- `admin.users.delete` → `admin.users.delete`
- `admin.contests.list` → `nextTopicToPublish`: `contests.control.search` (for Control Panel contest list)
- `admin.problems.list` → `nextTopicToPublish`: `problems.control.search` (for Control Panel problem list)
- `admin.contests.create` → `admin.contests.create`
- `admin.contests.update` → `admin.contests.update`
- `admin.contests.delete` → `admin.contests.delete`
- `admin.problems.create` → `admin.problems.create`
- `admin.problems.delete` → `admin.problems.delete`

## REST (direct to admin-service)

When calling admin-service HTTP directly (e.g. port 3950):

- `GET /api/v1/admin/dashboard` – returns dashboard JSON (from admin DB).
- `GET /api/v1/admin/users` – 202, use gateway + WebSocket for list.
- `DELETE /api/v1/admin/users/:id` – publishes `admin.deleteUser`.
- `POST /api/v1/admin/contests` – body as contest payload; publishes `admin.createContest`.
- `PUT /api/v1/admin/contests/:id` – body as partial contest; publishes `admin.updateContest`.
- `DELETE /api/v1/admin/contests/:id` – publishes `admin.deleteContest`.
- `POST /api/v1/admin/problems` – body as problem payload; publishes `admin.createProblem`.
- `DELETE /api/v1/admin/problems/:id` – publishes `admin.deleteProblem`.

All write endpoints require `Authorization` header (JWT) with role ADMIN, CONTEST_SCHEDULER, or SUPPORT.

## Env

- `MONGODB_URI`, `KAFKA_INSTANCE_IP`, `REDIS_URL`, `JSON_WEB_TOKEN_SECRET`, `PORT` (default 3950), `DEFAULT_PARTITIONS_OF_KAFKA_TOPICS`.

## Docker

- `Dockerfile` with dev target: `npm run dev`.
- Added to `compose.dev.yaml` as service `admin-service` on port 3950.
