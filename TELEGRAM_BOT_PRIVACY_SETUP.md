# Telegram Bot Privacy Settings - Riešenie "has no access to messages"

## Problém

Ak bot dostáva chybu "has no access to messages", znamená to, že bot má zapnutý **Group Privacy Mode**, ktorý blokuje prístup k správam v skupinách.

## Riešenie

### Krok 1: Otvor @BotFather
1. Otvor Telegram
2. Nájdi `@BotFather`
3. Napíš `/mybots`

### Krok 2: Vyber svojho bota
1. Zobrazí sa zoznam tvojich botov
2. Klikni na bota, ktorého chceš upraviť

### Krok 3: Nastavenia súkromia
1. Klikni na tlačidlo **"Bot Settings"**
2. Klikni na tlačidlo **"Group Privacy"**
3. Zvoľ jednu z možností:

   **Možnosť A: Bot vidí všetky správy (odporúčané)**
   - Klikni na **"Turn off"** (vypnúť Group Privacy)
   - Bot bude vidieť všetky správy v skupinách
   - Môže reagovať na akúkoľvek správu

   **Možnosť B: Bot vidí iba správy kde je spomenutý**
   - Nechaj **"Turn on"** (zapnuté Group Privacy)
   - Bot uvidí iba správy, kde je explicitne spomenutý (napr. @tvoj_bot)
   - Vhodné pre bota, ktorý má reagovať iba na priame volanie

### Krok 4: Overenie
1. Pridaj bota do testovacej skupiny
2. Pošli správu (alebo spomeni bota, ak má Group Privacy zapnuté)
3. Bot by mal správu vidieť a môcť na ňu reagovať

## Pre súkromné správy (DM)

Group Privacy sa týka **len skupín**. V súkromných správach (DM) bot vždy vidí všetky správy bez ohľadu na toto nastavenie.

## Alternatívne riešenie (cez príkazy)

Namiesto UI môžeš použiť príkazy:

```
/mybots
# Vyber bota (napíš číslo alebo meno)
# Potom napíš číslo pre "Bot Settings"
# Potom napíš číslo pre "Group Privacy"
# Napíš "Turn off" alebo "Turn on"
```

## Poznámky

- **Group Privacy OFF** = Bot vidí všetky správy v skupinách (lepšie pre chatboty)
- **Group Privacy ON** = Bot vidí iba správy kde je spomenutý (lepšie pre utility boty)

Pre AI chatboty odporúčam **vypnúť Group Privacy** (Turn off), aby bot mohol reagovať na akúkoľvek správu používateľa.

