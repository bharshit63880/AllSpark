# AllSpark

AllSpark is a microservices-based, async event-driven coding platform (LeetCode-style) with:
- auth + OTP reset
- problem solving (run + submit)
- contest participation + leaderboard updates
- admin control panel
- support ticket + special access workflows

## Architecture (high level)
- `app/ui` -> React frontend
- `app/api` -> API gateway
- `services/*` -> domain microservices (auth, users, problems, submissions, contests, judge, leaderboard, support-ticket, special-access, admin-service, permissions, email)
- `config/*` -> infra helpers + production seed script
- Kafka -> service-to-service events
- Redis pub/sub -> websocket response fanout
- MongoDB -> primary datastore
- MailHog -> local SMTP + OTP testing

## Prerequisites
- Docker + Docker Compose
- Ports available: `5173`, `8000`, `27017`, `6379`, `9092`, `8025`, `1025`

## Configuration
Docker Compose reads `main.conf` as the single shared env file for services.

For GitHub/open-source safety:
1. `main.conf` is intentionally ignored and should stay local only.
2. Copy the tracked example file and create your own local config:

```bash
cp main.conf.example main.conf
```

Windows PowerShell:

```powershell
Copy-Item main.conf.example main.conf
```

3. Open `main.conf` and fill in your real/local values.

Minimum values to verify before start:
- `JSON_WEB_TOKEN_SECRET=REPLACE_WITH_SECURE_VALUE` (replace for real deployment)
- `CODE_EXECUTION_ENGINE_API_URL=https://ce.judge0.com` (or your own Judge0 host)
- `SMTP_*` values (use MailHog for local testing or your real SMTP provider)

## Start Full Stack (one command)
Run from project root (`all-spark`):

```bash
docker compose -f compose.dev.yaml up --build -d
```

## Seed Production-Style Problems + Contests
Use this exact flow (avoids shell pipe parsing issues):

```bash
docker cp config/db/seed-production-content.js all-spark-db-1:/seed-production-content.js
docker exec all-spark-db-1 mongosh --quiet /seed-production-content.js
docker exec all-spark-redis-1 redis-cli FLUSHALL
```

Why Redis flush after seed:
- contest/problem list caches can hold old IDs after reseeding
- flushing ensures UI/API reads the latest seeded objects

## Create/Promote Admin User
Promote any existing signed-up user in MongoDB:

```bash
docker exec all-spark-db-1 mongosh --quiet --eval "db=db.getSiblingDB('allSpark'); db.users.updateOne({email:'YOUR_SIGNUP_EMAIL'}, {$set:{role:'ADMIN', activation_status:'active'}})"
```

## URLs
- Frontend: `http://localhost:5173`
- API Gateway: `http://localhost:8000`
- MailHog UI: `http://localhost:8025`

## Verification
Recommended manual checks after startup:
- signup
- login
- forgot password OTP
- reset password
- problem run
- problem submit
- contest join/start/submit
- leaderboard update
- support ticket
- special access

## Stop Stack
```bash
docker compose -f compose.dev.yaml down
```

## Troubleshooting
- If submission stays pending, check judge logs:
```bash
docker compose -f compose.dev.yaml logs judge --tail 200
```
- If you reseed DB, always run Redis flush command again.
- If a single service code change is not reflecting, restart that service:
```bash
docker compose -f compose.dev.yaml restart <service-name>
```

## Production Notes
Before internet deployment:
- replace `JSON_WEB_TOKEN_SECRET` with strong secret
- point `CODE_EXECUTION_ENGINE_API_URL` to your controlled Judge0 instance
- configure real SMTP in your local/private `main.conf`
- avoid exposing internal service ports publicly (keep public entry via UI/API only)
- never commit real `main.conf`, SMTP secrets, JWT secrets, or provider credentials
# AllSpark
