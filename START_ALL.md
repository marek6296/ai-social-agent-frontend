# Ako spustiť celú aplikáciu

## Možnosť 1: Dva terminály (odporúčané)

### Terminál 1 - Next.js aplikácia (web):
```bash
cd /Users/marek/ai-social-agent-frontend
npm run dev
```

### Terminál 2 - Discord Bot Service:
```bash
cd /Users/marek/ai-social-agent-frontend/discord-bot-service
npm run dev
```

---

## Možnosť 2: Jeden terminál (background process)

### V jednom termináli spusti obe služby:

```bash
# Najprv spusti Next.js aplikáciu na pozadí
cd /Users/marek/ai-social-agent-frontend
npm run dev &

# Potom spusti Discord Bot Service
cd discord-bot-service
npm run dev
```

**Poznámka:** Prvý proces (`npm run dev &`) beží na pozadí, druhý beží na popredí.

**Ak chceš zastaviť:**
- Stlač `Ctrl+C` - zastaví Discord Bot Service
- Pre zastavenie Next.js aplikácie: `kill $(lsof -ti:3000)`

---

## Možnosť 3: Jednoduchý start script

Môžem vytvoriť skript, ktorý spustí obe služby naraz. Chceš to?

---

## Overenie, že všetko beží:

### Next.js aplikácia:
- Otvor prehliadač: http://localhost:3000
- Mala by sa zobraziť tvoja aplikácia

### Discord Bot Service:
- V termináli by si mal vidieť:
  ```
  🚀 Starting Discord Bot Service...
  📋 Found X bot(s) in database, Y active
  ✅ Discord Bot Service is running!
  ```

### Zastavenie:
- **Next.js:** `Ctrl+C` v termináli kde beží (alebo `kill $(lsof -ti:3000)`)
- **Discord Bot Service:** `Ctrl+C` v termináli kde beží


