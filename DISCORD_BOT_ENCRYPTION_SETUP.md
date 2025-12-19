# Šifrovanie Discord Bot Tokenov - Návod

## Čo bolo implementované

Vytvoril som systém na šifrovanie Discord bot tokenov pomocou AES-256-GCM šifrovania.

## Komponenty

1. **`lib/encryption.ts`** - Utility funkcie pre šifrovanie/dešifrovanie
2. **`app/api/discord-bots/[id]/route.ts`** - API endpoint, ktorý šifruje tokeny pred uložením a dešifruje ich pri načítaní
3. **Frontend upravy** - Upravené komponenty používajú API endpoint namiesto priameho ukladania

## Nastavenie

### 1. Encryption Key

Do `.env` súboru bol pridaný encryption key:
```
DISCORD_BOT_TOKEN_ENCRYPTION_KEY=5aaa4ae15d68f9813eb281b6b8f76e6515c83c4232170ed5e81241ef42e51ad3
```

**⚠️ DÔLEŽITÉ:**
- Tento kľúč bol generovaný pre development
- V produkcii vygenerujte nový bezpečný kľúč:
  ```bash
  node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'));"
  ```
- Nikdy nezdieľajte tento kľúč
- V produkcii (napr. Vercel) pridajte `DISCORD_BOT_TOKEN_ENCRYPTION_KEY` do environment variables

### 2. Migrácia existujúcich tokenov

Ak už máte tokeny uložené v plain texte v databáze:
- Staré tokeny zostanú v plain texte (kód má fallback)
- Nové tokeny sa automaticky šifrujú pri uložení
- Môžete manuálne "re-save" tokeny cez UI, čím sa automaticky zašifrujú

## Ako to funguje

1. **Ukladanie tokenu:**
   - Používateľ zadá token v UI
   - Frontend pošle token na API endpoint (`PUT /api/discord-bots/[id]`)
   - API endpoint šifruje token pomocou AES-256-GCM
   - Zašifrovaný token sa uloží do databázy

2. **Načítanie tokenu:**
   - Frontend požiada API endpoint (`GET /api/discord-bots/[id]`)
   - API endpoint načíta zašifrovaný token z databázy
   - Dešifruje token
   - Vráti dešifrovaný token (alebo `"***"` ak token už bol zobrazený)

3. **Bezpečnosť:**
   - Token sa nikdy nezobrazuje v plain texte v UI (zobrazuje sa len `"***"`)
   - Šifrovanie používa náhodný IV (initialization vector) pre každý token
   - Encryption key je uložený len na serveri v environment variables

## Testovanie

1. Vytvorte nového Discord bota
2. Zadajte token
3. Uložte nastavenia
4. Token by mal byť v databáze zašifrovaný (hex string, nie plain text)
5. Pri načítaní by sa mal token správne dešifrovať

## Produkcia

Pre produkciu:
1. Vygenerujte nový encryption key
2. Pridajte ho do environment variables v hosting službe (Vercel, atď.)
3. Nikdy necommitnite `.env` súbor s encryption key do git repozitára


