# Riešenie duplicitných správ

## Problém
Bot posielal dve identické správy pre každú správu.

## Príčina
Bežali súčasne **viacero procesov** Discord bot služby. Každý proces mal vlastný Discord klient, ktorý prijímal rovnaké správy a každý posielal odpoveď.

## Riešenie
1. **Zastavené všetky duplicitné procesy**
2. **Pridaná ochrana proti viacnásobnému spusteniu**:
   - Lock file mechanizmus (`singleton.ts`)
   - Kontrola pred spustením služby
   - Automatické odstránenie lock file pri ukončení

## Ako spustiť službu

### Metóda 1: Použitie start.sh skriptu (odporúčané)
```bash
cd discord-bot-service
./start.sh
```

### Metóda 2: Priamo cez tsx
```bash
cd discord-bot-service
tsx src/index.ts
```

**Poznámka:** Ak už beží iná inštancia, služba sa nespustí a ukáže sa chyba.

## Ako zastaviť službu

```bash
# Nájdi bežiace procesy
ps aux | grep -i "tsx.*discord-bot-service"

# Zastav všetky procesy
pkill -f "tsx.*discord-bot-service"
```

## Kontrola, či beží služba

```bash
ps aux | grep -i "tsx.*src/index" | grep -v grep
```

Ak sa nič nezobrazí, služba nebeží.

## Lock file

Lock file sa ukladá do `/tmp/discord-bot-service.lock` a obsahuje PID bežiaceho procesu.

Ak máš problém so spustením a si si istý, že žiadna inštancia nebeží, môžeš lock file vymazať:
```bash
rm /tmp/discord-bot-service.lock
```
