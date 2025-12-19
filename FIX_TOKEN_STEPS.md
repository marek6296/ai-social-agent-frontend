# Postup: Oprava tokenu

## Problém
Token bol zašifrovaný s iným encryption key, preto service nemôže dešifrovať token.

## Riešenie - Krok za krokom:

### 1. ✅ Encryption key je už pridaný do .env.local
Vytvoril som `.env.local` s rovnakým encryption key ako v discord-bot-service.

### 2. Reštartuj Next.js aplikáciu
- Zastav Next.js aplikáciu (Ctrl+C)
- Spusti znova: `npm run dev`

### 3. Vytvor nový Discord bot token

**V Discord Developer Portal:**
1. Choď na https://discord.com/developers/applications
2. Vyber svojho bota
3. Sekcia "Bot"
4. Klikni na "Reset Token" alebo vytvor nový token
5. Skopíruj nový token

### 4. Ulož nový token v nastaveniach

**V tvojej aplikácii:**
1. Choď na stránku nastavení bota
2. Vlož nový token do poľa "Bot Token"
3. **Dôležité:** Token musí byť v **plain text** formáte (formát: `XXXX.XXXX.XXXX`)
4. Klikni "Uložiť nastavenia"
5. Token sa automaticky zašifruje so správnym encryption key

### 5. Aktivuj bota
1. Klikni "Aktivovať bota"
2. Počkaj 30 sekúnd
3. Skontroluj logy service - mal by sa zobraziť `✅ Bot is online!`

## Overenie

Po uložení nového tokenu by si mal vidieť v logoch service:
```
🔄 Attempting to login bot dedo Jano...
✅ Bot dedo Jano is online!
   Logged in as: BotName#1234
```

## Tip

Ak sa token stále nepripojí, skontroluj:
- Discord Developer Portal → "Message Content Intent" musí byť ZAPNUTÝ
- Bot musí mať správne permissions na serveri


