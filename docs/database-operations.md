# Database operations

The application uses PostgreSQL through Prisma. These commands are intentionally non-destructive unless explicitly noted.

The local Docker configuration binds PostgreSQL to `127.0.0.1` only. Do not change this to `0.0.0.0` unless the database is intentionally placed behind network access controls.

## Start and inspect the local database

```powershell
docker compose up -d postgres
npm run db:status
npm run db:check
```

The health check verifies connectivity, migration bookkeeping, expected tables, row counts, combo-part integrity, battle winner consistency, and denormalized combo fields. Duplicate combo signatures are reported as warnings because duplicates are not automatically invalid.

## Apply migrations

```powershell
npm run db:deploy
```

Do not use `prisma migrate reset` against an existing database. If a migration failed after creating its objects, inspect the database first and use `prisma migrate resolve --applied <migration-name>` only after confirming the objects exactly match the migration.

## Create a backup

```powershell
npm run db:backup
```

Backups are written to `.local-backups/`, which is ignored by Git. A custom-format dump can be written elsewhere with `--output`:

```powershell
npm run db:backup -- --output C:\secure-backups\beyblade-x.dump
```

The backup command uses `pg_dump` when available and falls back to the `beyblade-x-postgres` Docker container. Set `DATABASE_DOCKER_CONTAINER` when the container has a different name.

## Verify a restore

Restore only into a disposable database or temporary PostgreSQL instance. Never restore over the application database as a health check.

```powershell
createdb beyblade_x_restore_check
pg_restore --clean --if-exists --no-owner --dbname beyblade_x_restore_check C:\secure-backups\beyblade-x.dump
$env:DATABASE_URL = "postgresql://.../beyblade_x_restore_check?schema=public"
npm run db:check
dropdb beyblade_x_restore_check
```

On Windows/Docker, the equivalent `createdb`, `pg_restore`, and `dropdb` commands can be run through `docker exec` against a temporary Postgres container.

## Application health endpoint

`GET /api/health/db` performs a lightweight `SELECT 1` and returns:

- `200 {"status":"ok"}` when the database is reachable.
- `503 {"status":"degraded", "error":"Database unavailable."}` when it is not.

The endpoint deliberately does not expose credentials, schema details, or database version information.
