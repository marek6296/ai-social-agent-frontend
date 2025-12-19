# Discord Bot Service - Deployment Guide

## Rýchly štart

### Lokálne spustenie (development)

1. **Nainštaluj závislosti:**
```bash
cd discord-bot-service
npm install
```

2. **Vytvor `.env` súbor:**
```bash
cp .env.example .env
```

3. **Vyplň environment variables v `.env`:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DISCORD_BOT_TOKEN_ENCRYPTION_KEY=your_64_char_hex_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Spusti v development režime:**
```bash
npm run dev
```

5. **Alebo zostav a spusti:**
```bash
npm run build
npm start
```

## Production Deployment

### Možnosť 1: Railway.app (odporúčané)

1. **Vytvor účet na Railway.app**
2. **Pripoj GitHub repozitár**
3. **Nastav root directory na `discord-bot-service`**
4. **Pridaj environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DISCORD_BOT_TOKEN_ENCRYPTION_KEY`
   - `NEXT_PUBLIC_API_URL` (URL tvojej Next.js aplikácie)
5. **Railway automaticky deteguje `package.json` a spustí `npm start`**

### Možnosť 2: Render.com

1. **Vytvor účet na Render.com**
2. **Vytvor nový "Web Service"**
3. **Pripoj GitHub repozitár**
4. **Nastav:**
   - **Root Directory:** `discord-bot-service`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. **Pridaj environment variables**
6. **Vyber "Free" tier** (pre testovanie)

### Možnosť 3: VPS s PM2

1. **Pripoj sa na VPS:**
```bash
ssh user@your-vps-ip
```

2. **Nainštaluj Node.js 18+:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Nainštaluj PM2:**
```bash
sudo npm install -g pm2
```

4. **Naklonuj repozitár:**
```bash
git clone your-repo-url
cd ai-social-agent-frontend/discord-bot-service
```

5. **Nainštaluj závislosti:**
```bash
npm install
```

6. **Vytvor `.env` súbor:**
```bash
nano .env
# Vyplň všetky premenné
```

7. **Zostav projekt:**
```bash
npm run build
```

8. **Spusti s PM2:**
```bash
pm2 start dist/index.js --name discord-bot-service
pm2 save
pm2 startup
```

9. **Správa:**
```bash
pm2 logs discord-bot-service  # Logy
pm2 restart discord-bot-service  # Reštart
pm2 stop discord-bot-service  # Zastavenie
```

### Možnosť 4: Docker

1. **Vytvor `Dockerfile` v `discord-bot-service/`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

CMD ["node", "dist/index.js"]
```

2. **Vytvor `.dockerignore`:**
```
node_modules
.env
.git
*.md
src
tsconfig.json
```

3. **Zostav Docker image:**
```bash
docker build -t discord-bot-service .
```

4. **Spusti kontajner:**
```bash
docker run -d \
  --name discord-bot-service \
  --env-file .env \
  --restart unless-stopped \
  discord-bot-service
```

5. **Alebo použij docker-compose:**
```yaml
version: '3.8'
services:
  discord-bot:
    build: .
    restart: unless-stopped
    env_file: .env
```

## Dôležité poznámky

### Environment Variables

Uistite sa, že všetky environment variables sú nastavené:
- `NEXT_PUBLIC_SUPABASE_URL` - URL tvojej Supabase inštancie
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (nie anon key!)
- `DISCORD_BOT_TOKEN_ENCRYPTION_KEY` - 64-char hex string
- `NEXT_PUBLIC_API_URL` - URL tvojej Next.js aplikácie (pre AI API)

### Status botov v databáze

Bot sa spustí len ak má `status = 'active'` v `discord_bots` tabuľke. Ak chcete zastaviť bota, nastavte `status = 'inactive'`.

### Monitoring

Odporúčané:
- PM2 Monitoring (pre VPS)
- Railway/Render dashboard
- Sentry pre error tracking
- Logging service (Winston, Pino)

### Troubleshooting

**Bot sa nepripojí:**
- Skontroluj token v databáze
- Skontroluj encryption key
- Skontroluj Discord Developer Portal

**Bot nereaguje:**
- Skontroluj, či je `auto_reply_enabled = true`
- Skontroluj, či je `status = 'active'`
- Skontroluj logy

**Chyby s AI API:**
- Skontroluj `NEXT_PUBLIC_API_URL`
- Skontroluj, či Next.js aplikácia beží
- Skontroluj network connectivity


