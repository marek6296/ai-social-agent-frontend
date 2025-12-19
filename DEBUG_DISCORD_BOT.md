# Debug: Prečo je bot offline na Discord serveri

## Problém
Bot je aktívny v databáze a na webovej stránke, ale na Discord serveri sa zobrazuje ako offline.

## Možné príčiny

### 1. Bot token je nesprávny alebo chýba
- Skontroluj, či je bot token zadaný v nastaveniach bota
- Skontroluj, či token nie je neplatný (token môže expirovať)
- V Discord Developer Portal skontroluj, či bot stále existuje

### 2. Service sa nepripojil k Discord API
- Skontroluj logy service v termináli, kde beží `npm run dev`
- Mala by sa zobraziť správa: `✅ Bot BotName (bot-id) is online!`
- Ak nie, skontroluj chybové hlášky

### 3. Bot nemá správne permissions
- V Discord Developer Portal skontroluj, či má bot zapnuté "Message Content Intent"
- Bot musí mať zapnuté toto intent, inak nemôže čítať správy

### 4. Token dešifrovanie zlyhalo
- Ak token nie je správne zašifrovaný, service nemôže dešifrovať token
- Skontroluj, či `DISCORD_BOT_TOKEN_ENCRYPTION_KEY` v `.env` je správny

## Riešenie

### Krok 1: Skontroluj logy service

V termináli, kde beží service, by si mal vidieť:
```
🚀 Starting Discord Bot Service...
=====================================
📋 Found 1 bot(s) in database, 1 active
✅ Initialized bot: BotName (bot-id)
✅ Bot BotName (bot-id) is online!
   Logged in as: BotName#1234
   Bot ID: 123456789
```

Ak vidíš chyby, pozri sa na nich.

### Krok 2: Skontroluj Discord Developer Portal

1. Choď na https://discord.com/developers/applications
2. Vyber svojho bota
3. Choď na "Bot" sekciu
4. Skontroluj:
   - ✅ **Message Content Intent** musí byť ZAPNUTÝ
   - ✅ Bot token musí existovať
   - ✅ Bot musí byť "Public Bot" (ak nie je private)

### Krok 3: Reštartuj service

Ak robíš zmeny v tokenoch alebo nastaveniach:
```bash
cd discord-bot-service
# Zastav service (Ctrl+C)
npm run dev
```

### Krok 4: Skontroluj bot token v databáze

Môžeš použiť skript:
```bash
cd discord-bot-service
node check-status.js
```

## Časté chyby

### "Invalid token"
- Token je nesprávny alebo expiroval
- Vytvor nový token v Discord Developer Portal
- Aktualizuj token v nastaveniach bota

### "Missing Access" alebo "Missing Permissions"
- Bot nemá správne permissions na serveri
- Pridaj bota na server znovu cez invite link
- Uistite sa, že má bot všetky potrebné permissions

### Bot sa pripojí, ale nereaguje na správy
- Skontroluj, či je "Message Content Intent" zapnutý
- Skontroluj nastavenia správania bota (auto_reply_enabled, respond_to_mentions, atď.)


