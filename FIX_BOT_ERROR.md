# Riešenie: Bot je offline a má status "error"

## Problém
Bot má status "error" v databáze a je offline na Discord serveri.

## Možné príčiny

### 1. Neplatný alebo chýbajúci bot token
- Bot token je nesprávny alebo expiroval
- Token nie je správne zašifrovaný
- **Riešenie:** Vytvor nový token v Discord Developer Portal a aktualizuj ho v nastaveniach

### 2. Bot nemá zapnuté "Message Content Intent"
- V Discord Developer Portal musí byť zapnuté "Message Content Intent"
- **Riešenie:**
  1. Choď na https://discord.com/developers/applications
  2. Vyber svojho bota
  3. Choď na "Bot" sekciu
  4. Zapni "Message Content Intent" (pod "Privileged Gateway Intents")

### 3. Service sa nepripojil správne
- Skontroluj logy service v termináli
- **Riešenie:** Reštartuj service:
  ```bash
  cd discord-bot-service
  # Zastav (Ctrl+C)
  npm run dev
  ```

### 4. Token dešifrovanie zlyhalo
- Encryption key je nesprávny
- Token nie je správne zašifrovaný
- **Riešenie:** Znovu ulož token v nastaveniach bota

## Postup riešenia

### Krok 1: Skontroluj logy service

V termináli, kde beží `npm run dev`, by si mal vidieť:
- `🔄 Attempting to login bot...` - pokus o pripojenie
- `✅ Bot is online!` - úspešné pripojenie
- `❌ Failed to login bot...` - chyba pri pripojení

**Ak vidíš chybu, pozri sa na error message a error code.**

### Krok 2: Skontroluj Discord Developer Portal

1. Choď na https://discord.com/developers/applications
2. Vyber svojho bota
3. V sekcii "Bot":
   - ✅ "Message Content Intent" musí byť ZAPNUTÝ
   - ✅ Bot token musí existovať

### Krok 3: Reštartuj service

```bash
cd discord-bot-service
# Zastav service (Ctrl+C v termináli, kde beží)
npm run dev
```

### Krok 4: Aktivuj bota znova

1. Choď na stránku nastavení bota
2. Klikni na "Aktivovať bota"
3. Počkaj 1-2 minúty
4. Skontroluj logy service - mal by sa zobraziť `✅ Bot is online!`

### Krok 5: Ak stále nefunguje

1. Skontroluj, či máš správny token:
   - Vytvor nový token v Discord Developer Portal
   - Aktualizuj ho v nastaveniach bota
   - Ulož nastavenia

2. Skontroluj encryption key:
   - V `.env` súbore musí byť `DISCORD_BOT_TOKEN_ENCRYPTION_KEY`
   - Key musí byť rovnaký ako v hlavnom projekte

3. Skontroluj, či bot má správne permissions na serveri:
   - Pridaj bota na server znovu cez invite link
   - Uistite sa, že má bot všetky potrebné permissions

## Časté chyby

### "Invalid token"
- Token je nesprávny alebo expiroval
- Vytvor nový token a aktualizuj ho

### "Missing Access" / "Missing Permissions"
- Bot nemá správne permissions
- Pridaj bota na server znovu

### "Invalid session"
- Session expirovala
- Reštartuj service

### Token decryption error
- Encryption key je nesprávny
- Znovu ulož token v nastaveniach


