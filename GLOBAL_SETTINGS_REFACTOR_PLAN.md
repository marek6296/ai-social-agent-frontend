# Refaktor globálnych nastavení - Plán

## Čo ZACHOVAŤ v globálnych nastaveniach (page.tsx):

### 1. Základné informácie
- Bot name
- Description
- Bot token (len custom)
- Bot client ID (len custom)
- Invite link

### 2. Globálne správanie
- **Režim odpovedania** (AI / Rules / Hybrid) - HLAVNÝ PREPÍNAČ
- Jazyk (SK/CZ/EN...)
- Timezone
- Command prefix
- Default reply mode (reply vs send)
- Default mention in reply

### 3. Globálne limity & ochrana
- Message cooldown (globálny)
- Anti-loop (nereaguj na bota)
- Anti-spam (max správ/min)
- Rate limit per minute

### 4. Globálne kanály & roly
- Allowed channels (globálne)
- Ignored channels (globálne)
- Admin roly
- Logs channel

### 5. Status & aktivácia
- Bot status badge
- Aktivovať/Deaktivovať buttony

---

## Čo PRESUNÚŤ do modulov:

### ❌ Odstrániť (presunúť do message-reply modulu):
- AI settings (persona, do_list, dont_list, answer_style, cta_text)
- Knowledge sources (FAQ, custom text, uploaded files)
- AI enabled checkbox (bude v flows)

### ❌ Odstrániť (presunúť do welcome modulu):
- Welcome message
- Welcome channel
- Welcome embed
- Welcome auto roles
- Welcome DM
- Welcome rules acceptance

### ❌ Odstrániť (presunúť do rules modulu):
- System prompt (bude v flows)
- Tone (bude v flows alebo AI config)

### ❌ Odstrániť (presunúť do message-reply modulu):
- Auto reply enabled
- Respond to mentions
- Respond to all messages
- Respond in threads
- Mention in reply
- (Tieto budú v flows)

---

## Postup:

1. Vytvoriť nový zjednodušený page.tsx
2. Zachovať len globálne nastavenia
3. Odstrániť všetky modulové veci
4. Odkazovať na moduly v layout menu


