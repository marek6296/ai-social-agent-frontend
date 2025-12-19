# Oprava: Next.js cache problém a API endpoint 404

## Problém
- Next.js cache je poškodená (chýba `routes-manifest.json`)
- API endpoint `/api/chat` vracia 404
- Stránky sa nenačítajú správne

## Riešenie - POSTUP:

### 1. Zastav Next.js aplikáciu
V termináli, kde beží Next.js:
- Stlač `Ctrl+C` (zastaví aplikáciu)

### 2. Vymaž Next.js cache
```bash
cd /Users/marek/ai-social-agent-frontend
rm -rf .next
```

### 3. Spusti Next.js aplikáciu znova
```bash
npm run dev
```

### 4. Počkaj na kompiláciu
- Next.js sa musí skompilovať (môže to trvať 30-60 sekúnd)
- Počkaj, kým uvidíš "Ready" v termináli
- Skontroluj, či nie sú žiadne error messages

### 5. Overenie, že API funguje
```bash
curl http://localhost:3000/api/chat -X POST -H 'Content-Type: application/json' -d '{"message":"test"}'
```

**Očakávaný výsledok:**
- JSON odpoveď (nie HTML s 404)
- Ak vracia JSON, endpoint funguje ✅

### 6. Skontroluj web stránku
- Otvor: http://localhost:3000/dashboard/discord-bot
- Mala by sa načítať bez chyby

### 7. Otestuj bota na Discord serveri
- Napíš správu na Discord serveri
- Bot by mal odpovedať

---

## Ak problém pretrváva:

1. **Skontroluj, či beží správna Next.js aplikácia:**
   ```bash
   lsof -ti:3000
   ```
   - Mal by zobraziť PID procesu

2. **Skontroluj Next.js terminál pre error messages:**
   - Pozri sa na error messages v termináli
   - Ak sú nejaké chyby, oprav ich

3. **Skontroluj, či sú všetky súbory prítomné:**
   ```bash
   ls -la app/api/chat/route.ts
   ```
   - Mal by existovať súbor

---

## Dôležité poznámky:

- **Cache `.next` MUSÍ byť vymazaná** - bez toho Next.js nebude správne fungovať
- Po vymazaní cache musíš **reštartovať Next.js aplikáciu**
- Kompilácia môže trvať **30-60 sekúnd** pri prvom spustení po vymazaní cache


