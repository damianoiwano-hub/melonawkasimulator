# Procentowe szanse punktowe decyzji — V7.3

Każda z dwóch decyzji w zwykłym evencie ma dwa możliwe wyniki punktowe:

- dodatni (+ PKT),
- ujemny (- PKT).

Przed kliknięciem gracz widzi procent i konkretną liczbę punktów dla obu wariantów. Pozostałe zmiany statystyk (reputacja, zaufanie, aktywność itd.) nadal są ujawniane dopiero po wyborze.

## Automatyczne ustawienia

Jeśli decyzja nie ma własnego `pointChances`, silnik generuje dla niej stały zestaw szans na podstawie ID eventu i etykiety decyzji. Dzięki temu procenty nie zmieniają się przy każdym odświeżeniu.

Domyślnie:

- decyzja rozsądna (`outcome: "positive"`) ma 65–85% szans na dodatnie punkty,
- decyzja ryzykowna (`outcome: "negative"`) ma 20–45% szans na dodatnie punkty.

Zakresy można zmieniać globalnie w `data/database.json` w sekcji `decisionPointDefaults`.

## Własne procenty dla konkretnej decyzji

W dowolnym evencie możesz dodać do decyzji pole:

```json
"pointChances": [
  { "chance": 70, "points": 40 },
  { "chance": 30, "points": -20 }
]
```

Wtedy aplikacja użyje dokładnie tych wartości zamiast automatycznego schematu. Suma nie musi być idealnie równa 100 — aplikacja znormalizuje procenty, ale najlepiej wpisywać łącznie 100.

Przykład pełnej decyzji:

```json
{
  "label": "Odpowiedz spokojnie",
  "result": "Dyskusja kończy się bez większej dramy.",
  "effects": {
    "reputation": 5,
    "trust": 4,
    "score": 30
  },
  "outcome": "positive",
  "pointChances": [
    { "chance": 75, "points": 30 },
    { "chance": 25, "points": -15 }
  ]
}
```

`effects.score` służy jako wartość bazowa tylko wtedy, gdy `pointChances` nie zostało podane. W V7.3 punkty są rozstrzygane przez system procentowy i nie są drugi raz naliczane z `effects.score`.
