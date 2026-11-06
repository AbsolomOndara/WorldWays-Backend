# WorldWays API Backend

Standalone Express API for the separate WorldWays Next.js frontend. It stores contact form messages, newsletter subscriptions, inbound email records and editable site content in PostgreSQL (Neon).

## Deploy the backend to Render

This backend is configured for Render with the included `render.yaml`.

1. Keep the existing Neon project and production database. This backend uses the `DATABASE_URL` environment variable; it does not require a new Neon database.
2. In Render, open the existing `worldways-api` web service. If creating it for the first time, connect the backend repository and use the repository root, build command `npm install`, start command `npm start`, and health check path `/health`.
3. Open the service's **Environment** page and set these values:

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | The connection string for the existing Neon production branch and database |
   | `FRONTEND_ORIGIN` | The deployed frontend origin, such as `https://your-site.vercel.app` (no path) |
   | `JWT_SECRET` | A private random value of at least 32 characters |
   | `ADMIN_EMAIL` | The administrator's sign-in email |
   | `ADMIN_PASSWORD` | A strong password for the initial administrator account |
   | `ADMIN_NOTIFICATION_EMAIL` | `info@worldwayswebdevelopers.co.ke` |
   | `INBOUND_EMAIL_WEBHOOK_SECRET` | A separate private random value for the inbound email integration |

4. Save and deploy the service. Render exposes the API on its `onrender.com` URL. Confirm that `https://YOUR-SERVICE.onrender.com/health` returns `{"data":{"status":"ok"}}`.
5. In the Vercel frontend project, set `NEXT_PUBLIC_API_BASE_URL` to the Render service origin only, for example `https://your-service.onrender.com`. Redeploy the frontend after changing this variable.
6. Open `https://YOUR-FRONTEND-DOMAIN/admin/login` and sign in with the configured admin email and password.

### Important database notes

- Keep `DATABASE_URL` pointed at the same Neon branch and database to continue using the existing records.
- On startup, the API creates any missing tables and adds starter CMS content once. It does not drop or reset existing tables or records.
- The initial admin is inserted only when that email is not already present. Changing `ADMIN_PASSWORD` after account creation does not change the existing account password.
- Never put the database URL, JWT secret, admin password or inbound email secret in frontend code, GitHub, or a public message.

## Inspect the database in Neon

In Neon Console, choose the production branch and database, then open **SQL Editor**. The API creates these tables automatically:

- `admin_users`
- `cms_entries`
- `contact_messages`
- `subscriptions`
- `email_messages`
- `app_meta`

Example query for recent contact form messages:

```sql
SELECT name, email, organisation, service, status, created_at
FROM contact_messages
ORDER BY created_at DESC;
```

Example query for subscriptions:

```sql
SELECT email, status, created_at
FROM subscriptions
ORDER BY created_at DESC;
```

## Local development

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env` and add a Neon connection string and private credentials.
3. Start the API: `npm run dev`. The API listens on port `4000` by default.
4. In the frontend's local `.env.local`, set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`.

## Email behavior

Contact form submissions are saved in `contact_messages`. If SMTP is configured, the API also sends a notification copy to `ADMIN_NOTIFICATION_EMAIL`.

Emails sent directly to the business mailbox are not imported automatically. To display those in the admin inbox, configure an email provider to forward messages to `POST /api/inbound/email` with the `x-inbound-secret` header. The JSON payload supports `from_email`, `from_name`, `subject`, `message`, optional `external_id`, and ISO `received_at`.

## API routes

- Public health check: `GET /health`
- Public site content: `GET /api/public/services`, `/pricing`, `/projects`, `/faqs`, `/blog-posts`
- Contact form: `POST /api/public/contact`
- Newsletter: `POST /api/public/subscriptions`
- Inbound email webhook: `POST /api/inbound/email`
- Admin sign-in: `POST /api/admin/auth/login`
- Admin content management: `/api/admin/content/:type`
- Admin message, subscription and inbox management: `/api/admin/contact-messages`, `/subscriptions`, `/email-messages`

Admin routes require a bearer token returned by `/api/admin/auth/login`.
