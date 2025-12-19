# Telegram Bot Service

Backend služba pre spracovanie Telegram botov pre AI Social Agent platformu.

## Požiadavky

- Node.js 18+ 
- npm alebo yarn
- Supabase databáza s Telegram bot tabuľkami
- Telegram Bot Token (získate od @BotFather na Telegrame)
- OpenAI API kľúč (pre AI odpovede)

## Inštalácia

```bash
# Nainštaluj závislosti
npm install

# Vytvor .env súbor (alebo použij existujúci .env z root projektu)
cp ../.env .env.local
```

## Environment Variables

V `.env.local` alebo v root `.env` súbore musíte mať:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY=your_encryption_key (voliteľné)
```

## Spustenie

### Development mode

```bash
npm run dev
```

### Production mode

```bash
# Build
npm run build

# Spustiť
npm start
```

Alebo použite start script:

```bash
./start.sh
```

## Ako to funguje

1. **Načítanie botov**: Služba načíta všetkých aktívnych Telegram botov z databázy (`telegram_bots` tabuľka, `status = 'active'`)

2. **Inicializácia**: Pre každého bota sa vytvorí Telegraf inštancia a nastaví sa long polling

3. **Spracovanie správ**:
   - Príkazy (napr. `/start`, `/help`) sa spracúvajú v `commandHandler.ts`
   - Obyčajné textové správy sa spracúvajú v `messageHandler.ts`

4. **Odpovede**:
   - **Rules mode**: Bot odpovedá len na príkazy a špecifické triggeri
   - **AI mode**: Bot generuje AI odpovede pomocou OpenAI API

5. **Periodické obnovenie**: Každých 30 sekúnd sa obnovia bota z databázy (pre aktualizáciu nastavení)

## Štruktúra

```
telegram-bot-service/
├── src/
│   ├── index.ts              # Hlavný vstupný bod
│   ├── botManager.ts         # Správa bot inštancií
│   ├── messageHandler.ts     # Spracovanie textových správ
│   ├── commandHandler.ts     # Spracovanie príkazov
│   ├── aiClient.ts           # OpenAI API integrácia
│   ├── encryption.ts         # Šifrovanie/deshifrovanie tokenov
│   ├── supabase.ts           # Supabase klient
│   ├── types.ts              # TypeScript typy
│   └── typesInternal.ts      # Interné typy
├── package.json
├── tsconfig.json
└── start.sh                  # Startup script
```

## Funkcie

### Príkazy

- `/start` - Welcome správa (ak je `module_welcome` zapnuté)
- `/help` - Help správa (ak je `module_help` zapnuté)
- Vlastné príkazy - Konfigurovateľné v dashboarde (`telegram_bot_commands` tabuľka)

### Moduly

- Welcome & Onboarding (`module_welcome`)
- Help/FAQ (`module_help`)
- Auto-replies (`module_auto_replies`)
- AI Answers (`module_ai_answers`)

### Bezpečnosť

- Access control (whitelist/all)
- Chat type filtering (private/group/channel)
- Anti-spam ochrana
- Blocked keywords
- Cooldown systémy

## Logovanie

Všetky udalosti sa logujú do `telegram_bot_logs` tabuľky:
- Messages
- Commands
- Errors
- Button clicks

## Troubleshooting

### Bot nereaguje na správy

1. Skontroluj, či je bot aktívny v databáze (`status = 'active'`)
2. Skontroluj, či má bot platný token
3. Skontroluj logy v konzole
4. Over, či je `long_polling_enabled = true` v databáze

### Bot neodpovedá na príkazy

1. Skontroluj, či sú príkazy vytvorené v `telegram_bot_commands` tabuľke
2. Skontroluj `command_trigger` (musí byť presne `/start`, `/help`, atď.)
3. Skontroluj, či má používateľ prístup (whitelist, admin only, atď.)

### AI odpovede nefungujú

1. Skontroluj, či je `OPENAI_API_KEY` nastavené
2. Skontroluj, či je `response_mode = 'ai'` v databáze
3. Skontroluj OpenAI API limity

## Poznámky

- Long polling je default režim (jednoduchšie na začiatok)
- Webhook režim nie je ešte implementovaný (príde v budúcnosti)
- Tokeny sú šifrované v databáze (používa sa AES-256-GCM)
- Service automaticky detekuje nových botov a odpojí neaktívnych

