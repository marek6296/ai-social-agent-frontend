# Discord Bot UI Redesign - Implementation Plan

## Nová štruktúra

### 1. Hlavný prepínač režimu (hneď na začiatku)

```
Režim odpovedania
○ AI odpovede (LLM)
○ Pravidlá / Šablóny (bez AI)  
○ Hybrid (AI + fallback šablóny)

☑ Chcem používať AI generované odpovede
```

- Ak nie je checkbox zakliknutý → AI sekcia disabled/hidden
- Ak je zakliknutý → zobrazí AI nastavenia

### 2. Nová štruktúra stránky

Vľavo menu (sticky):
- Základné info
- Pripojenie
- Správanie
- Režim odpovedania
- AI modul (len ak zapnuté)
- Rules & Commands (len ak non-AI alebo hybrid)
- Eventy & Interakcie
- Logy

Vpravo: obsah sekcie

### 3. Zjednodušený výber kanálov/rolí

Namiesto textarea s IDs:
- Tlačidlo "Vybrať kanály z Discord servera"
- Modal/Select s Discord API integráciou (alebo placeholder s inštrukciami)
- Pre každý kanál/rolu: checkbox alebo tag

### 4. Quick Presets

Hneď na začiatku:
- "Support bot" (FAQ + AI)
- "Community bot" (events + roles)
- "No-AI simple bot" (rules + commands)

### 5. Multi-select zdroj vedomostí

Namiesto single select:
- Checkboxy pre viacero zdrojov
- Podsekcie podľa výberu (FAQ tabuľka, upload, custom text editor)

## Implementation steps

1. ✅ Pridať response_mode state
2. ⏳ Pridať hlavný prepínač režimu
3. ⏳ Reorganizovať UI do sekcií
4. ⏳ Pridať Quick presets
5. ⏳ Zjednodušiť výber kanálov/rolí
6. ⏳ Multi-select knowledge sources


