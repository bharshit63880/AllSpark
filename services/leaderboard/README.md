# Leaderboard Service

Real-time leaderboard for contests. Consumes contest submission completion events from Kafka, updates Redis cache, and emits live updates via Redis Pub/Sub for WebSocket broadcast.

## Flow

- **Submission events:** `submissions` service → `submissions.contest.update.complete` (Kafka) → **leaderboard service** → Redis (rank + meta) → `leaderboard:live` (Redis Pub/Sub) → API gateway → WebSocket broadcast.
- **GET leaderboard:** API → `request` (Kafka) → auth → permissions → `leaderboard.get` (Kafka) → **leaderboard service** → Redis read → `response` (Redis Pub/Sub) → API gateway → WebSocket → client.

## Permissions (MongoDB)

Ensure these permission documents exist so the API can route leaderboard requests:

1. **Admin leaderboard**  
   - `name`: `"admin.leaderboard.get"`  
   - `nextTopicToPublish`: `"leaderboard.get"`  
   - `roles`: `["ADMIN"]`  
   - `description`: e.g. `"Get contest leaderboard (admin)"`

2. **Public leaderboard by contest** (for `GET /api/v1/contests/:contestId/leaderboard`)  
   - `name`: `"leaderboard.getByContest"`  
   - `nextTopicToPublish`: `"leaderboard.get"`  
   - `roles`: `["USER", "PUBLIC", "ADMIN"]` (as needed)  
   - `description`: e.g. `"Get leaderboard by contestId"`

## Environment

- `KAFKA_INSTANCE_IP` – Kafka broker (default `localhost`; use `kafka` in Docker).
- `REDIS_URL` – Redis connection (default `localhost:6379`; use `redis:6379` in Docker).
- `PORT` – Service port (default `3800`).

## API Usage

- **Admin:** `GET /api/v1/admin/leaderboard?contestId=<contestId>` (auth + admin). Response via WebSocket (same `client-id`).
- **Public:** `GET /api/v1/contests/:contestId/leaderboard`. Response via WebSocket (same `client-id`).

## Live updates

When a contest submission is judged, the leaderboard service publishes to Redis channel `leaderboard:live`. The API gateway subscribes to this channel and broadcasts to all connected WebSocket clients. Payload shape: `{ contestId, source, updatedAt, leaderboard }`.

## Score and penalty

- **Score:** `1_000_000 * solvedCount - totalPenaltyMinutes` (higher is better). Stored in a Redis sorted set for ranking.
- **Penalty:** For each solved problem, `(minutes from contest start to first AC) + 20 * wrong attempts` for that problem. Contest start is inferred from the first submission seen for that contest (or can be set via `contest:contestId:startTime` in Redis).
