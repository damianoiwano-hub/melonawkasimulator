# Ekonomia Melonów — V7.4

Konfiguracja znajduje się w `data/database.json`, w sekcji `melonEconomy`.

## Melon Boost

Przed podjęciem decyzji gracz może przeznaczyć Melony na zwiększenie procentowej szansy na dodatni wynik punktowy.

Domyślne warianty:

- 0 Melonów → bez zwiększenia,
- 15 Melonów → +10 punktów procentowych,
- 30 Melonów → +20 punktów procentowych,
- 50 Melonów → +30 punktów procentowych.

Maksymalna końcowa szansa dodatniego wyniku wynosi domyślnie 95%.

Przykład konfiguracji:

```json
"melonEconomy": {
  "goodDecisionRewardChance": 0.45,
  "goodDecisionRewardMin": 0,
  "goodDecisionRewardMax": 20,
  "maxPositiveChance": 95,
  "boosts": [
    {"label": "Bez wsparcia", "cost": 0, "bonus": 0},
    {"label": "+10 p.p.", "cost": 15, "bonus": 10},
    {"label": "+20 p.p.", "cost": 30, "bonus": 20},
    {"label": "+30 p.p.", "cost": 50, "bonus": 30}
  ]
}
```

## Bonus Melonów za dobrą decyzję

`goodDecisionRewardChance: 0.45` oznacza 45% szans na uruchomienie dodatkowego losowania waluty po podjęciu decyzji oznaczonej jako `DECYZJA ROZSĄDNA`.

Jeżeli bonus zostanie uruchomiony, liczba Melonów jest losowana w zakresie od `goodDecisionRewardMin` do `goodDecisionRewardMax`. Domyślnie jest to 0–20 Melonów.

Nie każda dobra decyzja daje walutę.
