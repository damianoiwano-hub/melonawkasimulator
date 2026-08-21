# Melonawka Simulator V7.10

## Tydzień i eventy

Każdy tydzień kariery zawiera dokładnie **1 event**. Przy losowaniu tygodnia silnik wybiera:

- zwykły event z decyzją, albo
- event automatyczny bez decyzji.

Event automatyczny **zastępuje** zwykły event danego tygodnia i nie jest dodatkowym drugim wydarzeniem. Szansa pozostaje konfigurowana przez `automaticEventChance` w `data/database.json`.

## Złote Melony

Kategorie są zapisane w `data/golden-melons-v710.json`. Każda kategoria losuje 3 nominowanych i 1 zwycięzcę. Wynik jest zapisywany dla danej kariery i roku, więc ponowne otwieranie gali nie wykonuje nowego losowania.

Aktywny gracz otrzymuje mnożnik szans, jeśli jego nick znajduje się w `data/users.txt`. Mnożnik zależy od:

- statystyki Aktywność,
- poziomu kariery,
- aktualnej serii dobrych decyzji.

Wyższa aktywność i poziom zwiększają wagę przy nominacji i wyborze zwycięzcy, ale nie gwarantują nagrody.

## Relacje

Relacje są tworzone na bazie aktualnej listy `data/users.txt`. Każdy kontakt ma wynik od -100 do +100 i status od Wroga do Przyjaciela. Po kolejnych eventach losowo wybrani użytkownicy dostają dodatnie, ujemne albo neutralne zmiany relacji zależne od wyniku wydarzenia.

Relacje są zapisywane osobno dla każdej kariery.

## Sklep

Zakup nie przeładowuje już strony. Stan po zakupie jest przekazywany do aktywnego silnika kariery, dzięki czemu zmienione statystyki i saldo Melonów są używane również przez kolejne eventy.
