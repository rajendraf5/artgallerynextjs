# Art Gallery

The site now runs as a Next.js application; PHP and Apache are not required.

## Run locally

1. Install Node.js 20.9 or newer.
2. From the project root, install dependencies and start the development server:

   ```powershell
   npm install
   npm run dev
   ```

3. Open `http://localhost:3000`. The admin dashboard is at `http://localhost:3000/admin`.
4. In development, first-time setup lets you choose an admin password of at least 12 characters and is restricted to localhost.

For production, set `ART_GALLERY_SESSION_SECRET` to a long random secret and configure `ART_GALLERY_ADMIN_PASSWORD`, or retain an existing hashed password in `backend/data/admin-password.json`. First-time password setup is disabled in production. The application can verify password hashes created by the previous PHP version.

## Existing content and uploads

The Next.js backend reads and updates the existing JSON files in `backend/data` and serves existing images from `backend/uploads`. Existing artwork, banners, exhibitions, archive records, team profiles, and admin password settings are retained without a database migration. Keep these folders on persistent, writable storage when deploying; do not place them on an ephemeral filesystem.

The admin dashboard supports first-time setup, sign-in/out, uploading and editing banners, artwork, exhibitions and team members, archiving/restoring artwork, and removing content. Uploads accept JPG, PNG, and WebP images up to 8 MB.

## Routes

- `/` — homepage
- `/about`, `/gallery`, `/archive`, `/contact` — public pages
- `/artwork/[id]`, `/exhibition/[id]` — detail pages
- `/admin` — admin dashboard
- `/api/[action]` — JSON API used by the site and admin

Replace the sample contact details and map location with the gallery's actual information before publishing.
