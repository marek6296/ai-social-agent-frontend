# Telegram Bot Setup Guide

## Čo musíš urobiť:

### 1. Vytvorenie Telegram bota cez @BotFather

1. **Otvori Telegram** a nájdi `@BotFather` (oficiálny bot od Telegramu na vytváranie botov)

2. **Spusti príkaz `/newbot`**

3. **Postupuj podľa inštrukcií:**
   - Zadaj meno pre bota (napr. "Môj Support Bot")
   - Zadaj username bota (musí končiť na `bot`, napr. `moj_support_bot`)
   - BotFather ti poskytne **Bot Token** (vyzerá takto: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

4. **Ulož si token** - budeš ho potrebovať v dashboarde

5. **(Voliteľné) Nastavenia bota:**
   - `/setdescription` - Popis bota
   - `/setabouttext` - O botovi text
   - `/setuserpic` - Avatar bota
   - `/setcommands` - Nastavenie príkazov (napr. `/start`, `/help`)

6. **DÔLEŽITÉ: Povoliť prístup k správam:**
   - Napíš `/mybots` v @BotFather
   - Vyber svojho bota
   - Klikni na "Bot Settings"
   - Klikni na "Group Privacy"
   - **Vypni "Group Privacy"** (alebo zapni "Turn off" ak je zapnuté)
   - Toto umožní botovi vidieť a spracovávať všetky správy v skupinách
   - Alternatívne, ak chceš aby bot videl správy iba keď je spomenutý, nechaj "Group Privacy" zapnuté

### 2. Pridanie tokenu do dashboardu

1. Choď do **Dashboard → Telegram Bots → Vytvoriť nového bota**
2. Postupuj cez wizard
3. V kroku 4 (Prepojenie) alebo v nastaveniach bota zadaj získaný **Bot Token**
4. Klikni na **"Overiť token"** alebo **"Test pripojenia"** na overenie

### 3. Telegram Bot API

Telegram Bot API je **zdarma** a nevyžaduje žiadnu registráciu okrem vytvorenia bota cez @BotFather.

**API Endpoint:** `https://api.telegram.org/bot<TOKEN>/<METHOD>`

**Dôležité limity:**
- **30 správ za sekundu** na bot
- **20 správ za minútu** na skupinu
- **1 správa za sekundu** na chat (private)

**Webhook vs Long Polling:**
- **Long Polling** (default): Bot periodicky volá API a kontroluje nové správy (jednoduchšie na začiatok)
- **Webhook**: Telegram pošle POST request na tvoj server pri každej novej správe (lepšie pre produkciu)

### 4. Backend Service (pre Telegram bot)

Pre spustenie Telegram bota budeš potrebovať backend service (podobne ako pre Discord boty).

**Struktúra service:**
- Node.js service, ktorý používa `node-telegram-bot-api` alebo `telegraf`
- Číta správy z Telegram API (long polling alebo webhook)
- Spracováva správy podľa nastavení z databázy
- Odpovedá používateľom

**Príklad štruktúry:**
```
telegram-bot-service/
├── src/
│   ├── index.ts          # Main entry point
│   ├── botManager.ts     # Bot instance management
│   ├── messageHandler.ts # Message processing
│   ├── commandHandler.ts # Command processing
│   └── flowProcessor.ts  # Flow execution
├── package.json
└── tsconfig.json
```

### 5. Webhook Setup (voliteľné, pre produkciu)

Ak chceš použiť webhook namiesto long pollingu:

1. **Potrebuješ verejný HTTPS URL** (napr. `https://tvoj-domena.com/api/telegram/webhook`)
2. V nastaveniach bota nastav `webhook_url` a `webhook_enabled = true`
3. Vytvor API endpoint `/api/telegram/webhook` ktorý prijíma POST requesty od Telegramu
4. Volaj Telegram API na nastavenie webhooku:
   ```
   POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=<TUA_URL>
   ```

### 6. Databázová migrácia

**DÔLEŽITÉ:** Pred používaním musíš spustiť SQL migráciu:

1. Choď do Supabase SQL Editor
2. Skopíruj obsah z `TELEGRAM_BOT_MIGRATION.md`
3. Spusti SQL príkaz
4. Over, že tabuľky boli vytvorené:
   - `telegram_bots`
   - `telegram_bot_commands`
   - `telegram_bot_templates`
   - `telegram_bot_integrations`
   - `telegram_bot_logs`

### 7. Environment Variables

Do `.env.local` pridať (ak potrebné):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 8. Testovanie

1. **Test pripojenia:**
   - V nastaveniach bota klikni na "Test pripojenia"
   - Malo by sa zobraziť: "✅ Pripojenie úspešné! Bot: @tvoj_bot_username"

2. **Test správ:**
   - Pošli správu tvojmu botovi na Telegrame
   - Bot by mal odpovedať podľa nastavení

### Odkazy

- **Telegram Bot API dokumentácia:** https://core.telegram.org/bots/api
- **@BotFather:** https://t.me/BotFather
- **node-telegram-bot-api:** https://github.com/yagop/node-telegram-bot-api
- **Telegraf (alternatíva):** https://telegraf.js.org/

### Poznámky

- Bot token je **citlivý údaj** - nikdy ho nezdieľaj a ulož ho šifrovaný v databáze
- Long polling je jednoduchšie na začiatok, webhook je lepšie pre produkciu
- Telegram API má rate limity - respektuj ich
- Pre webhook potrebuješ HTTPS URL (Telegram vyžaduje HTTPS)
