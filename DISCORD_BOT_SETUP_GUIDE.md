# Ako získat Discord Bot Token - Návod

## Krok 1: Vytvorenie Discord Application

1. Choď na **Discord Developer Portal**: https://discord.com/developers/applications
2. Prihlás sa so svojim Discord účtom
3. Klikni na **"New Application"** (tlačidlo vpravo hore)
4. Zadaj názov aplikácie (napríklad "Môj AI Chatbot")
5. Súhlas s podmienkami a klikni **"Create"**

## Krok 2: Vytvorenie Bota

1. V ľavom menu vyber **"Bot"**
2. Klikni na **"Add Bot"** (alebo "Reset Token" ak už bot existuje)
3. Potvrď vytvorenie bota
4. **DÔLEŽITÉ:** Klikni na **"Reset Token"** (alebo "Copy") aby si zobrazil token
5. **ULOŽ SI TOKEN** - zobrazí sa len raz! Ak ho stratíš, budeš musieť vytvoriť nový.

## Krok 3: Získanie Client ID

1. V ľavom menu vyber **"General Information"** (OAuth2)
2. Zobrazí sa **"Application ID"** - toto je tvoj **Client ID**
3. Skopíruj ho

## Krok 4: Nastavenie OAuth2 a Invite Link

1. V ľavom menu vyber **"OAuth2"** → **"URL Generator"**
2. V **"Scopes"** zaškrtni:
   - ✅ `bot`
   - ✅ `applications.commands` (pre slash commands)
3. V **"Bot Permissions"** zaškrtni potrebné oprávnenia:
   - ✅ `Send Messages`
   - ✅ `Read Message History`
   - ✅ `Use Slash Commands`
   - ✅ `Embed Links` (ak chceš formátované správy)
   - ✅ `Attach Files` (ak chceš posielať súbory)
4. V spodnej časti sa vygeneruje **Invite URL**
5. Skopíruj túto URL - použiješ ju na pridanie bota na server

## Krok 5: Pridanie Bota na Server

1. Otvor Invite URL, ktorú si skopíroval
2. Vyber server, na ktorý chceš bota pridať
3. Klikni na **"Authorize"**
4. Potvrď oprávnenia

## Krok 6: Nastavenie v našej aplikácii

1. Choď na nastavenia tvojho Discord bota v našej aplikácii
2. Vlož:
   - **Bot Token** (z Krok 2)
   - **Client ID** (z Krok 3)
3. Ulož nastavenia

## Bezpečnostné poznámky

⚠️ **DÔLEŽITÉ:**
- **NIKDY** nezdieľaj svoj Bot Token verejne
- Token dáva plný prístup k tvojmu botovi
- Ak si token stratíš, resetuj ho v Developer Portáli
- V produkcii by token mal byť šifrovaný (Supabase Vault)

## Časté problémy

**Bot sa nepripája na server:**
- Skontroluj, či máš správny token
- Skontroluj, či má bot správne oprávnenia
- Skontroluj, či je bot online

**Bot neodpovedá na správy:**
- Skontroluj, či má bot oprávnenie "Send Messages"
- Skontroluj, či má bot oprávnenie "Read Message History"


