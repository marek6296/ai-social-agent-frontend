# Inštalácia a spustenie mobilnej aplikácie

## Čo bolo vytvorené

✅ Expo aplikácia v priečinku `mobile/`
✅ Design systém (`theme.ts`) - farby, spacing, typography zodpovedajúce webu
✅ UI komponenty: Button, Card, Input
✅ Základná štruktúra aplikácie s ukážkou použitia

## Spustenie

```bash
cd mobile
npm install
npx expo start
```

Po spustení sa zobrazí QR kód, ktorý môžeš naskenovať:
- **iOS**: Použi Camera app
- **Android**: Použi Expo Go app
- **Web**: Stlač `w` v termináli
- **iOS Simulator**: Stlač `i` v termináli (vyžaduje Xcode)
- **Android Emulator**: Stlač `a` v termináli (vyžaduje Android Studio)

## Design System

Aplikácia používa rovnaký design systém ako web:
- **Primary farba**: #10b981 (zelená)
- **Dark mode**: Predvolený
- **Font**: Systémový font (Inter-like na iOS/Android)
- **Spacing**: 4px grid systém

## Štruktúra

```
mobile/
├── App.tsx              # Hlavná aplikácia
├── theme.ts             # Design systém
├── components/          # UI komponenty
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── index.ts
├── assets/             # Ikony a obrázky
└── README.md           # Dokumentácia
```

## Ďalšie kroky

1. Integrácia s Supabase (autentifikácia, API)
2. React Navigation (navigácia medzi obrazovkami)
3. Dashboard obrazovka
4. Chat widget
5. Lead management
6. Analytics


