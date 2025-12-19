# Oprava: "Used disallowed intents" chyba

## Problém
Bot sa pokúša prihlásiť, ale Discord API odmieta pripojenie s chybou:
```
Error: Used disallowed intents
```

## Riešenie
Bot musí mať povolené **Message Content Intent** v Discord Developer Portal.

### Postup:

1. **Choď na Discord Developer Portal:**
   - https://discord.com/developers/applications
   - Vyber svojho bota (Application)

2. **Sekcia "Bot":**
   - Scroll down k "Privileged Gateway Intents"
   - Zapni **"MESSAGE CONTENT INTENT"** ✅
   - Klikni "Save Changes"

3. **Počkaj 2-3 minúty** (Discord potrebuje čas na aktualizáciu)

4. **Reštartuj Discord Bot Service:**
   ```bash
   cd discord-bot-service
   # Zastav service (Ctrl+C)
   npm run dev
   ```

5. **Aktivuj bota znova:**
   - Choď na stránku nastavení bota
   - Klikni "Aktivovať bota"
   - Počkaj 30 sekúnd
   - V logoch uvidíš: `✅ Bot dedo Jano is online!`

## Dôležité

- **Message Content Intent** je povinný, aby bot mohol čítať obsah správ
- Bez tohto intentu Discord API odmieta pripojenie
- Tento intent musí byť zapnutý v Developer Portal pred pripojením bota

## Ďalšie intenty

Bot používa tieto intenty:
- ✅ Guilds (automaticky povolené)
- ✅ Guild Messages (automaticky povolené)
- ✅ Message Content (MUSÍ BYŤ POVOLENÉ)
- ✅ Guild Members (automaticky povolené)


