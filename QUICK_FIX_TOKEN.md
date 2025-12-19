# Rýchle riešenie problému s tokenom

## Problém
Token bol zašifrovaný s iným encryption key. Service nemôže dešifrovať token a používa ho ako plain text, čo nie je správne.

## Riešenie - 3 kroky:

### 1. ✅ Encryption key je už pridaný
Pridal som `DISCORD_BOT_TOKEN_ENCRYPTION_KEY` do `.env.local`.

### 2. Reštartuj Next.js aplikáciu
**V termináli, kde beží Next.js:**
- Stlač `Ctrl+C` (zastaví)
- Potom: `npm run dev` (znova spustí)

### 3. Vytvor a ulož NOVÝ token

**A) Vytvor nový token v Discord Developer Portal:**
1. Choď na: https://discord.com/developers/applications
2. Vyber svojho bota
3. Sekcia "Bot" → "Reset Token" alebo vytvor nový
4. Skopíruj token (formát: `MTQ1MTI0...` alebo podobný)

**B) Ulož nový token v nastaveniach:**
1. Choď na stránku nastavení bota
2. Vlož nový token do poľa "Bot Token"
3. Klikni "Uložiť nastavenia"
4. Token sa automaticky zašifruje so správnym key

**C) Aktivuj bota:**
1. Klikni "Aktivovať bota"
2. Počkaj 30 sekúnd
3. V logoch service uvidíš: `✅ Bot is online!`

## Dôležité

- **Token musí byť v plain text formáte** keď ho vkladáš (nie zašifrovaný)
- Token má formát: `XXXX.XXXX.XXXX` alebo podobný
- Po uložení sa automaticky zašifruje

## Prečo to nefungovalo?

- Starý token bol zašifrovaný s default encryption key
- Service používa iný encryption key
- Dešifrovanie zlyhalo
- Service použil zašifrovaný hex string ako plain text token (nesprávne)

Teraz, keď uložíš nový token, bude zašifrovaný so správnym key a service ho bude môcť správne dešifrovať.


