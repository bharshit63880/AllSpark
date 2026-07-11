# ⚡ AllSpark

[![Docker](https://img.shields.io/badge/Docker-blue?logo=docker&logoColor=white)](https://www.docker.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-darkgreen?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-red?logo=redis&logoColor=white)](https://redis.io/)
[![Kafka](https://img.shields.io/badge/Kafka-black?logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![React (Vite)](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?logo=react&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js&logoColor=white)](https://nodejs.org/)

**AllSpark** is a microservices-based, event-driven coding platform designed for problem-solving, contests, admin management, and support workflows. 

It acts as a distributed coding platform with independent microservices handling authentication, user management, submissions, contests, permissions, support flows, and real-time updates. The local development environment is fully containerized using Docker, and includes MailHog for seamless OTP/email testing.


> [!CAUTION]
> ## **Deployment Note: This project is fully functional locally using Docker Compose. Public deployment is currently unavailable because the microservices architecture depends on Kafka and Redis infrastructure, which requires paid hosting beyond my current budget.**

---

## ✨ Core Features

* **User Management:** Secure signup, login, and OTP-based email verification.
* **Account Recovery:** Complete forgot password / reset password flows.
* **Coding Engine:** Real-time coding problem execution and submission flow (Judge0-compatible).
* **Contests:** Competitive programming contest participation and live leaderboard updates.
* **Admin Controls:** Comprehensive admin control panel for platform management.
* **Support:** Built-in support ticket workflow and special access/approval flows.
* **Real-time Architecture:** Event-driven communication powered by Apache Kafka.

---

## 🛠️ Architecture & Local Tech Stack

### Prerequisites
Before running the project, ensure you have the following installed:
* [Docker](https://www.docker.com/products/docker-desktop/)
* [Docker Compose v2](https://docs.docker.com/compose/)

### Local Services Used
* **Frontend** (React/Vite)
* **API Gateway** (Node.js)
* **MongoDB** (Database)
* **Redis** (Caching)
* **Kafka** (Message Broker)
* **MailHog** (Local SMTP Testing)
* **Execution Engine** (Judge0-compatible API)

---

## 📂 Repository Structure

```text
AllSpark-main/
├─ app/
│  ├─ ui/                  # Frontend Application
│  └─ api/                 # API Gateway
├─ services/               # Backend Microservices
├─ config/
│  └─ db/
│     └─ seed-production-content.js
├─ compose.dev.yaml        # Local development stack orchestration
├─ main.conf.example       # Example environment configuration
└─ README.md
🌐 Local Development Environment
Ports & Services
Service	Port	Local URL
Frontend	5173	http://localhost:5173
API Gateway	8000	http://localhost:8000
MailHog UI	8025	http://localhost:8025
Redis Stack UI	8001	http://localhost:8001
MongoDB	27017	Internal
Kafka	9092	Internal
MailHog SMTP	1025	Internal
🚀 Quick Start
Clone or extract the project:

Bash
cd AllSpark-main
Create your local environment file:

Bash
cp main.conf.example main.conf
Update main.conf:
Open main.conf and configure the required environment variables. For local development, use MailHog instead of real SMTP credentials.

Properties
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
CODE_EXECUTION_ENGINE_API_URL=[https://ce.judge0.com](https://ce.judge0.com)

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
Start the full stack:

Bash
docker compose -f compose.dev.yaml up --build -d
Confirm containers are running:

Bash
docker compose -f compose.dev.yaml ps
⚙️ First-Time Setup Flow
On a fresh machine, you must follow this exact order to properly initialize the application, create an admin account, and seed the database.

Step 1: Sign up from the Frontend
Open http://localhost:5173/signup.

Create an account (use any email you want).

Recommended Example:

Name: Admin User

Username: admin

Email: your-email@example.com

Password: Admin@123 (Must contain 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)

Mobile: 9999999999

Step 2: Verify the OTP
Open MailHog at http://localhost:8025.

Copy the OTP from the received email and complete the verification on the frontend.

Step 3: Promote the user to ADMIN
Open the MongoDB shell inside your Docker container:

Bash
docker compose -f compose.dev.yaml exec db mongosh allSpark
Run the following update command:

JavaScript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "ADMIN", activation_status: "active" } }
)
Verify the update was successful:

JavaScript
db.users.findOne(
  { email: "your-email@example.com" },
  { email: 1, user_name: 1, role: 1, activation_status: 1 }
)
Expected Output:

JSON
{
  "email": "your-email@example.com",
  "user_name": "admin",
  "role": "ADMIN",
  "activation_status": "active"
}
Type exit to leave the Mongo shell.

Step 4: Logout and Login Again (Crucial)
⚠️ Why is this required? Even after updating the role in MongoDB, your current JWT token still contains the previous USER role. Without re-logging in, admin APIs will fail with authorization errors.

Logout from the frontend.

Login again with your credentials.

Access the Admin Panel at: http://localhost:5173/admins/control-panel

🌱 Seeding Demo Problems and Contests
After creating your admin account, populate the database with demo content:

Bash
docker compose -f compose.dev.yaml cp config/db/seed-production-content.js db:/seed-production-content.js
docker compose -f compose.dev.yaml exec db mongosh --quiet /seed-production-content.js
docker compose -f compose.dev.yaml exec redis redis-cli FLUSHALL
What the seed script does:

Removes old seeded participation data, problems, and contests.

Inserts demo problems and contests.

Automatically detects the admin user to set as the "creator" of the seeded content.

(Optional) You can explicitly choose the seed owner if automatic detection fails:

Bash
# By Email:
docker compose -f compose.dev.yaml exec -e SEED_ADMIN_EMAIL=your-email@example.com db mongosh --quiet /seed-production-content.js

# By Username:
docker compose -f compose.dev.yaml exec -e SEED_ADMIN_USERNAME=admin db mongosh --quiet /seed-production-content.js
💻 Common Commands
Action	Command
Stop Stack	docker compose -f compose.dev.yaml down
Restart Stack	docker compose -f compose.dev.yaml restart
Restart Single Service	docker compose -f compose.dev.yaml restart <service-name>
View Status	docker compose -f compose.dev.yaml ps
🩺 Troubleshooting
1. Seed script says admin user not found:

Reason: No admin-like user exists yet.

Fix: Complete the full First-Time Setup flow (Sign up > Verify OTP > Promote in DB > Re-login) before running the seed script.

2. Admin panel shows forbidden / role error:

Reason: Role was updated in DB, but your browser token is stale.

Fix: Logout and log back in.

3. OTP email is not arriving:

Fix: Ensure main.conf is pointing SMTP to mailhog on port 1025, then check the UI at http://localhost:8025.

4. Seed completed but data still looks stale:

Reason: Redis cache needs to be cleared.

Fix: Run docker compose -f compose.dev.yaml exec redis redis-cli FLUSHALL

5. Need to check service logs:

Bash
docker compose -f compose.dev.yaml logs auth --tail 200
docker compose -f compose.dev.yaml logs submissions --tail 200
# Replace 'auth' or 'submissions' with any service name (e.g., users, permissions, api, judge)
✅ Manual Verification Checklist
After setting up the project, verify these core flows:

[ ] Signup & Email OTP verification

[ ] Login / Forgot password / Reset password

[ ] Problem run & submission

[ ] Contest listing, participation, and submission

[ ] Leaderboard updates

[ ] Support ticket flow & special access flow

[ ] Admin dashboard access

🔒 Security Notes
🚨 WARNING: Before deploying this project to production:

Replace JSON_WEB_TOKEN_SECRET with a strong, cryptographic secret.

Configure real, private SMTP credentials.

NEVER commit main.conf, .env files, or any secrets to version control.

Do not expose internal service ports publicly unless absolutely required behind a firewall.
