# Riešenie: Problém s token encryption key

## Problém
Token v databáze je zašifrovaný s iným encryption key než sa používa v discord-bot-service na dešifrovanie.

**Príznaky:**
- Token má 864 znakov (zašifrovaný hex string)
- Neobsahuje bodku (Discord tokeny majú formát XXXX.XXXX.XXXX)
- Dešifrovanie zlyhá
- Service nemôže použiť token

## Riešenie

### Možnosť 1: Použiť rovnaký encryption key (odporúčané)

**1. Skontroluj encryption key v discord-bot-service/.env:**
```bash
cd discord-bot-service
cat .env | grep DISCORD_BOT_TOKEN_ENCRYPTION_KEY
```

**2. Pridaj rovnaký key do Next.js aplikácie:**

Vytvor alebo uprav `.env.local` v hlavnom adresári:
```bash
cd /Users/marek/ai-social-agent-frontend
echo "DISCORD_BOT_TOKEN_ENCRYPTION_KEY=5aaa4ae15d68f9813eb281b6b8f76e6515c83c4232170ed5e81241ef42e51ad3" >> .env.local
```

**3. Reštartuj Next.js aplikáciu**

### Možnosť 2: Vytvoriť nový token a uložiť ho znova

Ak nechceš riešiť encryption keys, môžeš:

1. **Vytvoriť nový token v Discord Developer Portal:**
   - Choď na https://discord.com/developers/applications
   - Vyber svojho bota
   - Sekcia "Bot" → "Reset Token" alebo vytvor nový

2. **Uložiť nový token v nastaveniach bota:**
   - Choď na stránku nastavení bota
   - Vlož nový token do poľa "Bot Token"
   - **Dôležité:** Token musí byť v plain text formáte (nie zašifrovaný)
   - Klikni "Uložiť nastavenia"
   - Token sa automaticky zašifruje správnym key

### Možnosť 3: Vymazať starý token a vytvoriť nový

1. V databáze vymaž alebo nastav `bot_token = NULL`
2. Vytvor nový token v Discord Developer Portal
3. Ulož nový token v nastaveniach bota

## Overenie

Po oprave by si mal vidieť v logoch service:
```
🔄 Attempting to login bot...
✅ Bot is online!
```

Namiesto:
```
❌ Token format looks invalid
❌ Failed to initialize bot
```

## Dôležité

- **Encryption key musí byť rovnaký** v Next.js aplikácii aj v discord-bot-service
- Ak používaš `.env.local`, uisti sa, že je v `.gitignore`
- Reštartuj obe aplikácie po zmene encryption key


