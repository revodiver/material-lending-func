# Deployment Gids

## 📋 Wat is er gebeurd?

De repository is **omgezet van backend naar frontend**:

### ❌ Verwijderd (Backend Code)
- `src/functions/` - Alle Azure Functions endpoints
- `src/lib/database.ts` - Database connectie
- `package.json` - Node.js backend dependencies
- `tsconfig.json` - TypeScript configuratie
- `host.json` - Azure Functions configuratie
- `.github/workflows/main_material-lending-func.yml` - Functions deployment

### ✅ Toegevoegd (Frontend Code)
- `public/index.html` - Hoofd HTML pagina
- `public/app.js` - JavaScript applicatie
- `public/styles.css` - Styling
- `staticwebapp.config.json` - Static Web App configuratie
- `.github/workflows/azure-static-web-apps.yml` - SWA deployment

## 🚀 Volgende Stappen

### 1. Azure Static Web App Aanmaken

1. Ga naar [Azure Portal](https://portal.azure.com)
2. Klik op "Create a resource"
3. Zoek naar "Static Web App"
4. Klik "Create"

**Configuratie:**
- **Subscription**: Jouw Azure subscription
- **Resource Group**: Maak nieuwe of selecteer bestaande
- **Name**: `material-lending-swa` (of eigen naam)
- **Plan type**: Free
- **Region**: West Europe (of dichtstbijzijnde)
- **Source**: GitHub
- **GitHub account**: Jouw account
- **Repository**: `material-lending-func`
- **Branch**: `main`

**Build Details:**
- **Build Presets**: Custom
- **App location**: `/public`
- **Api location**: `` (leeg laten)
- **Output location**: `` (leeg laten)

### 2. Deployment Token Toevoegen

Azure maakt automatisch een GitHub secret aan genaamd `AZURE_STATIC_WEB_APPS_API_TOKEN_xxx`.

Controleer of deze bestaat:
1. Ga naar GitHub repository
2. Settings → Secrets and variables → Actions
3. Zoek naar `AZURE_STATIC_WEB_APPS_API_TOKEN_...`

### 3. CORS Configureren in Backend

De backend (Azure Functions) moet CORS toestaan voor je Static Web App:

1. Ga naar Azure Portal
2. Zoek je Functions App (bijv. `material-lending-func`)
3. Ga naar CORS (onder API)
4. Voeg toe: `https://material-lending-swa.azurestaticapps.net` (gebruik jouw SWA URL)
5. Klik "Save"

### 4. API URL Configureren in Frontend

1. Open `public/app.js`
2. Zoek regel 2:
   ```javascript
   const API_BASE_URL = 'https://material-lending-func.azurewebsites.net/api';
   ```
3. Pas aan naar de URL van je backend Azure Functions
4. Commit en push de wijziging

### 5. Backend API Contract Verifiëren

De frontend verwacht dat de backend de volgende API endpoints ondersteunt:

**Batch Loan Creation:**
```
POST /api/loans/batch
Body: {
  "PersonId": number,
  "EquipmentIds": number[],
  "BorrowFeedback": string|null
}
```

**Batch Loan Return:**
```
PATCH /api/loans/return-batch  
Body: {
  "LoanIds": number[],
  "ReturnFeedback": string|null
}
```

Zorg dat je backend deze formaten accepteert!

### 6. Deployment Testen

Push naar `main` branch triggert automatisch een deployment:

```bash
git push origin main
```

Bekijk de status:
- GitHub: Actions tab → "Azure Static Web Apps CI/CD"
- Azure Portal: Static Web App → Deployment History

### 7. Applicatie Testen

1. Open je Static Web App URL (bijv. `https://material-lending-swa.azurestaticapps.net`)
2. Test de tabs:
   - **Materiaal Lenen**: Selecteer persoon en materiaal
   - **Terugbrengen**: Selecteer persoon en actieve items
   - **Actieve Uitleningen**: Bekijk overzicht
   - **Personen**: Bekijk leden

## 🐛 Troubleshooting

### "Failed to load persons/equipment"

**Mogelijke oorzaken:**
- Backend API is niet beschikbaar
- CORS niet correct geconfigureerd
- API URL in `app.js` is verkeerd

**Oplossing:**
1. Test backend API direct: `https://jouw-backend.azurewebsites.net/api/persons/active`
2. Controleer CORS instellingen in backend
3. Controleer `API_BASE_URL` in `public/app.js`
4. Open browser console (F12) voor details

### GitHub Actions falen

**Mogelijke oorzaken:**
- Secret `AZURE_STATIC_WEB_APPS_API_TOKEN` ontbreekt
- Verkeerde app_location in workflow

**Oplossing:**
1. Controleer Secrets in GitHub Settings
2. Bekijk de workflow logs in Actions tab
3. Controleer `.github/workflows/azure-static-web-apps.yml`

### Changes worden niet getoond

**Oplossing:**
- Hard refresh in browser: Ctrl+Shift+R (Windows/Linux) of Cmd+Shift+R (Mac)
- Wacht enkele minuten op CDN propagatie

## 📝 Onderhoud

### Frontend Updates
1. Wijzig bestanden in `public/`
2. Commit en push naar `main`
3. Deployment gebeurt automatisch

### API URL Wijzigen
Wijzig `API_BASE_URL` in `public/app.js` en push naar `main`

### Custom Domain
1. Azure Portal → Static Web App → Custom domains
2. Voeg jouw domein toe
3. Configureer DNS volgens instructies

## 📞 Support

Voor vragen, open een issue in deze repository.
