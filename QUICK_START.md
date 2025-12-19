# Rýchly štart - Všetko naraz

## Najjednoduchšie (2 terminály)

### Terminál 1:
```bash
cd /Users/marek/ai-social-agent-frontend
npm run dev
```

### Terminál 2:
```bash
cd /Users/marek/ai-social-agent-frontend/discord-bot-service
npm run dev
```

---

## Alebo jeden terminál (skript):

```bash
cd /Users/marek/ai-social-agent-frontend
./start-all.sh
```

Tento skript spustí obe služby - Next.js beží na pozadí, Discord Bot Service na popredí.

---

## Overenie:

1. **Web aplikácia:** http://localhost:3000 (mal by sa otvoriť)
2. **Discord Bot Service:** V termináli uvidíš logy service

---

## Zastavenie:

- **2 terminály:** `Ctrl+C` v každom termináli
- **1 terminál (skript):** `Ctrl+C` - zastaví obe služby


