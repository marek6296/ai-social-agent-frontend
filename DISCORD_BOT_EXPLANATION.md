# Prečo je Discord bot neaktívny?

## Aktuálna situácia

1. ✅ **Bot je vytvorený** - v databáze máš uložené informácie o botovi (meno, token, nastavenia)
2. ✅ **Bot je pridaný na server** - cez invite link si ho pridal na Discord server
3. ❌ **Bot je neaktívny** - bot **nič nerobí**, pretože **chýba backend služba**

## Čo to znamená?

Discord bot **NEMÔŽE fungovať len s tokenom v databáze**. Potrebuje:

### 🔄 Nepretržitý proces (service), ktorý:
- Pripojí sa k Discord API pomocou bot tokenu
- Počúva správy a udalosti v reálnom čase
- Spracováva správy (napr. keď niekto napíše správu)
- Generuje odpovede (používa tvoj AI API)
- Posiela odpovede späť do Discord kanálu

**Tento proces musí bežať nepretržite 24/7!**

## Príklad ako to funguje:

```
1. Používateľ napíše na Discord: "Ako to funguje?"
   ↓
2. Discord API pošle event do tvojho bot service
   ↓
3. Bot service zachytí správu
   ↓
4. Bot service zavolá tvoj AI API (/api/chat)
   ↓
5. AI vygeneruje odpoveď
   ↓
6. Bot service pošle odpoveď späť do Discord kanálu
```

## Čo teraz chýba?

Momentálne máš:
- ✅ Databázu s botom
- ✅ Token uložený v databáze
- ✅ Bot pridaný na server
- ❌ **BACKEND SERVICE** - proces, ktorý by počúval Discord API

**Bez backend služby bot nemôže:**
- Počúvať správy
- Reagovať na správy
- Posielať odpovede
- Býť "aktívny"

## Riešenie

Musíme vytvoriť **Discord Bot Backend Service**, ktorý:
1. Načíta bot token z databázy
2. Pripojí sa k Discord API (Discord Gateway)
3. Počúva správy a udalosti
4. Spracováva správy podľa konfigurácie
5. Generuje odpovede pomocou AI API
6. Posiela odpovede do Discord kanálov

Tento service musí bežať **nepretržite** (ako server alebo cloud service).

## Ako to implementovať?

Potrebujeme vytvoriť:
- **Discord bot service** (Node.js + Discord.js)
- **Pripojenie k Discord Gateway**
- **Spracovanie správ**
- **Integráciu s tvojim AI API**

Môžeme to vytvoriť ako:
- Separátny Node.js projekt
- Alebo ako súčasť existujúceho Next.js projektu (serverless functions)

Chceš, aby som začal vytvárať Discord bot backend service?


