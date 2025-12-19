# Ako skontrolovať, prečo je bot offline

## Rýchly postup

### 1. Skontroluj logy service

V termináli, kde beží `npm run dev` v `discord-bot-service/`, by si mal vidieť:

**Ak bot funguje:**
```
✅ Bot BotName (bot-id) is online!
   Logged in as: BotName#1234
   Bot ID: 123456789
```

**Ak bot nefunguje, uvidíš chyby:**
```
❌ Failed to login bot BotName (bot-id): [chyba]
```

### 2. Najčastejšie príčiny

#### A) Neplatný alebo chýbajúci token
- **Riešenie:** Vytvor nový token v Discord Developer Portal a aktualizuj ho v nastaveniach bota

#### B) Token nie je správne zašifrovaný
- **Riešenie:** Znovu ulož token v nastaveniach bota (token sa automaticky zašifruje)

#### C) Bot nemá zapnuté "Message Content Intent"
- **Riešenie:**
  1. Choď na https://discord.com/developers/applications
  2. Vyber svojho bota
  3. Choď na "Bot" sekciu
  4. Zapni "Message Content Intent" (pod "Privileged Gateway Intents")

#### D) Service sa nespustil správne
- **Riešenie:** Reštartuj service:
  ```bash
  cd discord-bot-service
  # Zastav (Ctrl+C)
  npm run dev
  ```

### 3. Skontroluj status v databáze

```bash
cd discord-bot-service
node check-status.js
```

Malo by ukázať:
- Počet botov v databáze
- Ich statusy (active/inactive/error)
- Ak má bot status "error", znamená to problém s pripojením

### 4. Test pripojenia

Ak máš správny token a intent zapnutý, reštartuj service a pozri sa na logy. Mal by si vidieť:
1. `🔄 Attempting to login bot...`
2. `✅ Bot is online!`

Ak vidíš chybu, pozri sa na error message.

## Potrebné nastavenia pre bot

1. **Discord Developer Portal:**
   - ✅ Message Content Intent ZAPNUTÝ
   - ✅ Bot token existuje
   - ✅ Bot je Public (ak nie je private)

2. **Web rozhranie:**
   - ✅ Bot token je zadaný
   - ✅ Status je "active"
   - ✅ Nastavenia správania sú nakonfigurované

3. **Service:**
   - ✅ Service beží (`npm run dev`)
   - ✅ Environment variables sú správne nastavené
   - ✅ `.env` súbor obsahuje všetky potrebné hodnoty


