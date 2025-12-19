# Discord Bot Settings Implementation Status

## ✅ Hotovo

### 1. Databázová migrácia
- ✅ Vytvorená kompletná migrácia (`DISCORD_BOT_COMPLETE_MIGRATION.md`)
- ✅ Zahŕňa všetky moduly: základné, AI chat, moderácia, welcome, role management, events, tickets, announcements, utility
- ⚠️ **Poznámka:** Migráciu je potrebné spustiť v Supabase SQL Editor!

### 2. Typescript Types
- ✅ Rozšírené `DiscordBot` interface v `discord-bot-service/src/types.ts`
- ✅ Pridané všetky nové polia

### 3. UI - Základné nastavenia
- ✅ Jazyk bota (SK/CZ/EN/NO)
- ✅ Časové pásmo
- ✅ Cooldown medzi odpoveďami
- ✅ Maximálna dĺžka odpovede (tokeny)

### 4. UI - Rozšírené AI Chat nastavenia
- ✅ Zdroj vedomostí (none/faq/uploaded/custom)
- ✅ AI Persona (kto si)
- ✅ Do list (čo bot MÁ robiť)
- ✅ Don't list (čo bot NEMÁ robiť)
- ✅ Štýl odpovedí (short/medium/long/bullet_points/paragraph)
- ✅ Call-to-action (CTA) text

### 5. Backend API
- ✅ API endpoint `/api/discord-bots/[id]` rozšírený o nové stĺpce
- ✅ Ukladanie všetkých nových nastavení

### 6. AI API Integration
- ✅ System prompt používa nové nastavenia (persona, do/don't list, answer style)
- ✅ max_tokens používa nastavenie z DB
- ✅ CTA text sa pridáva do system promptu
- ✅ Vylepšený system prompt s lepším kontextom

### 7. Debug a opravy
- ✅ Pridané debug logy pre response logic
- ✅ Opravená logika pre `respond_to_all_messages`

## ⚠️ Čo ešte treba implementovať

### 1. Databáza
- [ ] **SPUSTIŤ migráciu** `DISCORD_BOT_COMPLETE_MIGRATION.md` v Supabase SQL Editor!
- [ ] Overiť, že všetky stĺpce existujú

### 2. UI - Chýbajúce základné nastavenia
- [ ] Command prefix (slash-only vs custom prefix)
- [ ] Allowed channels (multi-select Discord channels)
- [ ] Ignored channels (multi-select Discord channels)
- [ ] Admin roly (multi-select Discord roles)
- [ ] Logs channel (Discord channel selector)

### 3. UI - Moderácia modul
- [ ] Automod toggles (anti-spam, anti-invite, anti-scam, anti-NSFW, anti-mention spam, caps filter, duplicate filter)
- [ ] Tresty (warn, timeout, delete, kick, ban)
- [ ] Warn limits → timeout/kick/ban
- [ ] Whitelist roly a kanály
- [ ] Appeal link

### 4. UI - Welcome/Goodbye modul
- [ ] Welcome message (text + embed builder)
- [ ] Goodbye message
- [ ] Auto-assign roly pri vstupe
- [ ] Rules acceptance (verification)
- [ ] Welcome DM

### 5. UI - Role Management
- [ ] Role panels vytvorenie a správa
- [ ] Role groups (emoji reactions, buttons, select menus)

### 6. UI - XP/Levels/Economy
- [ ] XP nastavenia (per message, cooldown, voice time)
- [ ] Level rewards (role assignments)
- [ ] Leaderboard channel
- [ ] Economy settings (coins, daily reward, shop)

### 7. UI - Events modul
- [ ] Event creation wizard
- [ ] RSVP settings
- [ ] Reminder templates
- [ ] Event management (zoznam, editácia, zrušenie)

### 8. UI - Tickets/Support
- [ ] Ticket panel setup
- [ ] Ticket categories
- [ ] Support roly
- [ ] Auto-close nastavenia
- [ ] Transcript export

### 9. UI - Announcements
- [ ] Announcement creation
- [ ] Schedule (once/repeating)
- [ ] Templates

### 10. Backend - Discord Bot Service
- [ ] Implementovať logiku pre všetky nové moduly
- [ ] Moderácia automod
- [ ] Welcome/goodbye handlers
- [ ] Role management handlers
- [ ] XP/Levels tracking
- [ ] Events RSVP handling
- [ ] Tickets creation a management
- [ ] Announcements scheduler

### 11. Discord Bot Service - AI Integration
- [ ] Použiť `message_cooldown_seconds` v response logic
- [ ] Použiť `max_response_tokens` v AI calls (už implementované v API)
- [ ] Implementovať knowledge source (FAQ, uploaded files)

## Priorita implementácie

### Vysoká priorita (pre AI bot fungovanie)
1. ✅ Základné AI nastavenia (persona, do/don't list, answer style) - **HOTOVO**
2. ✅ Použitie nastavení v AI API - **HOTOVO**
3. [ ] Allowed/ignored channels (pre lepšiu kontrolu, kde bot reaguje)
4. [ ] Message cooldown implementácia v bot service

### Stredná priorita (často žiadané)
5. [ ] Welcome/Goodbye modul
6. [ ] Role management
7. [ ] Events modul
8. [ ] Tickets modul

### Nízka priorita (nice to have)
9. [ ] Moderácia automod (komplexné, vyžaduje Discord.js permissions)
10. [ ] XP/Levels/Economy
11. [ ] Announcements
12. [ ] Utility moduly (polls, forms, giveaways, etc.)

## Ako pokračovať

1. **SPUSTIŤ migráciu** v Supabase SQL Editor (`DISCORD_BOT_COMPLETE_MIGRATION.md`)
2. Otestovať existujúce nastavenia (respond_to_all_messages by teraz malo fungovať)
3. Postupne implementovať ďalšie moduly podľa priority
4. Pre každý modul:
   - Pridať UI komponenty do `app/dashboard/discord-bot/[id]/page.tsx`
   - Rozšíriť API endpoint `/api/discord-bots/[id]`
   - Implementovať logiku v `discord-bot-service/src/`

## Súbory, ktoré boli zmenené

- ✅ `DISCORD_BOT_COMPLETE_MIGRATION.md` (nový - kompletná migrácia)
- ✅ `discord-bot-service/src/types.ts` (rozšírené types)
- ✅ `discord-bot-service/src/messageHandler.ts` (debug logy)
- ✅ `app/dashboard/discord-bot/[id]/page.tsx` (rozšírené UI)
- ✅ `app/api/discord-bots/[id]/route.ts` (rozšírené API)
- ✅ `app/api/chat/discord/route.ts` (vylepšený system prompt)


