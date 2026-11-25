# Matrix

A personal 9×9 goal matrix with a daily plan, streaks and a balance view. One goal, eight
directions, a few clear steps every day. Built for one person and hosted entirely on free tiers.

| Part | Stack | Hosting |
| --- | --- | --- |
| [ohtani-frontend](ohtani-frontend) | React, TypeScript, Vite, Tailwind | GitHub Pages |
| [OhtaniApi](OhtaniApi) | ASP.NET Core, EF Core | Render (Docker) |
| Database | PostgreSQL | Neon |

The code is public but the content is not: goals, plan wording and timetable live in the
owner's database row.

## Run it locally

```sh
# API (http://localhost:5255)
cd OhtaniApi
cp appsettings.example.json appsettings.json   # then fill it in
dotnet run

# Frontend (http://localhost:5173)
cd ohtani-frontend
echo "VITE_GOOGLE_CLIENT_ID=your-client-id" > .env.local
npm ci
npm run dev
```

## Check it

```sh
dotnet test OhtaniApi.Tests              # API tests (in-memory SQLite, nothing to set up)
cd ohtani-frontend && npm run check      # lint, tests, build
```

## Configuration

Set these as environment variables on the API host:

| Variable | Purpose |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | Neon connection string. Use `SslMode=VerifyFull`. |
| `Authentication__GoogleClientId` | Google OAuth client id |
| `Authentication__AllowedEmails__0` | The Google account that may sign in. Without it, existing accounts keep working but nobody new can register. |
| `Jwt__Key` | Random, at least 32 bytes: `openssl rand -base64 48` |
| `Jwt__Issuer`, `Jwt__Audience` | Any fixed values |
| `Cors__Origins__0` | The frontend's origin |

## Database changes

Migrations are applied by hand, against whichever database `appsettings.json` points to:

```sh
cd OhtaniApi
dotnet ef database update
```
