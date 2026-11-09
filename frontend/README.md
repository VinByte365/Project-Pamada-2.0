# AloeGuard

Aloe vera monitoring app built with Next.js 16. The current backend stores user accounts and saved scan records in MongoDB Atlas. Image diagnosis and NPK sensor readings are not connected; the app labels saved assessments as samples until an analyzer is integrated.

## Local setup

1. Rotate the MongoDB database user's password because its URI was shared in chat. In Atlas, restrict the database user and network access to this app.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` to the rotated connection string. Set a database name in `MONGODB_DB_NAME` if needed.
3. Set `SESSION_SECRET` to a random secret at least 32 characters long.
4. Run `npm run dev` and open http://localhost:3000.

The app creates `users` and `scans` collections in the configured database. Passwords are stored as bcrypt hashes. Sessions use an HTTP-only, same-site cookie. Scan queries are scoped to the signed-in user's MongoDB ID.

## Implemented

- Registration, login, logout, and signed cookie sessions.
- MongoDB connection pooling and environment-based secrets.
- Private dashboard and searchable/filterable scan history.
- Authenticated API routes for reading and saving scan records.
- Explicit messaging when saved results or the future analyzer are unavailable.

The scan endpoint is ready for a disease model to provide a supported diagnosis, confidence score, image reference, and recommendations. It does not infer disease from an uploaded image by itself.
