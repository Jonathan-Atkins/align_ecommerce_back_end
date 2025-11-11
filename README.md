# align_ecommerce_back_end

Back-end for the Align e-commerce project.

This repository contains the Node.js/Express server and related dev tooling (TypeScript, Jest, Prisma). The project is in active development — this README captures how to install, run and test the code based on the files currently present.

## Contents
- Server built with Express (dependency present in `package.json`)
- Prisma ORM included as a dependency
- TypeScript and test tooling in devDependencies (Jest, ts-jest, supertest, types)

## Prerequisites
- Node.js (v18+ recommended)
- npm (or yarn)
- A database for Prisma (e.g., PostgreSQL) and a DATABASE_URL environment variable if you plan to run migrations or use Prisma

## Install
From the project root:

```bash
npm install
```

After installing, you may need to generate Prisma client files:

```bash
npx prisma generate
```

If you intend to run migrations locally (development DB must be configured):

```bash
# Ensure DATABASE_URL is set (e.g., in a .env file)
# Then run prisma migrate (this will try to apply migrations)
npx prisma migrate dev
```

Note: Running migrations requires a configured database. If you only need the Prisma client for queries, `npx prisma generate` is sufficient.

## Scripts
The `package.json` currently includes a minimal `test` script. You can run:

```bash
npm test
```

There is no `start` script defined yet. If the project uses TypeScript source, common scripts to add are:

```json
"scripts": {
  "start": "node ./dist/index.js",
  "dev": "ts-node src/index.ts",
  "build": "tsc",
  "test": "jest"
}
```

Adjust these to match your project entrypoint (`index.js` or `src/index.ts`).

## Testing
The repository includes Jest, ts-jest and supertest as dev dependencies. Keep tests under a `__tests__` or `tests` folder and run:

```bash
npm test
```

## Environment
Create a `.env` in the project root (not committed) for sensitive configuration such as:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
PORT=3000
```

## Repository / Remote
The `package.json` references:

- Repository: https://github.com/Jonathan-Atkins/align_ecommerce_back_end.git
- Issues: https://github.com/Jonathan-Atkins/align_ecommerce_back_end/issues
- Homepage: https://github.com/Jonathan-Atkins/align_ecommerce_back_end#readme

If `git remote` already contains an `origin` and you want to point it at the GitHub repo above, run:

```bash
# Replace origin URL
git remote set-url origin git@github.com:Jonathan-Atkins/align_ecommerce_back_end.git
# or add a new remote instead of replacing
git remote add upstream git@github.com:Jonathan-Atkins/align_ecommerce_back_end.git
```

## Next steps / TODO
- Add a `start` and `dev` script to `package.json` that match the project's entrypoint
- Add a basic `index.js` or `src/index.ts` with a simple Express server if not already present
- Provide Prisma schema (`prisma/schema.prisma`) and any migrations
- Add documentation for environment variables and local development

## Seeding the database

We provide a runnable seed script at `prisma/seed.js` that upserts two admin users. To run it locally (make sure your `.env` or environment contains `DATABASE_URL`):

```bash
# Optionally export the admin creds you want to use
export SEED_ADMIN1_EMAIL='josh@alignecommerce.com'
export SEED_ADMIN1_PASSWORD='your-admin-password'
export SEED_ADMIN2_EMAIL='jonathanatkins.dev@gmail.com'
export SEED_ADMIN2_PASSWORD='your-admin-password'

# Apply schema (push) and generate client
npx prisma db push
npx prisma generate

# Run the seed script
npm run prisma:seed
```

Note: The repository contains both `prisma/seed.ts` (TypeScript source) and `prisma/seed.js` (runnable). The TypeScript source may be removed; `prisma/seed.js` is the canonical script used by `npm run prisma:seed`.

## Integration tests

We include integration tests for `/auth/login` that validate seeded admin credentials can log in and access protected admin endpoints. These tests read `SEED_ADMIN1_EMAIL` and `SEED_ADMIN1_PASSWORD` from environment variables and will be skipped if those are not set.

To run integration tests locally, ensure your `.env` has `DATABASE_URL` and set the seed admin env vars as above, then run:

```bash
npx jest tests/auth.integration.test.ts --runInBand
```

## GitHub Actions & secrets

The repo contains two workflows:
- `.github/workflows/ci.yml` — runs unit tests and generates the Prisma client on push/PR.
- `.github/workflows/integration.yml` — runs integration tests, applies schema and seeds the DB. This workflow requires repository secrets.

Add the following repository secrets in GitHub (Settings → Secrets and variables → Actions → New repository secret):

- `DATABASE_URL` — your Neon/Postgres connection string
- `SEED_ADMIN1_EMAIL` and `SEED_ADMIN1_PASSWORD` — credentials for the seeded admin used by integration tests
- `SEED_ADMIN2_EMAIL` and `SEED_ADMIN2_PASSWORD` — optional second admin
- `JWT_SECRET` — the JWT secret used to sign tokens (should match the secret used by the server)

Once secrets are set, integration workflow runs will be able to apply schema, seed data and execute the integration tests.


## License
The project `package.json` lists the license as ISC.

---

If you'd like, I can also:
- add a `start`/`dev` script in `package.json` (I can update it now),
- create a minimal `src/index.ts` Express starter, or
- create a `.env.example` with typical variables.

Which of those would you like next?