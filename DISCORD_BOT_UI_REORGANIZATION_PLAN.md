# Discord Bot UI Reorganizácia - Plán

## Fáza 1: Základná štruktúra ✅
- [x] Vytvoriť layout.tsx s ľavým menu
- [x] Vytvoriť DISCORD_BOT_FLOW_SYSTEM_MIGRATION.md

## Fáza 2: Globálne nastavenia (úroveň 1)
Stránka: `/dashboard/discord-bot/[id]`

### Sekcie:
1. **Základné informácie**
   - Bot name
   - Description
   - Bot token (len custom)
   - Bot client ID (len custom)
   - Invite link

2. **Globálne správanie**
   - Režim odpovedania (AI / Rules / Hybrid) - HLAVNÝ PREPÍNAČ
   - Jazyk
   - Timezone
   - Command prefix
   - Default reply mode (reply vs send)
   - Default mention in reply

3. **Globálne limity & ochrana**
   - Message cooldown (globálny)
   - Anti-loop (nereaguj na bota)
   - Anti-spam (max správ/min)
   - Rate limit

4. **Globálne kanály & roly**
   - Allowed channels (globálne)
   - Ignored channels (globálne)
   - Admin roly
   - Logs channel

5. **Status & aktivácia**
   - Bot status
   - Aktivovať/Deaktivovať

## Fáza 3: Modul Odpovedanie
Stránka: `/dashboard/discord-bot/[id]/message-reply`

### Obsah:
- Zoznam flowov pre odpovedanie na správy
- Tlačidlo "+ Pridať flow"
- Každý flow má:
  - Enable toggle
  - Názov
  - Trigger (new_message, mention, keyword, regex)
  - Conditions (kanály, roly, čas, cooldown)
  - Actions (send_message, send_embed, ai_response)

## Fáza 4: Flow Editor (3 taby)
Komponenta: `FlowEditor.tsx`

### Tab 1: Trigger
- Výber typu triggeru
- Konfigurácia podľa typu

### Tab 2: Conditions
- Voliteľné podmienky
- Kanály, roly, čas, cooldown

### Tab 3: Actions
- Výber akcie
- Konfigurácia podľa akcie
- Pre AI: persona, knowledge sources, max tokens

## Fáza 5: Ďalšie moduly
- Welcome & Onboarding
- Plánované správy
- Pravidlá & Auto-odpovede
- Eventy & Interakcie
- Moderácia
- Logy & Diagnostika

## Postup implementácie:

1. ✅ Vytvoriť layout.tsx
2. ⏭️ Refaktorovať page.tsx na globálne nastavenia
3. ⏭️ Vytvoriť FlowEditor komponentu
4. ⏭️ Vytvoriť message-reply stránku
5. ⏭️ Implementovať flow CRUD operácie
6. ⏭️ Vytvoriť ďalšie moduly


