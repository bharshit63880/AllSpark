# AllSpark

A microservices-based, event-driven coding platform for problem solving, contests, admin management, and support workflows.

## Overview

AllSpark is designed as a distributed coding platform with separate services for authentication, user management, submissions, contests, permissions, support flows, and real-time updates. It uses Docker for local orchestration and includes MailHog for OTP/email testing in development.

## Core Features

- User signup and login
- OTP-based email verification
- Forgot password / reset password flow
- Coding problem run and submit flow
- Contest participation and leaderboard updates
- Admin control panel
- Support ticket workflow
- Special access / approval flows
- Real-time event-driven communication

## Repository Structure

```text
AllSpark-main/
├─ app/
│  ├─ ui/                  # Frontend
│  └─ api/                 # API gateway
├─ services/               # Backend microservices
├─ config/
│  └─ db/
│     └─ seed-production-content.js
├─ compose.dev.yaml        # Local development stack
├─ main.conf.example       # Example env config
└─ README.md
Local Development Stack

This project uses the following local services:

Frontend
API Gateway
MongoDB
Redis
Kafka
MailHog
Judge0-compatible execution API
Prerequisites

Before running the project, make sure you have:

Docker
Docker Compose v2
Ports Used Locally
Service	Port
Frontend	5173
API Gateway	8000
MongoDB	27017
Redis	6379
Redis Stack UI	8001
Kafka	9092
MailHog SMTP	1025
MailHog UI	8025
Quick Start
1. Clone or extract the project
cd AllSpark-main
2. Create local environment file
cp main.conf.example main.conf
3. Update main.conf

For local development, use MailHog instead of real SMTP credentials.

# MongoDB
MONGODB_URI=mongodb://db:27017/allSpark

# Shared service port placeholder
PORT=

# Internal infra
KAFKA_INSTANCE_IP=kafka
REDIS_URL=redis://redis:6379
DEFAULT_PARTITIONS_OF_KAFKA_TOPICS=1

# Security
JSON_WEB_TOKEN_SECRET=replace_with_a_random_secret_for_local_dev

# Code execution engine
CODE_EXECUTION_ENGINE_API_URL=https://ce.judge0.com

# Frontend runtime URLs
VITE_WEBSOCKET_URL=ws://localhost:8000
VITE_API_BASE=http://localhost:8000/api/v1

# MailHog for local OTP/email testing
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=noreply@allspark.local
SMTP_FROM_NAME=All Spark
4. Start the full stack
docker compose -f compose.dev.yaml up --build -d
5. Confirm containers are running
docker compose -f compose.dev.yaml ps
Local URLs
Service	URL
Frontend	http://localhost:5173
API Gateway	http://localhost:8000
MailHog UI	http://localhost:8025
Redis Stack UI	http://localhost:8001
First-Time Setup Flow

On a fresh machine, follow this exact order:

Create main.conf
Start the Docker stack
Sign up a user from the frontend
Verify OTP using MailHog
Promote that user to ADMIN
Logout and login again
Run the seed script
Open the admin control panel
Create the First Admin User
Why this step is required

The seed script uses an existing admin-like account as created_by.
That means a fresh setup needs one real user account first.

Step 1: Sign up from the frontend

Open:

http://localhost:5173/signup

Use any email address you want.

Recommended example:

Name: Admin User
Username: admin
Email: your-email@example.com
Password: Admin@123
Mobile: 9999999999
Password Requirements

Password must contain:

at least 8 characters
at least 1 uppercase letter
at least 1 lowercase letter
at least 1 number
at least 1 special character

Example:

Admin@123
Step 2: Verify the OTP

Open MailHog:

http://localhost:8025

Copy the OTP from the received email and complete verification.

Step 3: Promote the user to ADMIN

Open MongoDB shell:

docker compose -f compose.dev.yaml exec db mongosh allSpark

Run:

db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "ADMIN", activation_status: "active" } }
)

db.users.findOne(
  { email: "your-email@example.com" },
  { email: 1, user_name: 1, role: 1, activation_status: 1 }
)

Expected output should include:

{
  email: "your-email@example.com",
  user_name: "admin",
  role: "ADMIN",
  activation_status: "active"
}

Exit Mongo shell:

exit
Step 4: Logout and login again

This is required.

Even after updating the role in MongoDB, the old token still contains the previous role.
So after promoting the user, you must:

logout
login again

Without re-login, admin APIs may still fail with authorization errors.

Access the Admin Panel

After logging in again, open:

http://localhost:5173/admins/control-panel
Seed Demo Problems and Contests

After an admin account exists, run:

docker compose -f compose.dev.yaml cp config/db/seed-production-content.js db:/seed-production-content.js
docker compose -f compose.dev.yaml exec db mongosh --quiet /seed-production-content.js
docker compose -f compose.dev.yaml exec redis redis-cli FLUSHALL
What the seed script does

The seed script:

removes old seeded contest/problem participation data
removes old seeded problems
removes old seeded contests
inserts demo problems
inserts demo contests
What it does not do

The seed script does not:

create the first user automatically
create the first admin automatically
bypass signup or OTP flow
How Admin Detection Works in the Updated Seed Script

The updated seed script tries to resolve the creator account in this order:

SEED_ADMIN_EMAIL env override
SEED_ADMIN_USERNAME env override
first active admin-like user with role:
SUPER_ADMIN
ADMIN
CONTEST_SCHEDULER
SUPPORT
fallback user with username admin
fallback user with email admin@example.com

So the recommended local setup is:

create any user
promote that user to ADMIN
logout/login again
run the seed
Optional: explicitly choose seed owner

By email:

docker compose -f compose.dev.yaml exec -e SEED_ADMIN_EMAIL=your-email@example.com db mongosh --quiet /seed-production-content.js

By username:

docker compose -f compose.dev.yaml exec -e SEED_ADMIN_USERNAME=admin db mongosh --quiet /seed-production-content.js

If needed, copy the file again before executing:

docker compose -f compose.dev.yaml cp config/db/seed-production-content.js db:/seed-production-content.js
Common Commands
Stop the stack
docker compose -f compose.dev.yaml down
Restart the stack
docker compose -f compose.dev.yaml restart
Restart one service
docker compose -f compose.dev.yaml restart <service-name>

Example:

docker compose -f compose.dev.yaml restart permissions
View container status
docker compose -f compose.dev.yaml ps
Troubleshooting
Seed script says admin user not found

Reason: no admin-like user exists yet.

Fix:

sign up a user
verify OTP
promote the user to ADMIN
logout and login again
rerun the seed script
Admin panel shows forbidden / role error

Most common reason: role was updated in MongoDB, but login token still contains USER.

Fix:

logout
login again
retry the admin route
OTP email is not arriving

Check that main.conf contains:

SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

Then open:

http://localhost:8025
Seed completed but data still looks stale

Redis cache may still contain old values.

Run:

docker compose -f compose.dev.yaml exec redis redis-cli FLUSHALL
A service change is not reflecting

Restart the affected service:

docker compose -f compose.dev.yaml restart <service-name>
Auth / admin flow is failing

Check logs:

docker compose -f compose.dev.yaml logs auth --tail 200
docker compose -f compose.dev.yaml logs users --tail 200
docker compose -f compose.dev.yaml logs permissions --tail 200
docker compose -f compose.dev.yaml logs api --tail 200
Submission flow is stuck or pending

Check logs:

docker compose -f compose.dev.yaml logs judge --tail 200
docker compose -f compose.dev.yaml logs submissions --tail 200
Manual Verification Checklist

After setup, verify these flows:

signup
email OTP verification
login
forgot password
reset password
problem run
problem submit
contest listing
contest participation
contest submission
leaderboard updates
support ticket flow
special access flow
admin dashboard access
Security Notes

Before using this project outside local development:

replace JSON_WEB_TOKEN_SECRET with a strong secret
configure real SMTP credentials privately
do not commit main.conf
do not commit secrets or SMTP passwords
do not expose internal service ports publicly unless required
keep infrastructure credentials private
