# Projekt Monitorowania Danych z Czujników (LabVIEW & Vue.js)

Ten projekt umożliwia monitorowanie symulowanych danych z czujników (temperatura, ciśnienie, wilgotność) w czasie, generowanych w środowisku LabVIEW Web Service i wizualizację ich w aplikacji webowej zbudowanej na Vue.js.

## Spis Treści
1. [Przegląd Projektu](#1-przegląd-projektu)
2. [Część LabVIEW](#2-część-labview)
   - [Opis Działania i Konfiguracja (HTTPMethod_2.vi)](#opis-działania-i-konfiguracja-httpmethod_2vi)
   - [Uruchamianie Symulacji LabVIEW](#uruchamianie-symulacji-labview)
3. [Część Vue.js](#3-część-vuejs)
   - [Przetwarzanie Danych](#przetwarzanie-danych)
   - [Struktura Stron (Vue.js)](#struktura-stron-vuejs)
   - [Uruchamianie Aplikacji Vue.js](#uruchamianie-aplikacji-vuejs)
4. [Wymagania Systemowe](#4-wymagania-systemowe)
5. [Rozwój i Konfiguracja](#5-rozwój-i-konfiguracja)

---

## 1. Przegląd Projektu

Projekt składa się z dwóch głównych części:
* **LabVIEW Web Service**: Backend generujący symulowane dane z czujników i udostępniający je poprzez endpoint HTTP.
* **Vue.js Frontend**: Interfejs użytkownika do pobierania i wizualizowania danych z LabVIEW w czasie rzeczywistym w tabeli oraz na wykresach.

## 2. Część LabVIEW

LabVIEW Web Service odpowiada za symulację danych z czujników i ich udostępnianie.

### Opis Działania i Konfiguracja (HTTPMethod_2.vi)

Główny schemat blokowy przedstawia logikę LabVIEW Web Service:
* **Generowanie i Formatowanie Danych**: Dane z czujników (temperatura, ciśnienie, wilgotność) są symulowane przy użyciu funkcji wirtualnej karty DAQ, generującej zniekształcony sygnał sinusoidalny. Wyodrębniane są wartości `Y` (dane czujników) i `t0` (timestamp początkowy) z przebiegu. Timestamp jest następnie formatowany do standardu RFC3339.
* **Serializacja do JSON**: Dane (wartości `Y` i `Timestamp`) są serializowane do formatu JSON. W kodzie LabVIEW widoczne są stałe "temperature", "pressure", "humidity", które prawdopodobnie służą do mapowania danych w odpowiedzi JSON.
* **Nagłówki HTTP i CORS**: Serwis oczekuje na żądania HTTP (GET/OPTIONS). Ustawiane są nagłówki `Access-Control-Allow-Origin` (na `*` lub `http://localhost:8081`) oraz `Access-Control-Allow-Methods` (na `GET, OPTIONS`) w celu umożliwienia komunikacji Cross-Origin (CORS) z aplikacją Vue.js.
* **Ustawienie Typu MIME**: Typ odpowiedzi HTTP jest ustawiany na `text/JSON`.
* **Wysłanie Odpowiedzi**: Wynikowy JSON jest wysyłany jako odpowiedź HTTP.
* **Obsługa Błędów**: Błędy na wyjściach JSON i HTTP są obsługiwane i raportowane.
* **Endpoint LabVIEW Web Service**: Endpoint do pobierania danych to `http://127.0.0.1/WebService1/czujniki/HTTPMethod_2`. Domyślny port dla Web Service w LabVIEW to 80, o ile nie został zmieniony w konfiguracji projektu LabVIEW.

### Uruchamianie Symulacji LabVIEW

1. **Otwórz Projekt LabVIEW**: Otwórz projekt LabVIEW (`FiniteAcqJKI_Lab.lvproj`).
2. **Uruchom Web Service**: W Project Explorerze, znajdź `WebService1` -> `Web Resources` -> `czujniki` -> `HTTPMethod_2.vi`. Upewnij się, że Web Service jest uruchomiony. Możesz to zrobić klikając prawym przyciskiem myszy na `WebService1` i wybierając opcję `Start`.
3. **Sprawdź Dostępność**: Możesz przetestować endpoint, otwierając w przeglądarce adres: `http://127.0.0.1/WebService1/czujniki/HTTPMethod_2`. Powinieneś otrzymać odpowiedź JSON z danymi.

## 3. Część Vue.js

Aplikacja Vue.js służy do wizualizacji danych z LabVIEW Web Service.

### Przetwarzanie Danych

1. **Pobieranie Danych**: Aplikacja Vue.js używa biblioteki `axios` do wysyłania żądań GET do endpointu LabVIEW Web Service (`http://127.0.0.1/WebService1/czujniki/HTTPMethod_2`). Żądania są wysyłane cyklicznie za pomocą `setInterval` (co 1 sekundę).
2. **Skalowanie Danych**: Surowe dane liczbowe (`Y[0]`, `Y[1]`, `Y[2]`) odebrane z LabVIEW są skalowane do bardziej czytelnych zakresów dla temperatury, ciśnienia i wilgotności (np. temperatura z zakresu [-0.2, 1.2] na [20, 25]°C).
3. **Formatowanie Czasu**: Timestamp w formacie RFC3339 jest konwertowany na lokalny czas czytelny dla użytkownika.
4. **Zarządzanie Historią**: Aplikacja utrzymuje bufor ostatnich 10 punktów danych (`historicalData`) w celu wyświetlania wykresów w czasie rzeczywistym.
5. **Wizualizacja**:
   * Dostępne są dwie główne strony: jedna wyświetlająca ostatnie dane numeryczne, a druga trzy osobne wykresy liniowe (dla temperatury, ciśnienia i wilgotności).
   * Wykresy są renderowane za pomocą biblioteki Chart.js. Komponent Vue.js bezpośrednio zarządza instancjami Chart.js, aktualizując je reaktywnie po zmianie danych.
   * Stylizowanie wykresów i interfejsu jest zarządzane za pomocą CSS, z wykorzystaniem globalnych i komponentowych stylów w celu uniknięcia duplikacji.

### Struktura Stron (Vue.js)

* **Strona Główna (`/`)**: Wyświetla ostatnio pobrane dane z czujników w formie tekstowej (`SensorData.vue`).
* **Strona Wykresów (`/chart`)**: Wyświetla trzy osobne wykresy liniowe dla temperatury, ciśnienia i wilgotności (`SensorChart.vue`).

### Uruchamianie Aplikacji Vue.js

1. **Klonowanie Repozytorium (jeśli dotyczy)**:
    ```bash
    git clone https://github.com/Garshers/SensorDataWebPanel.git
    cd <ścieżka-do-folderu-projektu>
    ```
2. **Instalacja Zależności**:
    ```bash
    npm install
    # lub
    yarn install
    ```
3. **Uruchomienie Serwera Deweloperskiego**:
    ```bash
    npm run serve
    # lub
    yarn serve
    ```
    Aplikacja będzie dostępna pod adresem `http://localhost:8080/` (lub innym wskazanym w konsoli jeżeli port :8080 będzie zajęty).

## 4. Wymagania Systemowe

* **LabVIEW**: Wersja LabVIEW 2024 Q3 (lub inna kompatybilna) z zainstalowanym modułem Web Service.
* **Node.js**: Wersja 14.x lub nowsza.
* **npm** (Node Package Manager) lub **Yarn**.
* **Przeglądarka internetowa**: Kompatybilna z Vue.js i Chart.js (np. Chrome, Firefox, Edge).

## 5. Rozwój i Konfiguracja

* **Endpoint LabVIEW**: Jeśli adres IP lub port LabVIEW Web Service się zmieni, zaktualizuj adres URL w plikach `.vue` w funkcji `fetchData` (np. `axios.get('http://127.0.0.1/WebService1/czujniki/HTTPMethod_2')`).
* **Konfiguracja CORS**: W przypadku problemów z CORS upewnij się, że nagłówek `Access-Control-Allow-Origin` w LabVIEW Web Service jest prawidłowo ustawiony na adres URL Twojej aplikacji Vue.js (np. `http://localhost:8080`) lub na `*` dla celów deweloperskich.
* **Max Data Points**: Liczbę punktów danych wyświetlanych na wykresie (`maxDataPoints`) można dostosować w komponencie `SensorChart.vue`.
