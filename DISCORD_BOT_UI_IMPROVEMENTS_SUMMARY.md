# Discord Bot UI Improvements - Summary

## ✅ Implementované zmeny

### 1. Hlavný prepínač režimu (hneď na začiatku)
- **AI odpovede (LLM)** - Bot používa AI na generovanie odpovedí
- **Pravidlá / Šablóny (bez AI)** - Bot odpovedá podľa pravidiel a šablón
- **Hybrid (AI + fallback šablóny)** - Kombinuje AI odpovede s fallback šablónami

### 2. AI Enabled checkbox
- Zobrazuje sa len pre AI/Hybrid režimy
- Kontroluje, či sa zobrazí AI sekcia
- Ak nie je zakliknutý → AI sekcia je disabled/hidden

### 3. Conditional rendering
- **AI Settings** sa zobrazuje len ak `aiEnabled = true`
- **Rules & Commands** placeholder sekcia pre non-AI režimy
- Čistšie, menej preplnené UI

### 4. Quick Presets
- **Support bot** - FAQ + AI odpovede
- **Community bot** - Eventy + Role management
- **Simple bot** - Rules + Commands (bez AI)

### 5. Vylepšené inštrukcie pre kanály/roly
- Info box s inštrukciami, ako získať Channel/Role ID
- Krok za krokom: Developer Mode → Copy ID → Vlož
- Lepšie popisy pre každé pole

## ⚠️ Potrebné DB migrácie

Spusti `DISCORD_BOT_RESPONSE_MODE_MIGRATION.md` v Supabase SQL Editor!

```sql
ALTER TABLE discord_bots
ADD COLUMN IF NOT EXISTS response_mode TEXT DEFAULT 'ai' CHECK (response_mode IN ('ai', 'rules', 'hybrid')),
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;
```

## 📝 Ešte treba implementovať

### 1. Multi-select knowledge sources
- Namiesto single select: checkboxy pre viacero zdrojov naraz
- FAQ, Uploaded files, Custom text, Web/URL
- Podsekcie podľa výberu (FAQ tabuľka, upload, editor)

### 2. Eventy & Interakcie modul
- Event Manager s wizard
- Buttons, Select menus, Modals
- RSVP systémy
- Reminder séria

### 3. Rules Engine UI
- Rules builder (trigger + conditions + action)
- Templates library
- Command builder
- Preview funkcionalita

### 4. Zjednodušený výber kanálov/rolí
- Discord API integrácia (alebo placeholder s lepšími inštrukciami)
- Select komponenty namiesto textarea
- Visual výber kanálov/rolí

## 📁 Zmenené súbory

- ✅ `app/dashboard/discord-bot/[id]/page.tsx` - Reorganizované UI
- ✅ `app/api/discord-bots/[id]/route.ts` - Pridané response_mode a ai_enabled
- ✅ `DISCORD_BOT_RESPONSE_MODE_MIGRATION.md` - DB migrácia

## 🎯 Výsledok

UI je teraz:
- ✅ Prehľadnejšie (conditional rendering)
- ✅ Jednoduchšie pre začiatočníkov (Quick presets, inštrukcie)
- ✅ Menej preplnené (len relevantné sekcie)
- ✅ Lepšie organizované (hlavný prepínač na začiatku)


