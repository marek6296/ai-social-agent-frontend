# Rýchly štart - Discord Bot Service

## 1. Nastavenie environment variables

Vytvor `.env` súbor v `discord-bot-service/` adresári:

```bash
cd discord-bot-service
cp .env.example .env
```

Vyplň `.env` súbor s týmito hodnotami:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Discord Bot Token Encryption
DISCORD_BOT_TOKEN_ENCRYPTION_KEY=5aaa4ae15d68f9813eb281b6b8f76e6515c83c4232170ed5e81241ef42e51ad3

# Next.js API URL (pre AI chat endpoint)
NEXT_PUBLIC_API_URL=http://localhost:3000
# Alebo pre production:
# NEXT_PUBLIC_API_URL=https://your-domain.com

# Discord Shared Bot (voliteľné)
NEXT_PUBLIC_DISCORD_SHARED_BOT_CLIENT_ID=1451249796861005948
```

**Dôležité:** Použi rovnaké hodnoty ako v hlavnom Next.js projekte (root `.env` súbor).

## 2. Inštalácia závislostí

```bash
npm install
```

## 3. Zostavenie projektu

```bash
npm run build
```

## 4. Spustenie service

### Development mode (s auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## 5. Aktivácia bota v databáze

V Supabase alebo cez web rozhranie nastav v tabuľke `discord_bots`:
- `status = 'active'` pre bota, ktorý má bežať

Service automaticky:
- Načíta všetkých botov so statusom `'active'`
- Pripojí sa k Discord API
- Začne počúvať správy a reagovať

## 6. Overenie, že service beží

Keď service beží správne, uvidíš v konzole:
```
🚀 Starting Discord Bot Service...
=====================================
📋 Found X bot(s) in database, Y active
✅ Initialized bot: Bot Name (bot-id)
✅ Bot Bot Name (bot-id) is online!
   Logged in as: BotName#1234
   Bot ID: 123456789
✅ Discord Bot Service is running!
```

## Troubleshooting

### Bot sa nepripojí
- Skontroluj, či je bot token správny v databáze
- Skontroluj, či má bot správne permissions na Discord serveri
- Skontroluj logy v konzole

### Bot nereaguje na správy
- Skontroluj, či je `auto_reply_enabled = true` v databáze
- Skontroluj, či je `respond_to_mentions = true` alebo `respond_to_all_messages = true`
- Skontroluj, či bot má `Message Content Intent` zapnutý v Discord Developer Portal

### Chyby s AI API
- Skontroluj, či Next.js aplikácia beží na `NEXT_PUBLIC_API_URL`
- Skontroluj, či `/api/chat` endpoint funguje
- Skontroluj network connectivity

## Production Deployment

Pre production nasadenie pozri `DEPLOYMENT.md` súbor.


