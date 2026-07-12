# SahayCredit Security Documentation

## Overview

This document summarizes the security measures implemented in the SahayCredit platform,
what is running in sandbox/simulated mode, and what a production deployment would still need.

## Implemented Security Measures

### Authentication & Sessions
- **JWT-based auth** with HMAC-SHA256 signing (Node.js built-in crypto)
- **Short-lived access tokens**: 15-minute TTL
- **Refresh token rotation**: 7-day TTL; old refresh tokens invalidated on use
- **Password hashing**: PBKDF2 with SHA-512, 100,000 iterations, random 16-byte salt
- **Timing-safe comparison** for password verification (prevents timing attacks)

### Role-Based Access Control (RBAC)
- Three roles: `borrower`, `lender`, `admin`
- Enforced **server-side** via `requireRole()` middleware on API endpoints
- A borrower token cannot access lender-only endpoints even if the URL is guessed
- Demo users seeded for development: `borrower-demo`, `lender-demo`, `admin-demo`

### Input Validation & Sanitization
- **Server-side validation** on all API inputs (type checking, range validation, format validation)
- **`sanitizeInput` middleware** strips script tags, `javascript:` URIs, and event handler injections
- **SQL-sensitive character escaping** applied to all string inputs
- Specific validation: PAN format (`/^[A-Z]{5}\d{4}[A-Z]$/`), Aadhaar (`/^\d{12}$/`), answer indices (0-3)

### Rate Limiting
- **Token-bucket rate limiting** on all sensitive endpoints:
  - Login: 10 requests/minute per IP
  - OTP send/verify: 5 requests/minute per IP
  - eKYC verify: 5 requests/minute per IP
  - Bureau check: 5 requests/minute per IP
  - Scoring: standard (no additional limit beyond global)
- **OTP-specific rate limiting**: max 3 OTP requests per destination per 10-minute window

### Encryption
- **AES-256-GCM** encryption for sensitive data at rest (KYC documents, consent records)
- Key derived from `ENCRYPTION_KEY` environment variable via SHA-256
- Random 16-byte IV per encryption operation
- Authentication tag verification on decryption (prevents tampering)
- **WARNING**: Development fallback key is used if `ENCRYPTION_KEY` is not set

### OTP Verification
- **6-digit cryptographically random** OTP (using `crypto.randomBytes`)
- **HMAC-SHA256 hashed** storage (OTP never stored in plaintext)
- **5-minute TTL**, single-use (consumed on verification)
- **Max 3 verification attempts** per OTP
- **Never logged in plaintext** to any persistent log
- Email delivery as working default; SMS documented as pluggable alternative

### HTTPS Enforcement
- `httpsRedirect` middleware redirects HTTP to HTTPS in production (`NODE_ENV=production`)
- `Strict-Transport-Security` header set with 1-year max-age

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Audit Logging
Every sensitive action writes to the audit log with timestamp, actor, and outcome:
- Consent grants/revocations
- eKYC verification attempts (success/failure)
- Bureau credit checks (found/not-found)
- OTP send/verify events (destination masked, OTP never logged)
- Scoring decisions

Audit log accessible via `/api/audit/full` endpoint.

## Sandboxed / Simulated Components

| Component | Mode | Real Provider Needed |
|-----------|------|---------------------|
| eKYC Identity Verification | **Sandbox** — format validation + pattern matching | DigiLocker / UIDAI eKYC API (requires regulated access) |
| Credit Bureau Check | **Simulated** — synthetic PAN registry (20 records) | CIBIL / Experian / Equifax API (requires NBFC license) |
| OTP Email Delivery | **Development** — prints to server console | SMTP provider (SendGrid, SES, Mailgun) |
| OTP SMS Delivery | **Documented** — code path exists, not connected | Twilio / MSG91 (requires paid account + API keys) |
| Fraud Detection Data | **PaySim** — synthetic mobile-money distributions | Real transaction data from consented sources |

All sandbox/simulated components use the same **pluggable provider interface** pattern:
swapping in a real provider is a configuration change, not a code rewrite.

## Production Deployment Requirements

The following items are **not** implemented and would be required for a real production deployment:

### Infrastructure Security
- [ ] **Web Application Firewall (WAF)** — CloudFlare, AWS WAF, or similar
- [ ] **DDoS protection** — CDN-level or infrastructure-level
- [ ] **Container security scanning** — if deploying via Docker
- [ ] **Network segmentation** — separate subnets for app/database/admin

### Data Security
- [ ] **Database encryption at rest** — using cloud-native KMS (AWS KMS, GCP Cloud KMS)
- [ ] **Key rotation policy** — automated key rotation every 90 days
- [ ] **Data backup encryption** — encrypted backups with separate key
- [ ] **PII data masking** in non-production environments

### Compliance
- [ ] **Formal security audit** by a CERT-IN empanelled auditor
- [ ] **Penetration testing** — at least annual, by an independent firm
- [ ] **SOC 2 Type II** or equivalent compliance certification
- [ ] **RBI data localization** — all data stored on Indian servers
- [ ] **GDPR/DPDPA compliance** — data subject rights, consent management, data retention policies

### Operational Security
- [ ] **Intrusion Detection System (IDS)** — monitoring for unauthorized access
- [ ] **Log aggregation** — centralized logging (ELK, Splunk, or CloudWatch)
- [ ] **Incident response plan** — documented playbook for security incidents
- [ ] **Vulnerability management** — regular dependency scanning, CVE monitoring
- [ ] **Secrets management** — HashiCorp Vault or cloud-native secrets manager (not env vars)

### Application Security
- [ ] **CSRF protection** — anti-CSRF tokens for state-changing operations
- [ ] **Content Security Policy (CSP)** headers
- [ ] **Subresource Integrity (SRI)** for third-party scripts
- [ ] **API versioning** — for backward-compatible security updates

## npm Audit Results

Run `npm audit` to check for known vulnerabilities in dependencies.
Current dependency count is minimal (express only), which reduces attack surface.
