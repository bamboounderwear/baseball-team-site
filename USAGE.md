# Usage

## Install & Dev
```bash
npm install
npm run build:frontend
# Create D1 + KV and replace IDs in wrangler.jsonc, or run locally with --persist
npm run preview
```

## Seed DB
```bash
# Run initial schema locally
npm run migrate
```

## Admin
Register owner:
```bash
curl -X POST http://localhost:8787/api/admin/register \  -H 'Content-Type: application/json' \  -d '{"email":"owner@example.com","password":"secret"}' -i
```

Set design tokens:
```bash
curl -X POST http://localhost:8787/api/admin/design-tokens \  -H 'Content-Type: application/json' \  -H 'Cookie: admin_token=REPLACEME' \  -d '{"key":"container_max","value":"1000px"}'
```

Create venue:
```bash
curl -X POST http://localhost:8787/api/admin/venue \  -H 'Content-Type: application/json' \  -H 'Cookie: admin_token=REPLACEME' \  -d '{ "name":"Home Field", "config":{"sections":[{"name":"A","basePrice":35,"rowStart":"A","rowEnd":"D","seatsPerRow":10},{"name":"B","basePrice":25,"rowStart":"A","rowEnd":"E","seatsPerRow":12}]}}'
```

Create game (auto-generates tickets from venue config):
```bash
curl -X POST http://localhost:8787/api/admin/games \  -H 'Content-Type: application/json' \  -H 'Cookie: admin_token=REPLACEME' \  -d '{ "slug":"season-opener","title":"Season Opener","date": 1762051200000,"opponent":"Rivals","venueId":1 }'
```

Public:
```bash
curl http://localhost:8787/api/games
curl "http://localhost:8787/api/tickets?gameId=1&section=A"
```

Checkout (demo):
```bash
curl -X POST http://localhost:8787/api/checkout
```
