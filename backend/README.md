# Backend

This is the NestJS backend for the Wix ↔ HubSpot integration.

For the full project overview, setup instructions, environment variables, and run commands, use the root README:

- `../README.md`

## Backend-only Quick Start

```bash
cp .env.example .env.local
npm install
npm run start:dev
```

## Main Responsibilities

- HubSpot OAuth
- HubSpot token encryption and refresh
- Wix and HubSpot webhook handling
- contact sync logic
- field mapping persistence
- form attribution capture
- Postgres persistence
