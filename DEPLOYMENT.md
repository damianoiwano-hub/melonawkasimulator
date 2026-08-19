# Publikacja pod melonawkasimulator.pl

Projekt jest przygotowany pod docelowy adres:

**https://melonawkasimulator.pl/**

`http://melonawkasimulator.pl` powinien na hostingu przekierowywać do HTTPS.

## Co jest już przygotowane
- canonical i Open Graph wskazują `https://melonawkasimulator.pl/`,
- `CNAME` dla hostingu obsługującego własne domeny,
- `vercel.json` dla prostego wdrożenia na Vercel,
- `robots.txt` i `sitemap.xml`,
- baza eventów jest oddzielona od kodu i ładowana z `data/database.json`.

## Co trzeba zrobić poza paczką
1. Zarejestrować domenę `melonawkasimulator.pl`, jeśli jest dostępna.
2. Umieścić zawartość tego katalogu na hostingu statycznym.
3. Dodać domenę `melonawkasimulator.pl` w panelu hostingu.
4. Ustawić rekordy DNS zgodnie z wartościami podanymi przez wybrany hosting.
5. Włączyć certyfikat TLS/HTTPS i przekierowanie HTTP -> HTTPS.

Sama paczka nie może zarejestrować domeny ani zmienić DNS u rejestratora.
