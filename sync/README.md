# Nutrition Tracker cloud sync (deployment preparation)

The current website remains unchanged and continues using browser localStorage. These backend files are **not yet deployed**.

## Cloudflare setup

1. In Cloudflare Dashboard, create a D1 database named `nutrition-tracker-db`.
2. Run `schema.sql` against that database in its Console.
3. Create a Worker or update the existing Worker deployment with the `worker.js` sync API handler. **If the existing Worker also serves the website, merge the `/api/sync` route instead of replacing its existing handler.**
4. Bind D1 as `DB`.
5. Add a secret `SYNC_TOKEN` containing a long random value. Do not put the secret in GitHub or browser HTML.
6. Serve the sync API on the same origin as the website (or configure CORS and appropriate access controls).
7. Test GET and PUT with the Authorization header before enabling the client.

The API stores one JSON snapshot per account, with revision-based conflict prevention. A 409 response means the client must reconcile before retrying. It must not silently overwrite remote data.

## Migration safeguards

- Export and preserve the original localStorage data from the phone before any migration.
- The client should explicitly import the phone snapshot as the first remote revision.
- The client should keep local backups, handle offline edits, and show conflict status.
- Do not enable automatic sync until the backend and identity protection are tested.
- A Worker secret alone is insufficient for a publicly shared multi-user service; this setup is for one private account.
