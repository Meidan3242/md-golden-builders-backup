# MD Golden Builders OS

Lead, project and finance management system for MD Golden Builders (San Diego home remodeling).

- [Master build prompt & decisions](docs/MASTER_PROMPT.md)
- Templates: [welcome email](docs/templates/welcome-email.md) · [completion form](docs/templates/completion-form.md)
- [Screenshots of the prototype](docs/screenshots/)

## Run the prototype

```bash
npm install
npm run dev   # http://localhost:3000
npm test      # regression tests (security, permissions, versioning, checklist)
```

The prototype runs on demo data (`src/lib/demo-data.ts`, fictional customers).
Use the **Viewing as** menu in the header to switch between Owner, Office Manager and
Sales Rep and see what each role can access. All data reads go through
`src/lib/data.ts`, which filters by the current user — the same rule will be enforced by
the database (Row-Level Security) when the backend is connected.

## Deploy

Hosted on Vercel (project `md-golden-builders`, framework preset: Next.js). Every push to a
branch gets its own preview URL; the production URL follows `main`.
