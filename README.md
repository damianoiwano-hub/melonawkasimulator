# Melonawka Użytkownik Simulator V7

Wersja V7 rozwija symulator o coroczną galę **Złote Melony** oraz zdarzenia automatyczne bez decyzji.

## Złote Melony
- kariera zaczyna się w roku 2026,
- 52 tygodnie symulatora = 1 rok,
- w każdym roku można przeprowadzić galę dokładnie raz,
- w panelu gali można dodawać dowolnych użytkowników / nominowanych,
- aktywny użytkownik kariery jest nominowany automatycznie,
- kategoria `Użytkownik Roku` jest rozstrzygana całkowicie losowo,
- po gali zapisywany jest pełny ranking i zwycięzca,
- po przejściu do kolejnego roku dostępna jest nowa edycja gali.

## Losowe zdarzenia bez decyzji
Aplikacja posiada osobną bazę `data/automatic-events.json`. Te sytuacje pojawiają się losowo podczas kariery i są rozstrzygane automatycznie — gracz nie dostaje żadnego przycisku decyzji.

Bazę można rozwijać bez modyfikacji kodu. Szczegóły: `data/README_ZDARZENIA_AUTOMATYCZNE.md`.

## Zwykłe eventy
Pozostają w paczkach wymienionych w `data/database.json`. Gracz nie ma dostępu do edytora eventów z poziomu interfejsu.

## Uruchomienie
Uruchom `run.bat`. Wersja lokalna startuje na porcie 8797.

Docelowa domena projektu pozostaje: `https://melonawkasimulator.pl/`.
