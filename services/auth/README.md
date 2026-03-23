# This Handles How We Process Events Related to Auth

## Forgot Password (OTP)

Flow: client → API → request → auth (checkIdentity) → permissions.check → auth.forgotPassword / auth.verifyOtp / auth.resetPassword → auth handlers → Redis (OTP) / Kafka (send-email, users.password.reset).

### Required Permission documents (MongoDB)

Add these so the permission service routes requests to the auth service:

| name                | nextTopicToPublish   | roles   |
|---------------------|----------------------|--------|
| auth.forgotPassword | auth.forgotPassword  | PUBLIC |
| auth.verifyOtp      | auth.verifyOtp       | PUBLIC |
| auth.resetPassword  | auth.resetPassword   | PUBLIC |

### Redis keys

- `otp:{email}` – OTP value, TTL 5 minutes.
- `reset_allowed:{email}` – set after OTP verify, TTL 10 minutes; required for reset-password.

### Kafka topics

- **send-email** – auth produces here for email service (payload: to, subject, type: "password-reset", body, otp).
- **users.password.reset** – auth produces here; users service consumes and updates password by email.