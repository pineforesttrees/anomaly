# SPC Sales Dashboard

Control charts (SPC — statistical process control) for products A, B, C, D,
with configurable upper/lower control limits and email alerts on breach.

```
frontend/   Angular 18 + Angular Material dashboard (dark blue theme)
backend/    REST API on API Gateway + Lambda, DynamoDB, SES alerts
```

## How it fits together

```
Angular app  --HTTP-->  API Gateway  -->  Lambda handlers  -->  DynamoDB
                                                                    ^
                                             EventBridge (5 min) -- | -- checkBreaches Lambda -> SES email
```

- The frontend never talks to AWS directly — only to the REST API.
- No raw sales figures are ever sent to the browser as visible text: the
  chart plots values as line positions with the y-axis hidden, and the
  tooltip reports only "within / above / below limits", not a number.
- `checkBreaches` polls the latest point per product every 5 minutes and
  emails `notifyEmails` via SES **only on the transition into** a breach,
  so you don't get a new email every 5 minutes for the same ongoing issue.

## Assumption to double check

The database wasn't pinned down yet, so the backend defaults to **DynamoDB**
(good fit for a `productCode` + `timestamp` access pattern). If your sales
data actually lives in **RDS** or **Timestream**, only `backend/src/lib/dynamo.ts`
and the two query calls in `getSeries.ts` / `checkBreaches.ts` need to change —
everything above that layer (handlers, frontend) is written against plain
TypeScript interfaces, not DynamoDB APIs.

## Local setup

### Frontend
```bash
cd frontend
npm install
npm start          # http://localhost:4200
```
Set the API URL in `src/environments/environment.ts` (dev) and
`environment.prod.ts` (prod build).

### Backend
```bash
cd backend
npm install
npx serverless deploy --stage prod --region eu-central-1 \
  --param="SES_SENDER_EMAIL=alerts@yourdomain.com"
```
Requirements before deploying:
- AWS credentials configured locally (`aws configure`) with permission to
  create Lambda, API Gateway, DynamoDB, and IAM resources.
- The sender email/domain must be **verified in SES**. While SES is in
  sandbox mode, recipient addresses must be verified too — request
  production access to email arbitrary recipients.
- Load real sales rows into the `sales-data` table (`productCode`,
  `timestamp` ISO string, `value` number) from wherever your ingestion
  pipeline lands — this project doesn't include the ingestion side.

## Configuring control limits

Click the gear icon on any chart card → set UCL/LCL, an optional center
line, and the email addresses to notify. Saving calls
`PUT /products/{code}/limits`, which the checker Lambda reads on its next
run.

## Bitbucket setup

```bash
git init
git add .
git commit -m "Initial commit: SPC dashboard (Angular + AWS backend)"
git remote add origin git@bitbucket.org:YOUR_WORKSPACE/YOUR_REPO.git
git push -u origin main
```
See `bitbucket-pipelines.yml` for a starter CI pipeline (frontend build +
backend deploy). Fill in the repository variables it references before
enabling it (see comments in that file).
