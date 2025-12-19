# Discord Bot Service

Backend service pre Discord boty v AI Social Agent platforme.

## Popis

Tento service spravuje Discord boty - pripojuje sa k Discord API, počúva správy a generuje odpovede pomocou AI API.

## Požiadavky

- Node.js 18+
- Supabase databáza s `discord_bots` tabuľkou
- Environment variables (pozri `.env.example`)

## Inštalácia

1. Nainštaluj závislosti:
```bash
npm install
```

2. Skopíruj `.env.example` do `.env` a vyplň hodnoty:
```bash
cp .env.example .env
```

3. Zostav projekt:
```bash
npm run build
```

## Spustenie

### Development mode (s watch):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## Environment Variables

Pozri `.env.example` pre zoznam potrebných premenných.

## Ako to funguje

1. Service načíta všetky aktívne boty z databázy
2. Pre každého bota vytvorí Discord client a pripojí sa k Discord API
3. Počúva správy na Discord serveroch
4. Keď bot dostane správu (podľa konfigurácie), zavolá AI API
5. Pošle odpoveď späť do Discord kanálu
6. Každých 5 minút refreshne zoznam botov z databázy

## Deployment

Tento service musí bežať nepretržite 24/7. Odporúčané možnosti:

- **Railway.app** - jednoduchý deployment
- **Render.com** - bezplatný tier pre malé projekty
- **VPS** (DigitalOcean, Hetzner, atď.) - s PM2 alebo Docker
- **Docker** - kontajnerizácia pre ľahký deployment

### Príklad s PM2:
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name discord-bot-service
pm2 save
pm2 startup
```

### Príklad s Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## Konfigurácia botov

Boty sa konfigurujú v Supabase databáze v tabuľke `discord_bots`. 

Dôležité polia:
- `status` - musí byť `'active'` aby sa bot spustil
- `bot_token` - Discord bot token (šifrovaný)
- `bot_type` - `'custom'` alebo `'shared'`
- `auto_reply_enabled` - zapnúť/vypnúť automatické odpovede
- `respond_to_mentions` - reagovať na @mention
- `respond_to_all_messages` - reagovať na všetky správy

## Troubleshooting

### Bot sa nepripojí
- Skontroluj, či je `bot_token` správny a dešifrovaný
- Skontroluj, či má bot správne permissions na Discord serveri
- Skontroluj Discord Developer Portal - či je bot aktívny

### Bot nereaguje na správy
- Skontroluj, či je `auto_reply_enabled = true`
- Skontroluj, či je `respond_to_mentions` alebo `respond_to_all_messages` zapnuté
- Skontroluj, či kanál nie je v `ignored_channels`

### Chyby s AI API
- Skontroluj, či `NEXT_PUBLIC_API_URL` ukazuje na správnu Next.js aplikáciu
- Skontroluj, či Next.js aplikácia beží a `/api/chat` endpoint funguje

## Logy

Service loguje všetky dôležité udalosti do konzoly. Pre production odporúčame použiť logging service (napr. Winston, Pino) alebo PM2 logy.


