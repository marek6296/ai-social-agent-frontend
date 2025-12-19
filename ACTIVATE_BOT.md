# Ako aktivovať Discord bota

## Rýchly postup

**Na stránke nastavení bota klikni na tlačidlo "Aktivovať bota"** - to je všetko! 🎉

## Detailný postup

### 1. Skontroluj, či service beží

Service by mal už bežať (spustili sme ho predtým). Ak nebeží:

```bash
cd discord-bot-service
npm run dev
```

### 2. Aktivuj bota

Na stránke `/dashboard/discord-bot/[id]` (nastavenia tvojho bota):

1. **Klikni na tlačidlo "Aktivovať bota"** (modré tlačidlo v žltom boxe)
2. Počkaj 2-3 sekundy
3. Stránka sa automaticky obnoví
4. Mal by sa zobraziť zelený box s textom "✅ Bot je aktívny"

### 3. Overenie

Bot by mal byť teraz aktívny a service by sa mal automaticky pripojiť k Discord API.

**V konzole service uvidíš:**
```
✅ Initialized bot: BotName (bot-id)
✅ Bot BotName (bot-id) is online!
   Logged in as: BotName#1234
```

**Na stránke uvidíš:**
- Zelený box: "✅ Bot je aktívny"
- Status badge: "Aktívny"

### 4. Ak to nefunguje

1. **Skontroluj, či service beží:**
   ```bash
   cd discord-bot-service
   node check-status.js
   ```

2. **Skontroluj logy service:**
   - Pozri sa do terminálu, kde beží `npm run dev`
   - Mali by tam byť logy o načítaní botov

3. **Skontroluj bot token:**
   - V nastaveniach bota musí byť zadaný platný Discord bot token
   - Token musí byť správne zašifrovaný

4. **Skontroluj Discord Developer Portal:**
   - Bot musí mať zapnuté "Message Content Intent"
   - Bot musí mať správne permissions

## Čo sa deje v pozadí?

1. Klikneš na "Aktivovať bota" → Status sa zmení na `'active'` v databáze
2. Discord Bot Service každých 5 minút kontroluje databázu
3. Keď nájde bota so statusom `'active'`, vytvorí Discord client
4. Pripojí sa k Discord API pomocou bot tokenu
5. Bot sa zobrazí ako online na Discord serveri
6. Bot začne reagovať na správy podľa konfigurácie

## Deaktivácia bota

Ak chceš bota deaktivovať, klikni na tlačidlo "Deaktivovať" v zelenom boxe. Bot sa odpojí od Discord API a prestane reagovať na správy.


