# Email Service

Email service microservice for the All Spark platform. Handles email sending operations through Kafka messaging.

## Features

- Email sending via Kafka topics
- Nodemailer integration for SMTP
- OTP email templates
- Redis support for logging and metrics
- Scalable microservice architecture

## Setup

### Environment Variables

Create a `.env` file in the service root:

```
PORT=3600
EMAIL_SERVICE_PORT=3600
KAFKA_INSTANCE_IP=localhost
REDIS_URL=localhost:6379
DEFAULT_PARTITIONS_OF_KAFKA_TOPICS=4

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=All Spark
```

### Installation

```bash
npm install
```

### Running the Service

```bash
npm run dev
```

## Kafka Topics

- **send.email** - Main topic for sending emails

## Email Templates

Currently supports:
- `otp` - OTP email for password reset

## API

### Health Check

```
GET /health
```

Returns service status.

## Architecture

```
services/email
├── index.js                 # Entry point
├── config/v1/
│   ├── kafka.js            # Kafka configuration
│   └── redis.js            # Redis configuration
├── src/
│   ├── config/
│   │   └── mailer.js       # Nodemailer configuration
│   ├── handlers/
│   │   └── sendEmail.js    # Email sending handler
│   ├── templates/
│   │   └── otpTemplate.js  # OTP email template
│   └── v1/
│       └── logic.js        # Kafka consumer logic
└── utils/v1/
    ├── kafkaAdmin.js       # Kafka admin operations
    ├── kafkaProducer.js    # Kafka producer
    └── getPartition.js     # Partition selection utility
```
