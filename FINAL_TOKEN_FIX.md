# FINÁLNE RIEŠENIE: Token problém

## Problém
Token v databáze je zašifrovaný iným encryption key, preto service nemôže dešifrovať token a používa ho ako plain text (hex string bez bodky).

## Riešenie - MUSÍŠ UROBIŤ:

### 1. ✅ Encryption key je pridaný
Pridal som `DISCORD_BOT_TOKEN_ENCRYPTION_KEY` do `.env.local`.

### 2. Reštartuj Next.js aplikáciu
- Zastav Next.js (Ctrl+C)
- Spusti znova: `npm run dev`

### 3. Vytvor NOVÝ Discord bot token

**V Discord Developer Portal:**
1. Choď na: https://discord.com/developers/applications
2. Vyber svojho bota (alebo vytvor nového)
3. Sekcia "Bot"
4. Klikni "Reset Token" alebo "Regenerate Token"
5. **Dôležité:** Zapni "Message Content Intent" (pod "Privileged Gateway Intents")
6. Skopíruj nový token (formát: `MTQ1MTI0...` alebo podobný, obsahuje bodky)

### 4. Ulož NOVÝ token v nastaveniach

**V tvojej aplikácii:**
1. Choď na stránku nastavení bota (`/dashboard/discord-bot/[id]`)
2. V poli "Bot Token" vlož **nový token** (plain text, nie zašifrovaný)
3. Klikni "Uložiť nastavenia"
4. Token sa automaticky zašifruje so správnym encryption key

### 5. Aktivuj bota

1. Klikni "Aktivovať bota"
2. Počkaj 30 sekúnd
3. V logoch service uvidíš: `✅ Bot dedo Jano is online!`

### 6. Overenie

Bot by mal byť teraz:
- ✅ Online na Discord serveri (zelený status)
- ✅ Reagovať na správy (podľa nastavení)
- ✅ Zobraziť status "Aktívny" na stránke

## Prečo to nefungovalo?

1. **Starý token bol zašifrovaný s default encryption key** (Next.js používalo default key)
2. **Service používa iný encryption key** (z `.env` v discord-bot-service)
3. **Dešifrovanie zlyhalo** → service použil zašifrovaný hex string ako plain text token
4. **Discord API odmietlo token** → bot sa nepripojil

## Po uložení nového tokenu:

- Token sa zašifruje so **správnym encryption key**
- Service ho bude môcť **správne dešifrovať**
- Bot sa **pripojí k Discord API**
- Bot bude **fungovať**

---

**Poznámka:** Ak stále nefunguje po uložení nového tokenu, skontroluj:
- Discord Developer Portal → "Message Content Intent" je ZAPNUTÝ
- Bot má správne permissions na serveri
- Service beží a logy neukazujú chyby


