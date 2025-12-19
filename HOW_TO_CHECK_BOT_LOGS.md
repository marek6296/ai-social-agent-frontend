# Ako skontrolovať logy Discord Bot Service

## Problém
Bot sa zmení z "aktívny" na "chyba" a nereaguje na správy. Potrebujeme vidieť logy service.

## Kde nájsť logy

### Metóda 1: Terminál, kde beží service

1. **Nájdite terminál, kde beží `npm run dev` v `discord-bot-service/`**
   - Ak ste ho spustili v samostatnom termináli, pozrite sa tam
   - Mala by sa tam zobraziť výstup service

2. **Čo hľadať v logoch:**
   ```
   🚀 Starting Discord Bot Service...
   📋 Found 1 bot(s) in database, 1 active
   🔄 Attempting to login bot BotName (bot-id)...
   ✅ Bot BotName (bot-id) is online!     ← Úspešné pripojenie
   ❌ Failed to login bot...              ← Chyba pri pripojení
   ❌ Error in bot...                     ← Chyba po pripojení
   ```

### Metóda 2: Spusti service v novom termináli

Ak nevidíte logy, spustite service v novom termináli:

```bash
cd discord-bot-service
npm run dev
```

Teraz uvidíte všetky logy v reálnom čase.

### Metóda 3: Skontroluj status v databáze

```bash
cd discord-bot-service
node check-status.js
```

## Čo robiť podľa chyby

### Ak vidíš "❌ Failed to login bot..."
**Error message: Invalid token**
→ Token je nesprávny, vytvor nový v Discord Developer Portal

**Error message: Missing Access / Unauthorized**
→ Bot nemá správne permissions, pridaj bota na server znovu

**Error code: 401**
→ Token je neplatný

**Error code: 403**
→ Bot nemá správne permissions

### Ak vidíš "✅ Bot is online!" ale potom "❌ Error in bot..."
Bot sa pripojil, ale potom nastala chyba:
- Pozri sa na error message
- Možno problém s Message Content Intent
- Možno problém s permissions

### Ak bot nie je v logoch vôbec
- Service možno nebeží
- Skontroluj procesy: `ps aux | grep tsx`
- Reštartuj service

## Najčastejšie problémy

1. **Bot nemá zapnuté "Message Content Intent"**
   - Choď na Discord Developer Portal
   - Zapni "Message Content Intent"

2. **Token je neplatný**
   - Vytvor nový token v Discord Developer Portal
   - Aktualizuj ho v nastaveniach bota

3. **Bot nemá správne permissions**
   - Pridaj bota na server znovu cez invite link
   - Uistite sa, že má všetky potrebné permissions

## Tip

Najlepšie je mať service spustený v samostatnom termináli, aby ste videli logy v reálnom čase.


