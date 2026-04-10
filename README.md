# Wix ↔ HubSpot Integration

This repository contains a full-stack Wix ↔ HubSpot integration with two apps:

- `app/`: a Wix CLI / Astro app that provides the Wix dashboard UI and a site embedded script
- `backend/`: a NestJS backend that handles OAuth, field mappings, contact sync, webhooks, and form attribution capture

## What This App Does

At a high level, this project:

- connects a Wix installation to HubSpot using OAuth 2.0
- lets a user manage field mappings from a Wix dashboard page
- syncs contacts in both directions between Wix and HubSpot
- stores persistent contact links and sync event logs in Postgres
- injects a Wix site script that captures form attribution context
- stores that attribution context and applies it during Wix → HubSpot contact sync

## Repository Structure

```text
.
├── app/        # Wix CLI / Astro frontend
├── backend/    # NestJS backend API and webhook handlers
└── package.json
```

## Main Functional Areas

### Frontend (`app/`)

- Wix dashboard page for:
  - HubSpot connect / disconnect
  - connection status
  - field mapping management
  - sync log viewing
- Embedded site script extension that loads the hosted form capture script

### Backend (`backend/`)

- HubSpot OAuth start / callback / status / disconnect endpoints
- Wix-protected dashboard APIs
- field mapping persistence
- Wix → HubSpot and HubSpot → Wix contact sync
- webhook handling for Wix and HubSpot
- form attribution capture at `/api/forms/context`
- Postgres persistence for installations, mappings, links, sync logs, and form context

## Prerequisites

Before running the project locally, make sure you have:

- Node.js `22.10.0`
  - the frontend pins this version in `app/.nvmrc`
- npm
- a running Postgres database
- a Wix app with the required app credentials
- a HubSpot app with OAuth credentials and redirect URI configured
- public URLs available for local development if you need to test OAuth callbacks and webhooks end-to-end

## Setup

### 1. Install dependencies

Install dependencies in both apps:

```bash
cd backend && npm install
cd ../app && npm install
```

You can also run the local dev commands from the repo root after both installs are complete.

### 2. Create environment files

Create these files from the provided examples:

```bash
cp backend/.env.example backend/.env.local
cp app/.env.example app/.env.local
```

Do not copy any real secrets into source control.

### 3. Fill in backend environment variables

The backend reads its runtime configuration from `backend/.env.local`.

Required backend variables used by the code:

| Variable | Required | Purpose | Notes |
|---|---|---|---|
| `PORT` | Yes | Port for the NestJS server | Defaults to `4000` if omitted in code, but define it explicitly for clarity |
| `DB_HOST` | Yes | Postgres host | Used by TypeORM |
| `DB_PORT` | Yes | Postgres port | Usually `5432` |
| `DB_USER` | Yes | Postgres user | Used by TypeORM |
| `DB_PASSWORD` | Yes | Postgres password | Used by TypeORM |
| `DB_NAME` | Yes | Postgres database name | Used by TypeORM |
| `APP_ENCRYPTION_KEY` | Yes | Encrypts HubSpot tokens at rest | In the current implementation this must be a 32-byte UTF-8 string because the code uses AES-256-GCM directly |
| `HUBSPOT_CLIENT_ID` | Yes | HubSpot OAuth client ID | Used to build the authorize URL and token exchange calls |
| `HUBSPOT_CLIENT_SECRET` | Yes | HubSpot OAuth client secret | Used for token exchange, refresh, and webhook signature validation |
| `HUBSPOT_REDIRECT_URI` | Yes | HubSpot OAuth callback URL | Must match the redirect URL configured in your HubSpot app |
| `HUBSPOT_SCOPES` | Yes | HubSpot OAuth scopes | The current repo uses contact read/write plus contact schema read/write scopes |
| `WIX_APP_ID` | Yes | Wix app ID | Used for Wix SDK and token generation |
| `WIX_APP_PUBLIC_KEY` | Yes | Wix app public key | Used by the Wix webhook client |
| `WIX_APP_SECRET` | Yes | Wix app secret | Used by the Wix SDK and Wix access token flow |
| `PUBLIC_BACKEND_SCRIPT_URL` | Yes | Public URL for `wix-form-capture.js` | Used when the backend injects the embedded site script during Wix app installation |

Backend variables present in the current repo env files but not directly required by backend source code:

| Variable | Required | Purpose | Notes |
|---|---|---|---|
| `PUBLIC_BACKEND_BASE_URL` | Recommended | Shared reference for the deployed backend base URL | Useful for consistency across environments; not directly consumed by backend runtime code |
| `VERCEL_OIDC_TOKEN` | No for local dev | Deployment/runtime token from Vercel | Present in the checked local env file, but not used by the application source code for local setup |

Example backend env file:

```env
PORT=4000

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=change-me
DB_NAME=wix_hubspot_integration

APP_ENCRYPTION_KEY=12345678901234567890123456789012

HUBSPOT_CLIENT_ID=your-hubspot-client-id
HUBSPOT_CLIENT_SECRET=your-hubspot-client-secret
HUBSPOT_REDIRECT_URI=http://localhost:4000/api/oauth/hubspot/callback
HUBSPOT_SCOPES=crm.objects.contacts.write oauth crm.objects.contacts.read crm.schemas.contacts.write crm.schemas.contacts.read

WIX_APP_ID=your-wix-app-id
WIX_APP_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
WIX_APP_SECRET=your-wix-app-secret

PUBLIC_BACKEND_BASE_URL=http://localhost:4000
PUBLIC_BACKEND_SCRIPT_URL=http://localhost:4000/wix-form-capture.js
```

### 4. Fill in frontend environment variables

The frontend reads its local configuration from `app/.env.local`.

Variables directly referenced by frontend source code:

| Variable | Required | Purpose | Notes |
|---|---|---|---|
| `PUBLIC_BACKEND_BASE_URL` | Yes | Base URL for backend API requests from the dashboard | Used by the dashboard API client |

Variables present in the current frontend env file for Wix app tooling/runtime:

| Variable | Required | Purpose | Notes |
|---|---|---|---|
| `WIX_CLOUD_PROVIDER` | Required by current setup | Wix app runtime/provider setting | Present in the checked frontend env file |
| `WIX_CLIENT_ID` | Required by current setup | Wix client/app identifier | Present in the checked frontend env file |
| `WIX_CLIENT_INSTANCE_ID` | Required by current setup | Wix client instance identifier | Present in the checked frontend env file |
| `WIX_CLIENT_PUBLIC_KEY` | Required by current setup | Wix public key | Present in the checked frontend env file |
| `WIX_CLIENT_SECRET` | Required by current setup | Wix client secret | Present in the checked frontend env file |

Example frontend env file:

```env
WIX_CLOUD_PROVIDER=CLOUD_FLARE
WIX_CLIENT_ID=your-wix-app-id
WIX_CLIENT_INSTANCE_ID=00000000-0000-0000-0000-000000000000
WIX_CLIENT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
WIX_CLIENT_SECRET=your-wix-app-secret

PUBLIC_BACKEND_BASE_URL=http://localhost:4000
```

## Important Environment Alignment

These values must stay aligned across environments:

- `app/.env.local` → `PUBLIC_BACKEND_BASE_URL`
  - must point to the running backend
- `backend/.env.local` → `PUBLIC_BACKEND_SCRIPT_URL`
  - must point to the public URL where `wix-form-capture.js` is served
- `backend/.env.local` → `HUBSPOT_REDIRECT_URI`
  - must exactly match the redirect URI configured in HubSpot

If you switch from local development to a deployed environment, update all three accordingly.

## How to Run

### Option 1: Run each app directly

Backend:

```bash
cd backend
npm run start:dev
```

Frontend:

```bash
cd app
npm run dev
```

### Option 2: Run from the repo root

Once dependencies are installed in both subprojects:

```bash
npm run dev:backend
npm run dev:wix
```

Run those in separate terminals.

## How the App Works

### 1. Wix app installation

When the Wix app is installed:

- the backend creates or updates an installation record
- the backend injects the embedded site script configuration
- the site loads `wix-form-capture.js` from the public backend URL

### 2. HubSpot connection

From the Wix dashboard:

- the user clicks **Connect HubSpot**
- the frontend requests an authorize URL from the backend
- the backend redirects the user through HubSpot OAuth
- the callback exchanges the code for access and refresh tokens
- the backend encrypts and stores those tokens in Postgres

### 3. Field mapping

The dashboard lets the user:

- load Wix field options
- load HubSpot contact properties
- choose sync direction
- choose a transform rule
- save mappings for the current installation

These saved mappings are then used by the sync layer.

### 4. Contact sync

#### Wix → HubSpot

- Wix contact created/updated webhooks are received
- the backend loads the Wix contact
- the backend maps the Wix data to HubSpot properties
- the backend upserts the HubSpot contact by email
- the backend stores / updates the contact link and sync event log

#### HubSpot → Wix

- HubSpot webhooks are received by the backend
- the backend validates the HubSpot signature
- the backend loads the HubSpot contact
- the backend maps HubSpot properties to Wix contact fields
- the backend creates or updates the Wix contact
- the backend stores / updates the contact link and sync event log

### 5. Form attribution capture

The embedded form capture script:

- stores UTM parameters, page URL, and referrer in the browser
- detects form interaction and attempts to collect the email field
- posts attribution context to the backend
- the backend stores the context in Postgres
- the latest context for an email can be used later during Wix → HubSpot sync

## Development Notes

- The backend serves the public script from `backend/public/wix-form-capture.js`
- The dashboard calls backend APIs using the Wix dashboard access token
- The backend uses TypeORM with `synchronize: true`
  - this is convenient for local development, but you should be cautious with it in production-style environments
- The current backend logging includes sync event payload data, so avoid using real production PII in unsecured dev environments

## Test Commands

Backend test commands:

```bash
cd backend
npm test
npm run test:e2e
```

Current repo state from the audit:

- `npm test -- --runInBand` passes the health unit test
- `npm run test:e2e -- --runInBand` depends on a reachable Postgres instance and the checked-in e2e spec is stale relative to the current `/health` route

## Quick Start Checklist

Use this checklist when setting up a fresh environment:

1. Install `backend` dependencies
2. Install `app` dependencies
3. Create `backend/.env.local` from `backend/.env.example`
4. Create `app/.env.local` from `app/.env.example`
5. Fill in Wix and HubSpot credentials
6. Start Postgres
7. Run the backend
8. Run the Wix app
9. Confirm `PUBLIC_BACKEND_BASE_URL`, `PUBLIC_BACKEND_SCRIPT_URL`, and `HUBSPOT_REDIRECT_URI` all match your environment

## Related Files

- `app/src/extensions/dashboard/pages/dashboard/dashboard-page.tsx`
- `app/src/extensions/site/embedded-scripts/contactform/contactform.extension.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/wix/wix-webhooks/wix-webhooks.service.ts`
- `backend/src/hubspot/hubspot.service.ts`
- `backend/public/wix-form-capture.js`
