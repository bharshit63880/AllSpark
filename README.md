# ⚡ AllSpark

[![Docker](https://img.shields.io/badge/Docker-blue?logo=docker&logoColor=white)](https://www.docker.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-darkgreen?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-red?logo=redis&logoColor=white)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Kafka-black?logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js&logoColor=white)](https://nodejs.org/)

> **AllSpark is a distributed, microservices-based coding and evaluation platform built for problem solving, competitive programming, automated code execution, administration, and support workflows.**

AllSpark separates major platform responsibilities into independent backend services and uses **Apache Kafka for event-driven communication, Redis for caching and real-time state, MongoDB for persistent data, WebSockets for live updates, and Docker for local infrastructure orchestration.**

---

## 📸 Product Preview

### Feature Tour

<p align="center">
  <img src="docs/demo/allspark-feature-tour.gif" width="760" alt="AllSpark feature tour">
</p>

### Home

<p align="center">
  <img src="docs/screenshots/01-homepage.png" width="760" alt="AllSpark home page">
</p>

### Problem Library

<p align="center">
  <img src="docs/screenshots/02-problems.png" width="760" alt="AllSpark problem library">
</p>

### Contest Arena

<p align="center">
  <img src="docs/screenshots/03-contests.png" width="760" alt="AllSpark contest arena">
</p>

<details>
<summary>More Screens</summary>

### About

<p align="center">
  <img src="docs/screenshots/04-about.png" width="760" alt="AllSpark about page">
</p>

### Careers

<p align="center">
  <img src="docs/screenshots/05-careers.png" width="760" alt="AllSpark careers page">
</p>

### Sign Up

<p align="center">
  <img src="docs/screenshots/06-signup.png" width="760" alt="AllSpark sign-up page">
</p>

### Login

<p align="center">
  <img src="docs/screenshots/07-login.png" width="760" alt="AllSpark login page">
</p>

### Coding Workspace

<p align="center">
  <img src="docs/screenshots/11-problem-workspace.png" width="760" alt="AllSpark coding workspace">
</p>

### Contest Details

<p align="center">
  <img src="docs/screenshots/12-contest-details.png" width="760" alt="AllSpark contest details">
</p>

### Support Center

<p align="center">
  <img src="docs/screenshots/08-support.png" width="760" alt="AllSpark support center">
</p>

### Support Ticket Tracking

<p align="center">
  <img src="docs/screenshots/13-support-ticket-tracking.png" width="760" alt="AllSpark support ticket tracking">
</p>

### Admin Control Panel

<p align="center">
  <img src="docs/screenshots/09-admin-control-panel.png" width="760" alt="AllSpark admin control panel">
</p>

</details>

---

## 🎯 Overview

AllSpark is a distributed coding platform designed to handle the major workflows involved in an online coding and evaluation system.

The platform includes:

- User authentication and account management
- Email OTP verification
- Coding problems and submissions
- Automated code execution
- Competitive programming contests
- Live leaderboards
- Role-based permissions
- Administrative workflows
- Support ticket management
- Real-time application updates

Instead of implementing the entire backend as one application, AllSpark separates major responsibilities into independent services and uses asynchronous events where appropriate.

---

## ✨ Core Features

### 👤 Authentication & User Management

- User signup and login
- OTP-based email verification
- Forgot password
- Password reset
- Account activation/deactivation
- User management
- JWT-based authentication

### 💻 Coding & Evaluation

- Problem library
- Online coding workspace
- Code execution
- Submission processing
- Submission results
- Judge0-compatible execution integration

### 🏆 Contests

- Contest listing
- Contest participation
- Contest submissions
- Contest problem solving
- Live leaderboard updates

### ⚡ Real-Time System

- WebSocket-based updates
- Live leaderboard updates
- Real-time submission-related updates
- Event-driven backend communication

### 🔐 Authorization & Admin

- Role-based access control
- Permission management
- Admin control panel
- Protected administrative workflows

### 🎫 Support

- Support ticket creation
- Ticket tracking
- Support workflows
- Special access / approval flows

### 📨 Email & OTP

- OTP-based account verification
- Password recovery emails
- MailHog integration for local development

---

# 🏗️ Architecture

AllSpark follows a **microservices + event-driven architecture**.

```mermaid
flowchart TB

    Client[React + Vite Frontend]

    Gateway[API Gateway]

    Auth[Authentication Service]
    Users[User Management]
    Permissions[Permission Service]
    Problems[Problems & Contests]
    Submissions[Submission Service]
    Support[Support Service]

    Mongo[(MongoDB)]
    Redis[(Redis)]
    Kafka[(Apache Kafka)]
    Judge[Judge0-Compatible Engine]
    Mail[MailHog / SMTP]

    Client --> Gateway

    Gateway --> Auth
    Gateway --> Users
    Gateway --> Permissions
    Gateway --> Problems
    Gateway --> Submissions
    Gateway --> Support

    Auth --> Mongo
    Users --> Mongo
    Problems --> Mongo
    Submissions --> Mongo
    Support --> Mongo

    Auth --> Mail

    Submissions --> Judge

    Auth <--> Kafka
    Users <--> Kafka
    Problems <--> Kafka
    Submissions <--> Kafka
    Support <--> Kafka

    Submissions --> Redis
    Problems --> Redis
    Kafka --> Redis

    Redis --> Client
