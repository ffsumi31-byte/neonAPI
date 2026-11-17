# Cloud portal: lifetime accounts, phase 1

**Update:** a guarded hosted DeepSeek `/v1/messages` route and reservation ledger
have been added. They are disabled by default and have not been integration-tested
against a live database/provider. Read [METERING.md](METERING.md) before enabling.
Older "not implemented" wording below describes the original phase-1 state.
The portal now includes a manual server-backed token tracker refresh.

Administrator page: `/admin.html`. Follow [ADMIN.md](ADMIN.md) to create a separate
admin credential, configure Netlify, apply the audit schema, and manage customer keys.

This is a separate Netlify-ready website and account API, not the existing local gateway.
It provides customer-key login and a PostgreSQL-backed lifetime token allowance.
Inference is disabled by default. Do not enable it until the deployment and
metering validation described in [METERING.md](METERING.md) is complete.
The first screen is customer API-key login. Only a successful `/api/account`
response reveals the workspace; logout and refresh lock it again. This UI gate
does not replace server authorization: static HTML is public, private data is
protected by the account API. Service preset previews display Haiku 1x,
Sonnet 2x, Opus 4x, and Fable 8x; these are service labels, not actual Claude
models or active billing deductions.
The UI says this explicitly; it does not simulate usage or claim a paid service is live.

## Netlify build and deploy settings

1. Create a hosted PostgreSQL database (for example through a provider you trust).
   Use its verified TLS connection URL. Database and Netlify usage may have costs.
2. Run `schema.sql` using the database's SQL console.
3. Import the repository in Netlify. Set **Base directory** to `cloud-app`
   (leave it blank only if `cloud-app` itself is the repository root).
4. Use these build settings (also recorded in `netlify.toml`):
   - **Build command:** `npm test` — this static site has no compilation step;
     the test suite is run as a deploy check.
   - **Publish directory:** `public`
   - **Functions directory:** `netlify/functions`
   - **Runtime:** Node.js `22`
5. In **Site configuration → Environment variables**, add these as server/runtime
   secrets, available to Functions and Builds/Functions as appropriate:
   - `DATABASE_URL` — hosted PostgreSQL TLS connection string.
   - `ADMIN_ACCESS_KEY` — separate admin credential generated with `npm run admin-key`.
   - `INFERENCE_ENABLED` — set to `false` initially.
   - `DEEPSEEK_API_KEY` — only if later enabling hosted inference.
   - `MAX_PROVIDER_REQUEST_TOKENS` — only after deriving and validating the
     provider's hard per-request upper bound.
   Do not add provider/admin/database secrets as `VITE_*`, `NEXT_PUBLIC_*`,
   or other client-exposed variables. `OPENROUTER_API_KEY` is not used by this route.
6. Redeploy after setting variables. Netlify assigns an HTTPS `<your-site>.netlify.app` address.
   An example address is not owned or published until you create that project.
   Do not use drag-and-drop of `public` alone: it would omit the API functions.
6. Open the assigned HTTPS URL. A custom domain is optional.

No Netlify account, database, or deployed URL was created automatically. Do not
set `INFERENCE_ENABLED=true` merely to make deployment appear complete; follow
the live-database validation checklist in `METERING.md` first.

## Issue a test customer, privately

On your administrator computer, with Node.js 22+:

```powershell
cd D:\local-ai-gateway\cloud-app
npm install
# Set DATABASE_URL privately in this terminal; do not paste it into chat.
$env:DATABASE_URL = "<your database connection URL>"
npm run issue-user -- "Test customer" 10000000
```

The command prints a new `sk-gw-…` customer key ONCE. Send it securely to that
customer and have them use the portal. The database stores only its SHA-256 hash.
These 256-bit random service keys are NOT DeepSeek/OpenRouter keys.
The name is a display name, not proof of an email identity.
Bearer keys are passwords: anyone with a copied key can impersonate that customer.
The current portal does not persist keys in browser storage.

```powershell
npm run grant-tokens -- "<customer UUID>" 10000000
npm run revoke-user -- "<customer UUID>"
npm test
```

Grant additional tokens only after independently verifying a purchase. No payments
or purchase webhook is connected. There is no public create-user/grant endpoint.
Grants accumulate and never reset monthly or expire. Zero consumption remains
zero until real usage events are implemented; this is not a billing test.

## Important before public launch

The hosted `/v1/messages` endpoint exists but is **disabled by default**. Its
automated tests use mocked database interactions; they do not establish live
PostgreSQL concurrency, Netlify runtime compatibility, provider accounting, or
Claude streaming compatibility. Follow every pre-launch check in `METERING.md`.
Do not enable paid inference until those checks pass.

The hosted route currently meters DeepSeek main-provider usage only. OpenRouter
helpers, dollar budgets, purchases, email login/recovery, and desktop installers
are not implemented. The local gateway is separate and bypasses this account
database. Never distribute a local build containing provider credentials.

Keep database/admin/provider secrets server-side. Configure platform abuse limits,
monitoring, key rotation/reissue and customer support before public use. The
`/admin.html` page manages account grants; these grants are not guaranteed cost
caps or a fixed-price token package.
