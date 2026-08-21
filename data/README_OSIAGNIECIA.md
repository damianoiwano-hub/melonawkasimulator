# Osiągnięcia — Melonawka Simulator V7.8

Baza osiągnięć znajduje się w pliku:

`data/achievements-v78.json`

Każdy wpis może zawierać:

- `id` — unikalny identyfikator,
- `title` — nazwa osiągnięcia,
- `icon` — emoji/ikona,
- `category` — kategoria wyświetlana w filtrach,
- `rarity` — `common`, `uncommon`, `rare`, `epic` albo `legendary`,
- `description` — opis osiągnięcia,
- `requirement` — tekst warunku widoczny dla gracza,
- `conditions` — techniczne warunki odblokowania.

## Przykład

```json
{
  "id": "example_achievement",
  "title": "Przykładowe osiągnięcie",
  "icon": "🏆",
  "category": "ROZWÓJ",
  "rarity": "rare",
  "description": "Opis osiągnięcia widoczny w kolekcji.",
  "requirement": "Osiągnij poziom 5.",
  "conditions": [
    {"metric": "level", "operator": "gte", "value": 5}
  ]
}
```

## Operatory

- `gte` — wartość większa lub równa,
- `lte` — wartość mniejsza lub równa,
- `gt` — większa,
- `lt` — mniejsza,
- `eq` — dokładna wartość.

Jeżeli `conditions` zawiera kilka warunków, wszystkie muszą zostać spełnione.

## Obsługiwane metryki

Bezpośrednie pola kariery:

- `eventCount`
- `goodChoices`
- `badChoices`
- `streak`
- `level`
- `score`
- `melons`
- `reputation`
- `activity`
- `popularity`
- `controversy`
- `trust`

Metryki wyliczane:

- `completedWeeks` — liczba ukończonych tygodni,
- `totalDecisions` — suma decyzji pozytywnych i negatywnych,
- `goodRate` — procent pozytywnych decyzji,
- `galaCount` — liczba rozegranych gal,
- `galaNominationCount` — liczba nominacji nicku aktywnej kariery,
- `galaWinCount` — liczba zwycięstw nicku aktywnej kariery,
- `ending` — zakończenie kariery: `moderator` albo `ban`.

Po zmianie pliku osiągnięć wystarczy zaktualizować plik w repozytorium. Silnik V7.8 pobiera bazę z pliku wskazanego przez `achievementsFile` w `data/database.json`.
