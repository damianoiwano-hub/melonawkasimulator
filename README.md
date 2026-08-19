# Melonawka Użytkownik Simulator V7.2

Wersja V7.2 rozwija symulator o automatyczną, coroczną galę **Złote Melony** oraz zdarzenia automatyczne bez decyzji.

## Złote Melony
- kariera zaczyna się w roku 2026,
- 52 tygodnie symulatora = 1 rok,
- gala uruchamia się **automatycznie w 52. tygodniu każdego roku**,
- użytkowników nie dodaje się z poziomu strony,
- jedynym źródłem puli użytkowników jest `data/users.txt`,
- plik `users.txt` ma format: **jeden nick = jedna linia**,
- system losuje dokładnie **3 nominowanych** do kategorii `Użytkownik Roku`,
- następnie spośród tej trójki losowany jest zwycięzca,
- historia nominacji i zwycięzców jest zapisywana w karierze,
- system stosuje rotację, aby nie powtarzać nominowanych i zwycięzców, dopóki dana pula nie zostanie wykorzystana,
- po wyczerpaniu puli cykl rozpoczyna się ponownie,
- wcześniejsze wyniki gali są zachowywane w zapisie kariery.

### Lista użytkowników
Edytuj:

`data/users.txt`

Przykład:

```text
Iwan111
Melon
Olos
Myszowór
```

Puste linie oraz linie rozpoczynające się od `#` lub `//` są ignorowane. Do przeprowadzenia gali potrzebne są minimum 3 osoby.

## Losowe zdarzenia bez decyzji
Aplikacja posiada osobną bazę `data/automatic-events.json`. Te sytuacje pojawiają się losowo podczas kariery i są rozstrzygane automatycznie — gracz nie dostaje żadnego przycisku decyzji.

## Zwykłe eventy
Pozostają w paczkach wymienionych w `data/database.json`. Każdy zwykły event ma w symulatorze tylko dwa warianty decyzji: pozytywny i negatywny.

## GitHub Pages
Pliki `data/database.json`, `data/users.txt` i `data/automatic-events.json` muszą pozostać w katalogu `data/`. Aplikacja pobiera je bezpośrednio podczas działania strony.

Docelowa domena projektu: `https://melonawkasimulator.pl/`.
