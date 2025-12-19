# URGENTNÉ: Token je neplatný - musíš zadať nový!

## Problém
Token v databáze je **neplatný** - dešifrovanie síce prebehlo, ale výsledok nie je platný Discord token (864 znakov bez bodky). To znamená, že token bol zašifrovaný s iným encryption key alebo je poškodený.

**Service teraz správne odmietne tento neplatný token a nastaví status na "error".**

## Riešenie - MUSÍŠ UROBIŤ:

### 1. ✅ Service je opravený
Service teraz správne detekuje neplatné tokeny a odmieta ich.

### 2. Vytvor NOVÝ Discord bot token

**V Discord Developer Portal:**
1. Choď na: https://discord.com/developers/applications
2. Vyber svojho bota (alebo vytvor nového)
3. Sekcia "Bot"
4. Klikni **"Reset Token"** alebo **"Regenerate Token"**
5. **Dôležité:** Zapni **"Message Content Intent"** (pod "Privileged Gateway Intents")
6. Skopíruj nový token (formát: `MTQ1MTI0...XXXX.XXXX.XXXX`, obsahuje **bodky**)

### 3. Ulož NOVÝ token v nastaveniach

**V tvojej aplikácii:**
1. Choď na stránku nastavení bota (`/dashboard/discord-bot/[id]`)
2. V poli **"Bot Token"** vlož **NOVÝ token** (plain text, obsahuje bodky)
3. Klikni **"Uložiť nastavenia"**
4. Token sa automaticky zašifruje so správnym encryption key

### 4. Aktivuj bota

1. Klikni **"Aktivovať bota"**
2. Počkaj 30 sekúnd (service kontroluje každých 30 sekúnd)
3. V logoch service uvidíš: `✅ Bot dedo Jano is online!`

## Prečo to nefungovalo?

1. **Starý token bol zašifrovaný s iným encryption key** (alebo nesprávne)
2. **Dešifrovanie síce prebehlo**, ale výsledok bol neplatný (864 znakov hex string)
3. **Service použil tento neplatný token** a Discord API ho odmietlo
4. **Bot sa nepripojil**

## Po uložení nového tokenu:

- ✅ Token sa zašifruje so **správnym encryption key**
- ✅ Service ho bude môcť **správne dešifrovať**
- ✅ Token bude mať **správny formát** (obsahuje bodky, 50-100 znakov)
- ✅ Bot sa **pripojí k Discord API**
- ✅ Bot bude **fungovať**

---

**Poznámka:** Service teraz správne validuje tokeny a odmieta neplatné. Ak token nevyzerá ako platný Discord token, service ho odmietne a nastaví status na "error" - to je správne správanie.


