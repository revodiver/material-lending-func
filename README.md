# Material Lending Functions - Azure Backend

Azure Functions backend voor het material lending systeem. Deze backend biedt een RESTful API voor het beheren van personen, materiaal, categorieën en uitleningen.

## 🚀 Functionaliteiten

- **Persons API**: Beheer van personen en leden
- **Equipment API**: Beheer van materiaal en beschikbaarheid
- **Categories API**: Beheer van materiaalkategorieën
- **Loans API**: Volledige uitleenadministratie met batch operaties

## 📋 Vereisten

- Node.js 20.x or hoger
- Azure Functions Core Tools v4
- Azure SQL Database
- Azure Functions App (voor productie deployment)

## 🛠️ Lokale Development Setup

### 1. Repository klonen en dependencies installeren

```bash
git clone https://github.com/revodiver/material-lending-func.git
cd material-lending-func
npm install
```

### 2. Environment variabelen configureren

Kopieer het voorbeeld bestand en vul de juiste waarden in:

```bash
cp local.settings.json.example local.settings.json
```

Bewerk `local.settings.json` en vul de database credentials in:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SQL_SERVER": "jouw-server.database.windows.net",
    "SQL_DATABASE": "jouw-database-naam",
    "SQL_USER": "jouw-gebruikersnaam",
    "SQL_PASSWORD": "jouw-wachtwoord"
  }
}
```

### 3. TypeScript builden

```bash
npm run build
```

### 4. Functions lokaal starten

```bash
npm start
```

De API is nu beschikbaar op `http://localhost:7071/api`

## 📡 API Endpoints

### Persons

- `GET /api/persons` - Alle personen ophalen
- `GET /api/persons/active` - Actieve leden ophalen
- `GET /api/persons/{id}` - Persoon op ID ophalen

### Equipment

- `GET /api/equipment` - Alle materiaal ophalen
- `GET /api/equipment/available` - Beschikbaar materiaal ophalen
- `GET /api/equipment/category/{categoryName}` - Materiaal per categorie
- `GET /api/equipment/{id}` - Materiaal op ID ophalen

### Categories

- `GET /api/categories` - Alle categorieën ophalen

### Loans

- `GET /api/loans` - Alle uitleningen ophalen
- `GET /api/loans/{id}` - Uitlening op ID ophalen
- `GET /api/loans/active` - Actieve uitleningen ophalen (met details)
- `GET /api/loans/person/{personId}` - Uitleningen per persoon (met details)
- `GET /api/loans/person/{personId}/active` - Actieve uitleningen per persoon
- `POST /api/loans` - Nieuwe uitlening aanmaken
- `POST /api/loans/batch` - Meerdere uitleningen aanmaken
- `PATCH /api/loans/{loanId}/return` - Uitlening retourneren
- `PATCH /api/loans/return-batch` - Meerdere uitleningen retourneren

## 🔧 Database Schema

De API gebruikt de volgende tabellen in Azure SQL:

### Persons
- PersonId, Name, Surname, Email, Gsm, Telefoon
- Adres, Postnr, Gemeente
- Brevet, SpecBrev, LidSinds, ActiefLid
- SaldoDuiken, SaldoZuurstof
- CreatedAt, UpdatedAt

### Equipment
- EquipmentId, Name, Brand, Size, ItemNumber
- CategoryName, LastInspection, NextInspection
- IsAvailable

### Categories
- CategoryId, CategoryName

### Loans
- LoanId, PersonId, EquipmentId
- BorrowedAt, BorrowFeedback
- ReturnedAt, ReturnFeedback

## ☁️ Azure Deployment

### Automatische Deployment via GitHub Actions

Het project is geconfigureerd voor automatische deployment naar Azure Functions bij elke push naar de `main` branch.

De workflow doet het volgende:
1. Dependencies installeren (`npm install`)
2. TypeScript code builden (`npm run build`)
3. Code deployen naar Azure Functions

### Vereiste Secrets

De volgende secrets moeten geconfigureerd zijn in GitHub:
- `AZUREAPPSERVICE_CLIENTID_*`
- `AZUREAPPSERVICE_TENANTID_*`
- `AZUREAPPSERVICE_SUBSCRIPTIONID_*`

### Environment Variabelen in Azure

Configureer de volgende Application Settings in je Azure Function App:

```
SQL_SERVER=jouw-server.database.windows.net
SQL_DATABASE=jouw-database-naam
SQL_USER=jouw-gebruikersnaam
SQL_PASSWORD=jouw-wachtwoord
```

### Handmatige Deployment

Je kunt ook handmatig deployen met de Azure Functions Core Tools:

```bash
npm run build
func azure functionapp publish material-lending-func
```

## 🔗 Koppelen aan Static Web App

Om de backend te koppelen aan de frontend Static Web App:

1. **CORS configureren**: Voeg in de Azure Portal onder je Function App → CORS de URL van je Static Web App toe:
   ```
   https://jouw-app.azurestaticapps.net
   ```

2. **API URL in frontend**: Update de `API_BASE_URL` in de frontend configuratie:
   ```typescript
   const API_BASE_URL = 'https://material-lending-func.azurewebsites.net/api';
   ```

3. **Test de connectie**: Controleer of alle endpoints bereikbaar zijn vanuit de frontend.

## 🧪 Development

### TypeScript compileren in watch mode

```bash
npm run watch
```

### Project structuur

```
material-lending-func/
├── src/
│   ├── functions/          # Azure Functions endpoints
│   │   ├── persons.ts      # Persons API
│   │   ├── equipment.ts    # Equipment API
│   │   ├── categories.ts   # Categories API
│   │   └── loans.ts        # Loans API
│   └── lib/
│       └── database.ts     # Database connectie helper
├── dist/                   # Compiled JavaScript (generated)
├── .github/
│   └── workflows/
│       └── main_material-lending-func.yml  # CI/CD workflow
├── host.json              # Azure Functions host config
├── local.settings.json    # Lokale environment vars (niet in git)
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 License

Copyright © 2024 Revodiver