# AI Social Agent - Mobilná aplikácia

Kompletná mobilná aplikácia pre AI Social Agent vytvorená pomocou Expo a React Native so všetkými funkciami z webu.

## Funkcie

✅ **Autentifikácia** - Login/Signup  
✅ **Dashboard** - Prehľad s kartami pre všetky sekcie  
✅ **Leads** - Zobrazenie leadov  
✅ **Konverzácie** - Prehľad konverzácií  
✅ **Analytics** - Štatistiky a metriky  
✅ **FAQ** - Správa FAQ položiek  
✅ **Nastavenia bota** - Konfigurácia chatbota  
✅ **Spotreba** - Prehľad použitej spotreby  
✅ **Admin panel** - Pre admin používateľov  
✅ **Môj účet** - Nastavenia účtu  

## Design System

Aplikácia používa rovnaký design systém ako web:
- **Farba primárna**: #10b981 (zelená)
- **Dark mode**: Predvolený režim
- **Font**: Systémový font (Inter-like)
- **Spacing**: 4px grid systém
- **Komponenty**: Button, Card, Input, DashboardCard v rovnakom štýle ako web
- **iOS štýl navigácia**: Bottom tabs s iOS dizajnom

## Nastavenie

1. Skopíruj env premenné z hlavného projektu alebo vytvor `.env` súbor:
```bash
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=https://ai-social-agent-frontend.vercel.app
```

2. Nainštaluj závislosti:
```bash
cd mobile
npm install
```

3. Spusti aplikáciu:
```bash
npx expo start
```

## Dostupné príkazy

- `npm start` - Spustí Expo development server
- `npm run android` - Spustí na Android emulátore/zariadení
- `npm run ios` - Spustí na iOS simulátore/zariadení
- `npm run web` - Spustí web verziu (zobrazí sa ako mobilné okno)

## Štruktúra projektu

```
mobile/
├── App.tsx                 # Hlavná aplikácia s navigáciou
├── theme.ts                # Design systém
├── lib/
│   └── supabase.ts        # Supabase klient
├── components/             # UI komponenty
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── DashboardCard.tsx
│   └── index.ts
├── screens/                # Všetky obrazovky
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── HomeScreen.tsx
│   ├── LeadsScreen.tsx
│   ├── ConversationsScreen.tsx
│   ├── AnalyticsScreen.tsx
│   ├── FAQScreen.tsx
│   ├── BotSettingsScreen.tsx
│   ├── UsageScreen.tsx
│   ├── AdminScreen.tsx
│   ├── MyBotScreen.tsx
│   ├── SettingsScreen.tsx
│   └── index.ts
└── assets/                 # Obrázky a ikony
```

## Navigácia

Aplikácia používa **React Navigation** s:
- **Bottom Tab Navigator** pre hlavné sekcie (Home, MyBot, Settings)
- **Stack Navigator** pre detailné obrazovky
- **Auth Stack** pre login/signup

## API Integrácia

Aplikácia používa rovnaké API endpointy ako web:
- `/api/user/plan` - Informácie o pláne používateľa
- `/api/dashboard/leads` - Načítanie leadov
- Supabase Auth - Pre autentifikáciu

## Stav implementácie

1. ✅ Základná štruktúra a navigácia
2. ✅ Autentifikácia (Login/Signup)
3. ✅ Dashboard s kartami
4. ✅ Všetky obrazovky vytvorené (základná štruktúra)
5. 🔄 Kompletná API integrácia (v procese - niektoré obrazovky majú základné volania)
6. ⏳ Plná funkcionalita všetkých obrazoviek
7. ⏳ Chat widget v mobilnej aplikácii
8. ⏳ Push notifikácie
9. ⏳ Offline podpora
