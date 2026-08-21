# Osiągnięcia — Melonawka Simulator V7.9

Baza osiągnięć znajduje się w pliku:

`data/achievements-v79.json`

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
  "requirement": "Osiągnij poziom 8.",
  "conditions": [
    {"metric": "level", "operator": "gte", "value": 8}
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
- `autoEventCount`
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
- `difficulty`

Metryki wyliczane:

- `completedWeeks` — liczba ukończonych tygodni,
- `totalDecisions` — suma decyzji pozytywnych i negatywnych,
- `goodRate` — procent pozytywnych decyzji,
- `galaCount` — liczba rozegranych gal,
- `galaNominationCount` — liczba nominacji nicku aktywnej kariery,
- `galaWinCount` — liczba zwycięstw nicku aktywnej kariery,
- `ending` — zakończenie kariery: `moderator` albo `ban`.

## Balans V7.9

Progi osiągnięć są celowo ustawione powyżej maksymalnych parametrów możliwych do wylosowania na starcie kariery. Oznacza to, że osiągnięcia statystyczne trzeba wypracować podczas eventów, zakupów i długiego rozwoju profilu.

Kategoria `HARDCORE` może korzystać z warunku:

```json
{"metric":"difficulty","operator":"eq","value":"hard"}
```

Po zmianie bazy wystarczy zaktualizować plik wskazany przez `achievementsFile` w `data/database.json`.
