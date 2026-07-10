# Aryan's Blog (Vercel edition)

A full-stack personal blog: a public site (landing page + posts), an admin
panel for writing/editing posts and managing images, and a "Reach Out"
contact form whose messages are end-to-end encrypted.

This version is built to run on **Vercel**. Because Vercel's serverless
functions don't have a persistent local disk, data is stored in real cloud
services instead of local files:

- **Posts & messages:** [Upstash Redis](https://upstash.com) (added via Vercel's Storage tab)
- **Uploaded images:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **Admin login & the contact form's public key:** environment variables (no database needed for these)

## How the pieces fit together

- `app.js` builds the Express app and all `/api/...` routes.
- `server.js` is only for local testing (`npm start`) — it adds static file serving on top of `app.js`.
- `api/index.js` is the entry point Vercel actually runs — same `app.js`, wrapped as a serverless function.
- `vercel.json` tells Vercel to send any `/api/*` request to that function. Everything else (`index.html`, `post.html`, `css/`, `js/`, `admin/`) is served automatically from the `public/` folder — no configuration needed for that part.

## One-time setup (run these locally, on your own computer)

You'll need [Node.js](https://nodejs.org) installed (18 or later).

```bash
npm install
cp .env.example .env
```

**1. Generate a session secret.** Put this in `.env` as `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**2. Create your admin login:**
```bash
npm run create-admin
```
This prints an `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` — copy both into Vercel's Environment Variables (Project Settings → Environment Variables) once you've created the project there.

**3. Generate the contact-form encryption keys:**
```bash
npm run generate-keys
```
This prints a `PUBLIC_KEY_PEM` value to paste into Vercel's Environment Variables, and saves a private key file locally (`PRIVATE_KEY_DO_NOT_SHARE.pem`). Move that private key somewhere safe (password manager, encrypted note) and delete it from your computer once saved — you'll paste it into the admin dashboard whenever you want to read messages. It never goes into an environment variable or anywhere near the server.

## Deploying

See the step-by-step walkthrough your assistant gave you for connecting this repo to Vercel through GitHub — the short version:

1. Push this project to a GitHub repo.
2. Import that repo in Vercel.
3. In Vercel's Storage tab, add an **Upstash Redis** database and a **Blob** store to the project — this automatically sets `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `BLOB_READ_WRITE_TOKEN` for you.
4. Add the remaining environment variables from the setup steps above (`JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `PUBLIC_KEY_PEM`, and `COOKIE_SECURE=true`).
5. Deploy.

## Testing checklist

- [ ] Homepage loads (it starts empty — publish your first post from the admin dashboard).
- [ ] `/admin/login.html` rejects a wrong password, logs in with the right one.
- [ ] Publish a post with a cover image — confirm it shows up on the homepage and the image loads.
- [ ] Edit a post and replace its image — confirm the change appears on the public post page.
- [ ] Delete a test post — confirm it disappears.
- [ ] Submit the contact form as a visitor (different browser/incognito tab, logged out of admin).
- [ ] In the dashboard's "Direct Messages" tab, paste your private key and confirm the message decrypts.
- [ ] Refresh or wait a bit, then reload the site — confirm posts/images/messages are all still there (this is the check that actually proves cloud storage is working, not local files that would've reset).

## Local testing before you deploy

You can run the exact same code locally:

```bash
npm start
```

For this to fully work locally, `.env` needs real `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (free database at upstash.com) and a real `BLOB_READ_WRITE_TOKEN` (create a Blob store from your Vercel dashboard and copy its token) — the same cloud services your deployed site will use. This means local testing and production share the same data, which is convenient for verifying everything works before or after a deploy.
