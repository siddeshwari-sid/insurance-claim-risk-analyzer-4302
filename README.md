# Insurance Claim Risk Analyzer (CSV Upload + Rule-Based Risk Scoring)

This is a full-stack web application that helps identify potentially fraudulent insurance claims at the time of CSV upload and provides a risk-based view of the uploaded claim queue.

The application has two containers:

- **Backend (Express)**: Parses uploaded claim CSVs, computes a deterministic risk score and risk level, stores claims in memory, and exposes REST APIs.
- **Frontend (React)**: Provides login, CSV upload, dashboard charts, a triage queue, and a claim detail view including explanations and cross-claim signals.

## Working flow (end-to-end)

### 1) Login

When you open the frontend, the app requires authentication for all routes except `/login`.

The login in this project is **demo-only and client-side**:

- Credentials: `admin` / `admin`
- Session storage: browser `localStorage` (no backend auth, no user database)

After successful login, the app redirects you to the originally requested page (or defaults to the dashboard).

### 2) Upload CSV

Navigate to **Upload CSV** from the sidebar or from the dashboard button.

On the upload page you can either:

- Select a `.csv` file from your machine and click **Upload & Score**, or
- Click **Load demo seed CSV** to load the built-in sample CSV bundled with the frontend, then click **Upload & Score**

When you upload, the frontend sends the CSV content to the backend endpoint:

- `POST /api/claims/upload` with `Content-Type: text/csv` and the raw CSV text as the request body.

The backend will:

1. Parse and validate rows.
2. Compute cross-claim signals (duplicate claim id / repeated claimant/provider/location patterns) using the current in-memory store.
3. Score each accepted claim using rule-based logic.
4. Store claims in memory and return the stored claim summaries.

If some rows are rejected but others are accepted, the backend still returns `201` and includes the row validation errors in a `warnings` array.

### 3) Dashboard (risk distribution + high-risk preview)

After uploading, go to the **Dashboard** to view:

- Total claim count currently in the in-memory store
- Counts of High / Medium / Low risk claims
- Risk distribution charts
- A high-risk preview list; selecting **View** opens the claim detail page

The dashboard data is fetched from:

- `GET /api/claims`

Because the backend store is in-memory, the dashboard reflects only what has been uploaded since the backend last started.

### 4) Queue (triage view)

Open the **Claim Queue** to triage and filter claims:

- Filter by risk level (High / Medium / Low)
- Search by claim id, claimant, amount, or explanation text (client-side search on fetched results)
- Open claim details via **View**

The queue is also powered by:

- `GET /api/claims`

### 5) Claim detail (explanations + cross-claim signals)

Clicking a claim opens `/claims/:id` which shows:

- The assigned risk level (badge)
- Explanations for the score (rule triggers)
- Cross-claim signals (duplicate claim id count and repetition counts for claimant/provider/location), when available

The detail view fetches:

- `GET /api/claims/:id`

## CSV format

The backend supports a flexible header set and normalizes multiple common schemas into the canonical internal fields used for scoring.

### Required fields (conceptually)

A row must provide enough information for the backend to populate:

- `claimId`
- `claimAmount`
- `incidentType`
- `priorClaimsCount`
- `daysSinceIncident` (either directly, or derivable from dates)
- `policyTenureMonths` (either directly, or defaulted/derived)

### Supported headers (aliases)

The backend accepts multiple header names for each field. Common examples include:

- Claim id: `claim_id`, `claimId`, `id`
- Amount: `claim_amount`, `amount`, `total_amount`
- Incident type: `incident_type`, `incidentType`, `loss_type`
- Prior claims count: `prior_claims_count`, `priorClaims`, `prior_claims`
- Days since incident: `days_since_incident` (direct), or derived from `incident_date` + `filed_date`
- Policy tenure months: `policy_tenure_months` (direct) or derived/defaulted
- Optional metadata (improves cross-claim detection and UI richness): `claimant_name`, `provider_name`, `location`, `policy_number`, `description`

If you provide `incident_date` and `filed_date` (for example `YYYY-MM-DD`), the backend can derive `daysSinceIncident` automatically.

## Risk scoring and explanations

Risk scoring is deterministic and rule-based. The backend produces:

- `riskScore`: numeric score
- `riskLevel`: `High`, `Medium`, or `Low`
- `explanations`: strings describing which rules triggered
- `fraudSignals`: cross-claim signals computed from the in-memory store

### Thresholds

- **High**: score >= 8
- **Medium**: score >= 4
- **Low**: otherwise

### Base single-claim rules (examples)

The backend assigns points for rules such as:

- High or very high claim amount
- Late filing (more than 30 days since incident)
- New policy (tenure less than 3 months)
- Frequent claimant (3+ or 5+ prior claims)
- Higher-risk incident types (theft, fire)
- Suspicious keywords in description (e.g. `cash`, `urgent`, `no receipt`, `lost`, `stolen`, `wire`)

### Cross-claim signals (in-memory comparisons)

When uploading, the backend compares each incoming claim against existing stored claims and adds additional scoring/explanations for:

- Duplicate claim id (same external `claim_id` already uploaded)
- Repeated claimant patterns
- Repeated provider patterns
- Repeated location patterns

These signals are returned in `fraudSignals` and are also described in `explanations`.

## Seed CSV (demo dataset)

The frontend includes a demo CSV at:

- `fraud_detection_frontend/public/seed/seedClaimsAllRules.csv`

You can load it from the upload page using **Load demo seed CSV**.

This seed file is designed to exercise multiple rules, including:

- Higher amounts and suspicious keywords
- Late filing derived from `incident_date` and `filed_date`
- Repeated claimant/provider/location patterns across multiple rows
- A deliberate duplicate `claim_id` row to trigger the duplicate-claim signal

## Configuration

### Backend runtime config for frontend discovery

In preview environments, the frontend may not have build-time environment variables injected. To make the preview flow work reliably, the frontend performs a **runtime discovery handshake**:

- It calls `GET /api/config` on a best-effort backend origin (same host as the frontend, port `3001`).
- The backend responds with `{ apiBaseUrl }`.
- The frontend caches this value and uses it for subsequent API calls.

This avoids common preview issues like the frontend accidentally posting to port 3000 and returning `Cannot POST /api/claims/upload`.

### Frontend environment variables (optional)

The frontend supports these environment variables to explicitly set the backend base URL:

- `REACT_APP_API_BASE`
- `REACT_APP_BACKEND_URL`
- `REACT_APP_API_BASE_URL`

If you set any of these, the frontend will use them and skip runtime discovery.

### Backend CORS

The backend enables CORS and attempts to be preview-friendly by allowing Kavia-hosted origins as well as typical local dev origins. You can override allowed origins via:

- `ALLOWED_ORIGINS="https://example.com,https://another.example.com"` or `ALLOWED_ORIGINS="*"`
- or (legacy) `FRONTEND_URL` / `REACT_APP_FRONTEND_URL`

## API quick reference

Backend endpoints:

- `GET /` health check
- `POST /api/claims/upload` upload CSV (raw `text/csv` body or JSON `{ "csv": "..." }`)
- `GET /api/claims` list stored claims (optional query `?risk=High|Medium|Low`)
- `GET /api/claims/:id` fetch claim detail
- `GET /api/config` runtime discovery endpoint
- `GET /openapi.json` OpenAPI spec
- `GET /docs` Swagger UI

## Running locally (standard Node workflows)

### Backend (Express)

From `insurance-claim-risk-analyzer-4301/fraud_detection_backend`:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run in dev mode:
   ```bash
   npm run dev
   ```
3. Backend defaults:
   - Host: `0.0.0.0`
   - Port: `3000` unless `PORT` is set

Swagger UI will be available at `http://localhost:<PORT>/docs`.

### Frontend (React)

From `insurance-claim-risk-analyzer-4302/fraud_detection_frontend`:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start:
   ```bash
   npm start
   ```

Frontend defaults to `http://localhost:3000`.

If you also run the backend locally, set backend `PORT=3001` (or set `REACT_APP_API_BASE` in the frontend) to match the preview convention of frontend=3000 and backend=3001.

## Notes and limitations

The backend claim store is **in-memory only**. Restarting the backend clears all uploaded claims, which will also reset dashboard and queue views.
