# Discord Bot Status Tracking

## Problém
Bot je pridaný na Discord server, ale status sa nezobrazuje ako "aktívny" a bot nič nerobí.

## Riešenie

Discord bot backend služba ešte nie je implementovaná. Aby bot fungoval, potrebujeme:

1. **Discord Bot Service** - nepretržitý proces, ktorý:
   - Pripojí sa k Discord Gateway pomocou bot tokenu
   - Počúva správy a udalosti
   - Spracúva správy a generuje odpovede pomocou AI API
   - Posiela odpovede späť do Discord kanálov

2. **Webhook/Interactions Endpoint** - API endpoint pre:
   - Discord Interactions (slash commands, buttons)
   - Webhook events

3. **Status Tracking** - aktualizácia statusu bota:
   - `active` - bot je online a pripojený k Discord API
   - `inactive` - bot nie je pripojený
   - `error` - chyba pri pripojení

## Implementačné možnosti

### Možnosť 1: Separátny Node.js service (odporúčané)
- Vytvoriť samostatný Discord bot service (napr. `discord-bot-service/`)
- Použiť Discord.js knižnicu
- Spustiť ako background service (PM2, Docker, atď.)
- Komunikovať s Next.js API cez HTTP alebo database

### Možnosť 2: Next.js API Routes + Webhook
- Discord môže posielať webhook events
- Menej flexibilné, ale jednoduchšie na začiatok

### Možnosť 3: Serverless Functions (Vercel Functions)
- Vercel Functions pre Discord webhooks
- Obmedzené timeouty, menej vhodné pre nepretržitý service

## Ďalšie kroky

1. Vytvoriť Discord bot service s Discord.js
2. Implementovať správanie podľa konfigurácie z databázy
3. Integrovať s existujúcim `/api/chat` endpointom pre AI odpovede
4. Pridať status tracking (heartbeat/ping mechanism)
5. Aktualizovať UI pre zobrazenie statusu


