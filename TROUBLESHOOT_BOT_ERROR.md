# Riešenie: Bot sa zmení z "aktívny" na "chyba"

## Problém
Bot sa pripojí (status = active), ale po chvíľke sa zmení na "error" a nereaguje na správy.

## Možné príčiny

### 1. Neplatný alebo expirovaný Discord bot token
- Token je nesprávny
- Token expiroval alebo bol resetovaný
- **Riešenie:** Vytvor nový token v Discord Developer Portal

### 2. Bot nemá zapnuté "Message Content Intent"
- Bot nemôže čítať správy bez tohto intentu
- **Riešenie:**
  1. Choď na https://discord.com/developers/applications
  2. Vyber svojho bota
  3. Sekcia "Bot" → zapni "Message Content Intent"

### 3. Token dešifrovanie zlyhalo
- Encryption key je nesprávny
- Token nie je správne zašifrovaný
- **Riešenie:** Znovu ulož token v nastaveniach bota

### 4. Discord API rate limiting
- Príliš veľa požiadavok na Discord API
- **Riešenie:** Počkaj chvíľu a skús znova

### 5. Bot nemá správne permissions na serveri
- Bot nemá práva na čítanie správ
- **Riešenie:** Pridaj bota na server znovu cez invite link s potrebnými permissions

## Postup diagnostiky

### Krok 1: Skontroluj logy service

V termináli, kde beží `npm run dev`, pozri sa na logy:

**Ak vidíš:**
```
🔄 Attempting to login bot...
❌ Failed to login bot...
   Error message: Invalid token
```
→ Token je nesprávny, vytvor nový

**Ak vidíš:**
```
✅ Bot is online!
⚠️ Bot disconnected
❌ Error in bot...
```
→ Bot sa pripojil, ale potom sa odpojil kvôli chybe

### Krok 2: Skontroluj Discord Developer Portal

1. Choď na https://discord.com/developers/applications
2. Vyber svojho bota
3. V sekcii "Bot":
   - ✅ "Message Content Intent" musí byť ZAPNUTÝ
   - ✅ Bot token musí existovať

### Krok 3: Vytvor nový token

1. V Discord Developer Portal, sekcia "Bot"
2. Klikni na "Reset Token" alebo "Regenerate Token"
3. Skopíruj nový token
4. V nastaveniach bota aktualizuj token
5. Ulož nastavenia

### Krok 4: Reštartuj service

```bash
cd discord-bot-service
# Zastav service (Ctrl+C)
npm run build
npm run dev
```

### Krok 5: Aktivuj bota znova

1. Na stránke nastavení bota klikni "Aktivovať bota"
2. Počkaj 1-2 minúty
3. Skontroluj logy - mal by sa zobraziť `✅ Bot is online!`
4. Ak sa zobrazí chyba, pozri sa na error message

## Časté chybové hlášky

### "Invalid token" / "Unauthorized"
- Token je nesprávny alebo expiroval
- **Riešenie:** Vytvor nový token

### "Missing Access" / "Missing Permissions"
- Bot nemá správne permissions
- **Riešenie:** Pridaj bota na server znovu

### "Message Content Intent is required"
- Intent nie je zapnutý
- **Riešenie:** Zapni "Message Content Intent" v Developer Portal

### "Rate limited"
- Príliš veľa požiadavok
- **Riešenie:** Počkaj a skús znova

## Tipy

1. **Vždy zapni "Message Content Intent"** - bez tohto bot nemôže čítať správy
2. **Skontroluj logy service** - tam uvidíš presnú chybu
3. **Ak token nefunguje** - vytvor nový (niekedy tokeny expirujú)
4. **Reštartuj service po zmenách** - zmeny sa aplikujú po reštarte


