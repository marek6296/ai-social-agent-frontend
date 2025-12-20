# Telegram Bot Troubleshooting Guide

## Bot nereaguje na správy - Kontrolný checklist

### 1. ✅ Spustiť telegram-bot-service

**Kontrola:**
```bash
cd telegram-bot-service
npm run dev  # alebo npm start
```

**Očakávaný výstup:**
```
🚀 Starting Telegram Bot Service...
📦 Loaded 1 active bot(s) from database
🔧 Initializing bot: TvojBot (bot-id)
✅ Bot TvojBot (bot-id) is online!
✅ Telegram Bot Service is running!
```

Ak nevidíš "Bot is online", služba nebeží správne.

---

### 2. ✅ Bot je aktívny v databáze

**Kontrola v Supabase:**
```sql
SELECT id, bot_name, status, connection_status, long_polling_enabled 
FROM telegram_bots 
WHERE bot_name = 'TvojBot';
```

**Musí byť:**
- `status = 'active'` ✅
- `long_polling_enabled = true` ✅
- `connection_status = 'connected'` ✅ (po spustení služby)

**Ak nie je aktívny:**
```sql
UPDATE telegram_bots 
SET status = 'active', long_polling_enabled = true 
WHERE id = 'tvoj-bot-id';
```

---

### 3. ✅ Bot má platný token

**Kontrola:**
- V dashboarde klikni na "Test pripojenia"
- Malo by sa zobraziť: "✅ Pripojenie úspešné! Bot: @tvoj_bot_username"

**Ak token nie je platný:**
1. Choď do @BotFather
2. `/mybots` → vyber bota → "API Token"
3. Skopíruj nový token
4. Vlož ho do dashboardu (Nastavenia → Prepojenie → Bot Token)

---

### 4. ✅ Group Privacy je vypnuté

**Kontrola v @BotFather:**
1. `/mybots` → vyber bota → "Bot Settings" → "Group Privacy"
2. Musí byť **"Turn off"** (vypnuté)

---

### 5. ✅ Nastavenia chat types

**V databáze (alebo dashboarde):**
- `allowed_chat_types` musí obsahovať typ chatu, kde testuješ:
  - Pre súkromné správy: `["private"]`
  - Pre skupiny: `["private", "group"]`
  - Pre všetko: `["private", "group", "channel"]`

**Kontrola:**
```sql
SELECT allowed_chat_types FROM telegram_bots WHERE id = 'tvoj-bot-id';
```

**Ak chceš zmeniť:**
V dashboarde v sekcii "Prepojenie" (alebo priamo v SQL):
```sql
UPDATE telegram_bots 
SET allowed_chat_types = ARRAY['private', 'group']::text[]
WHERE id = 'tvoj-bot-id';
```

---

### 6. ✅ Response Mode a Auto-replies

**Pre AI odpovede:**
- `response_mode = 'ai'` ✅
- `module_auto_replies = true` ✅
- `OPENAI_API_KEY` musí byť nastavené v `.env`

**Pre Rules mode:**
- `response_mode = 'rules'` ✅
- `module_auto_replies = true` ✅ (inak bot nič neodpovie)
- Alebo vytvor príkazy v "Commands" sekcii

**Kontrola:**
```sql
SELECT response_mode, module_auto_replies 
FROM telegram_bots 
WHERE id = 'tvoj-bot-id';
```

---

### 7. ✅ Respond only on mention

**Ak bot nereaguje v skupine:**
- Skontroluj `respond_only_on_mention`:
  - `false` = bot reaguje na všetky správy ✅
  - `true` = bot reaguje iba keď je spomenutý (napr. @tvoj_bot)

**Pre testovanie nastav na `false`:**
```sql
UPDATE telegram_bots 
SET respond_only_on_mention = false 
WHERE id = 'tvoj-bot-id';
```

---

### 8. ✅ Access Mode (Whitelist)

**Ak máš `access_mode = 'whitelist'`:**
- Bot reaguje iba používateľom v `allowed_users` zozname
- Pre testovanie nastav na `'all'`:

```sql
UPDATE telegram_bots 
SET access_mode = 'all' 
WHERE id = 'tvoj-bot-id';
```

---

### 9. ✅ Kontrola logov v službe

**V termináli, kde beží služba, by si mal vidieť:**

**Keď bot dostane správu:**
```
💬 Processing message from user 12345 in chat 67890: Ahoj...
🔍 Chat type check: private, allowed types: private, group
🤖 Response mode: ai, module_auto_replies: true
```

**Ak vidíš len tieto logy ale bot neodpovedá:**
- Skontroluj OpenAI API kľúč
- Skontroluj, či AI odpoveď nie je prázdna

**Ak nevidíš žiadne logy:**
- Bot nedostáva správy (skontroluj Group Privacy, long polling)

---

### 10. ✅ Testovanie

**Odporúčaný postup testovania:**

1. **V databáze nastav základné hodnoty:**
```sql
UPDATE telegram_bots 
SET 
  status = 'active',
  connection_status = 'connected',
  long_polling_enabled = true,
  response_mode = 'ai',
  module_auto_replies = true,
  respond_only_on_mention = false,
  access_mode = 'all',
  allowed_chat_types = ARRAY['private', 'group']::text[]
WHERE id = 'tvoj-bot-id';
```

2. **Reštartuj službu:**
```bash
cd telegram-bot-service
# Ctrl+C na zastavenie
npm run dev  # alebo npm start
```

3. **Pošli správu bota:**
   - V súkromnej správe napíš "Ahoj"
   - Bot by mal odpovedať

---

## Časté chyby

### Chyba: "Bot is not responding"
**Príčiny:**
- Služba nebeží
- `status != 'active'`
- `long_polling_enabled = false`
- Group Privacy je zapnuté

### Chyba: "Bot sees messages but doesn't reply"
**Príčiny:**
- `response_mode = 'rules'` a `module_auto_replies = false`
- `response_mode = 'ai'` ale chýba `OPENAI_API_KEY`
- `respond_only_on_mention = true` ale bot nie je spomenutý
- `allowed_chat_types` neobsahuje typ chatu

### Chyba: "Bot replies only when mentioned"
**Príčina:**
- `respond_only_on_mention = true`
- **Riešenie:** Nastav na `false`

---

## Debugovanie

**Zapni podrobné logy:**
V `telegram-bot-service/src/messageHandler.ts` a `commandHandler.ts` sú už console.log výpisy, ktoré ukazujú, prečo bot neodpovedá.

**Kontrola logov:**
```bash
cd telegram-bot-service
npm run dev  # Sleduj výstup v termináli
```

---

## Rýchle riešenie (pre AI bot)

```sql
UPDATE telegram_bots 
SET 
  status = 'active',
  long_polling_enabled = true,
  response_mode = 'ai',
  module_auto_replies = true,
  respond_only_on_mention = false,
  access_mode = 'all',
  allowed_chat_types = ARRAY['private', 'group']::text[],
  cooldown_seconds = 1,
  response_delay_ms = 0
WHERE id = 'tvoj-bot-id';
```

Potom reštartuj službu a otestuj!

