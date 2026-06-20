# BokaBarber: Fleranvändarplattform för Frisörsalonger (SaaS Backend)

Detta är det färdiga och fullt implementerade backend-systemet för **BokaBarber**, skrivet i **TypeScript**, **Node.js** och **Express**, med **MongoDB** och **Mongoose** som databaslager.

Systemet levereras med fullt stöd för **multi-tenant-arkitektur**, strikt **dataisolering** (Tenant-Based Access Control) och en **transaktionsbaserad bokningsmotor** för att tillförlitligt stoppa dubbelbokningar.

---

## 🚀 Kom igång snabbt

Följ dessa steg för att installera beroenden, så databasen med planer och testsalongen, samt starta servern lokalt.

### 1. Installera beroenden
Navigera till `backend/` och installera alla Node-moduler:
```bash
cd backend
npm install
```

### 2. Konfigurera miljövariabler (`.env`)
Skapa en `.env`-fil i `backend/`-katalogen:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=boka_barber_ultra_secure_secret_key_2026
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/bokabarber?appName=Cluster0
```
*(Anslutningssträngen till ditt MongoDB Atlas-kluster kan konfigureras här, eller så kan du använda en lokal databasanslutning!)*

### 3. Så databasen (Seed)
Vi har skapat ett databassådd-skript för att konfigurera prenumerationsplaner (Bas och Professional) samt en testsalong ("Royal Cuts") med tillhörande arbetstider, tjänster och en testfrisör. 

Kör följande kommando i `backend/` för att populera din MongoDB Atlas-databas:
```bash
npx ts-node src/scripts/seed.ts
```

### 4. Starta servern i utvecklingsläge
Kör servern med automatisk omstart (ts-node-dev):
```bash
npm run dev
```
Servern kommer att starta på: `http://localhost:5000`

---

## 🛠️ Arkitektur & Funktioner som har byggts

1.  **Strikta Scheman (`backend/src/models/Schemas.ts`)**:
    *   Samtliga 13 databasmodeller är starkt typade i TypeScript.
    *   Compound-indexering på `shopId` på samtliga transaktionella data för att säkra isolering.
    *   Ett unikt compound-index på `(barberId, startTime, endTime, status)` för att omöjliggöra dubbelbokning i databasen.
2.  **Säker Autentisering (`backend/src/middleware/auth.ts`)**:
    *   Custom JWT-validering med läsning från säkra `httpOnly`-cookies samt `Bearer Authorization`-headers.
    *   **RBAC (Role-Based Access Control)**: Enkelt att låsa endpoints till `super_admin`, `shop_admin`, `barber` och `customer`.
    *   **TBAC (Tenant-Based Access Control)**: Middleware som verifierar att `shopId` i anropet matchar det som är krypterat i användarens JWT-token. Super Admins förbikopplar detta automatiskt.
    *   **Prenumerationsskydd**: Om en salongs prenumerationsstatus är `suspended` blockeras alla anrop (utom fakturering) automatiskt.
3.  **Bokningsmotor med ACID-transaktioner (`backend/src/app.ts`)**:
    *   Använder Mongoose/MongoDB sessions-transaktioner för att kontrollera ledig tid och spara bokningar atomärt.
    *   Om två kunder klickar på exakt samma tid hos samma frisör samtidigt, kommer den ena bokningen att sparas medan den andra rullas tillbaka och returnerar `HTTP 409 Conflict`.
4.  **Ekonomisk Logik (MVP-anpassad)**:
    *   Förberedd för Stripe Billing för prenumerationer.
    *   Kundbokningar är konfigurerade för "Betala på plats" (standard) med spårning av betalningsstatus.

---

## 🔍 API Testning (Exempel)

### Registrera en ny salong & admin:
*   **Method**: `POST`
*   **URL**: `http://localhost:5000/api/v1/auth/register-shop`
*   **Body (JSON)**:
    ```json
    {
      "email": "salong.admin@bokabarber.se",
      "password": "Lösenord123!",
      "firstName": "Erik",
      "lastName": "Karlsson",
      "shopName": "Classic Cut",
      "slug": "classic-cut",
      "address": {
        "street": "Sveavägen 45",
        "city": "Stockholm",
        "zipCode": "111 34"
      }
    }
    ```

### Logga in (Hämta Cookie):
*   **Method**: `POST`
*   **URL**: `http://localhost:5000/api/v1/auth/login`
*   **Body (JSON)**:
    ```json
    {
      "email": "frisor.royal@bokabarber.se",
      "password": "Frisor123!"
    }
    ```

### Genomför en bokning (Säker mot dubbelbokning):
*   **Method**: `POST`
*   **URL**: `http://localhost:5000/api/v1/bookings/hold`
*   **Body (JSON)**:
    ```json
    {
      "shopId": "Klistra in salongens ID från sådd eller registrering",
      "barberId": "Klistra in frisörens ID",
      "serviceId": "Klistra in tjänstens ID",
      "startTime": "2026-06-01T10:00:00.000Z",
      "customerData": {
        "firstName": "Johan",
        "lastName": "Svensson",
        "email": "johan.svensson@gmail.com",
        "phoneNumber": "0701234567"
      }
    }
    ```
