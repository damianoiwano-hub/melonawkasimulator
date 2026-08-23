# Eventy i rozwój kariery — V7.14

## Event jednorazowy

Każdy zwykły albo automatyczny event może otrzymać pole:

```json
{
  "id": "first_post",
  "title": "Pierwszy większy post",
  "oneTime": true
}
```

- `"oneTime": true` — event może zostać rozegrany tylko raz w ramach jednej kariery.
- brak pola albo `"oneTime": false` — event może wrócić w późniejszych tygodniach zgodnie z normalnym systemem losowania.
- stan jednorazowych eventów jest przechowywany osobno od historii. Wyczyszczenie widocznej historii nie pozwala ponownie rozegrać eventu jednorazowego.
- nowa kariera zaczyna z pustą listą rozegranych eventów jednorazowych.

Dla zgodności ze starszymi paczkami manifest może również zawierać `oneTimeEventIds`, ale przy nowych eventach zalecane jest definiowanie `oneTime` bezpośrednio w obiekcie eventu.

## Wyniki decyzji

V7.14 generuje kontekstowy opis reakcji na podstawie kategorii eventu i rodzaju decyzji. Pole `result` nadal może zawierać własny, szczegółowy opis — silnik usuwa powtarzalne stare dopiski i łączy opis z faktycznym wynikiem losowania punktowego.

## Rosnący koszt poziomów

Krzywa poziomów jest konfigurowana w `data/database.json`:

```json
"leveling": {
  "baseXp": 300,
  "growthPerLevel": 75,
  "maxLevel": 50
}
```

Przy tych ustawieniach koszt kolejnych poziomów wynosi:

- LVL 1 → 2: 300 XP
- LVL 2 → 3: 375 XP
- LVL 3 → 4: 450 XP
- LVL 4 → 5: 525 XP
- LVL 5 → 6: 600 XP
- LVL 9 → 10: 900 XP

Łącznie osiągnięcie LVL 10 wymaga 5400 XP zamiast dawnego stałego progu 250 XP na poziom.
