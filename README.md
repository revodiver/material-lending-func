# Material Lending System - Frontend

> 🤿 **Frontend applicatie** voor het Revodiver material lending systeem

Dit is de **frontend Static Web App** voor het beheren van materiaal uitleningen. De backend API draait in een aparte Azure Functions repository.

## 🏗️ Architectuur

- **Frontend (deze repo)**: Azure Static Web Apps
- **Backend (aparte deployment)**: Azure Functions API
- **Database**: Azure SQL Database (gekoppeld aan backend)

## 🚀 Functionaliteiten

- ✅ **Materiaal Lenen**: Meerdere items tegelijk uitlenen
- ✅ **Materiaal Terugbrengen**: Batch return met feedback
- ✅ **Actieve Uitleningen**: Overzicht van uitgeleende items
- ✅ **Personen Beheer**: Lijst van actieve leden

## 📁 Project Structuur

```
public/
├── index.html          # Hoofd HTML pagina
├── app.js              # JavaScript applicatie logica
└── styles.css          # Styling
```

## 🛠️ Lokale Development

```bash
# Repository klonen
git clone https://github.com/revodiver/material-lending-func.git
cd material-lending-func

# Lokaal testen (kies één optie)
cd public && python -m http.server 8000
# of
cd public && npx http-server -p 8000
```

Pas de API URL aan in `public/app.js`:
```javascript
const API_BASE_URL = 'https://material-lending-func.azurewebsites.net/api';
```

## ☁️ Deployment

De frontend wordt automatisch gedeployed naar Azure Static Web Apps bij push naar `main`.

### Vereist:
- Secret: `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub

### CORS in Backend:
Configureer CORS in de Azure Functions backend om je Static Web App URL toe te staan.

## 📄 License

Copyright © 2026 Revodiver
