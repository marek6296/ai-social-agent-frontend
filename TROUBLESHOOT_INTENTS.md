# Riešenie: "Used disallowed intents" aj keď je Intent zapnutý

## Bot používa správne intenty:
- ✅ `GatewayIntentBits.Guilds`
- ✅ `GatewayIntentBits.GuildMessages`
- ✅ `GatewayIntentBits.MessageContent` ← Toto je potrebné
- ✅ `GatewayIntentBits.GuildMembers`

## Možné príčiny a riešenia:

### 1. Intent sa ešte nepropagoval (najčastejšie)
Discord potrebuje **2-5 minút** na propagáciu zmien.

**Riešenie:**
- Počkaj 3-5 minút od zapnutia intentu
- Reštartuj Discord Bot Service
- Aktivuj bota znova

### 2. Používaš nesprávny bot token
Ak máš viacero botov, uisti sa, že používaš token bota, pre ktorý si zapol Intent.

**Riešenie:**
- Skontroluj v Developer Portal → Bot → Token
- Porovnaj Client ID z tokenu s Client ID v tvojich nastaveniach

### 3. Intent nie je správne uložený
Niekedy sa zobrazuje, že je zapnutý, ale nie je uložený.

**Riešenie:**
- Choď na Developer Portal
- Sekcia "Bot" → "Privileged Gateway Intents"
- Skontroluj, či je "MESSAGE CONTENT INTENT" **skutočne zapnutý** ✅
- Klikni "Save Changes"
- Počkaj 2-3 minúty

### 4. Bot service nebol reštartovaný
Ak si zapol Intent po spustení service, service nevie o zmene.

**Riešenie:**
```bash
cd discord-bot-service
# Zastav service (Ctrl+C)
npm run dev
```

### 5. Overenie v Developer Portal

Skontroluj:
1. Developer Portal → Tvoj bot → Sekcia "Bot"
2. Scroll down k "Privileged Gateway Intents"
3. **"MESSAGE CONTENT INTENT"** musí byť **zapnutý** (modrý toggle)
4. Klikni "Save Changes" ak bol toggle zapnutý, ale zmeny neboli uložené

## Kroky na opravu (v tomto poradí):

1. ✅ Skontroluj v Developer Portal, či je Intent skutočne zapnutý
2. ✅ Klikni "Save Changes" (aj keď si si myslíš, že je uložený)
3. ✅ Počkaj **3-5 minút**
4. ✅ Reštartuj Discord Bot Service
5. ✅ Aktivuj bota znova v nastaveniach
6. ✅ Skontroluj logy - mal by sa zobraziť: `✅ Bot is online!`

## Overenie, že Intent je zapnutý:

V Developer Portal musíš vidieť:
- **"MESSAGE CONTENT INTENT"** → Toggle je **MODRÝ** (zapnutý) ✅
- Nie sivý alebo vypnutý

Ak je Intent skutočne zapnutý a stále to nefunguje po 5 minútach a reštarte service, skontroluj, či používaš správny bot token.


