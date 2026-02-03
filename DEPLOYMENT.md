# Deployment & Hosting Uitleg

## ⚠️ Belangrijk: Dit is GEEN Static Web App (SWA)

Deze repository bevat de **Azure Functions backend** voor het material lending systeem. Het is **NIET** bedoeld als een Static Web App.

## 🏗️ Huidige hosting architectuur

### Backend (deze repository)
- **Repository**: `revodiver/material-lending-func`
- **Type**: Azure Functions v4 (TypeScript)
- **Hosting**: Azure Functions App
- **URL**: `https://material-lending-func.azurewebsites.net`
- **Deployment**: Automatisch via GitHub Actions naar Azure Functions

### Frontend (aparte repository)
- **Repository**: `revodiver/material-lending-sys` (verwacht)
- **Type**: Static Web App of React/Angular/Vue frontend
- **Hosting**: Azure Static Web Apps
- **Koppeling**: Moet API calls maken naar de Functions backend URL

## 📊 Verschil tussen Azure Functions en Static Web Apps

| Aspect | Azure Functions (DEZE repo) | Static Web Apps |
|--------|----------------------------|-----------------|
| **Doel** | Backend API endpoints | Frontend web applicatie |
| **Code** | TypeScript/Node.js server | HTML/CSS/JavaScript client |
| **Hosting** | Azure Functions App | Azure Static Web Apps |
| **URL patroon** | `.azurewebsites.net` | `.azurestaticapps.net` |
| **Deployment** | Deze GitHub Actions workflow | Eigen workflow in frontend repo |

## ✅ Jouw code is NIET weg!

Alle code is aanwezig in deze repository:

```
✅ src/functions/persons.ts      - Persons API endpoints
✅ src/functions/equipment.ts    - Equipment API endpoints  
✅ src/functions/categories.ts   - Categories API endpoints
✅ src/functions/loans.ts        - Loans API endpoints
✅ src/lib/database.ts           - Database connectie
```

Controleer met:
```bash
ls -la src/functions/
cat src/functions/persons.ts
```

## 🔄 Deployment Status Controleren

### GitHub Actions Workflow
Bekijk de deployment status op:
https://github.com/revodiver/material-lending-func/actions

### Azure Portal
1. Ga naar: https://portal.azure.com
2. Zoek naar "material-lending-func" Function App
3. Controleer onder "Functions" of alle endpoints zichtbaar zijn:
   - getAllPersons
   - getActivePersons
   - getPersonById
   - getAllEquipment
   - ... (etc.)

## 🔗 Koppelen aan Static Web App (Frontend)

Als je een frontend Static Web App hebt, koppel deze als volgt:

### 1. CORS Configureren
In Azure Portal → material-lending-func → CORS:
```
https://jouw-swa.azurestaticapps.net
```

### 2. API URL in Frontend Configureren
In je frontend code (bijv. `api.ts` of `.env`):
```typescript
const API_BASE_URL = 'https://material-lending-func.azurewebsites.net/api';
```

### 3. Test de Verbinding
Open de browser console op je SWA en test:
```javascript
fetch('https://material-lending-func.azurewebsites.net/api/persons')
  .then(r => r.json())
  .then(console.log);
```

## 🐛 Veelvoorkomende Problemen

### "Mijn code is weg"
❌ **Verkeerde aanname**: Code zou in SWA moeten zitten  
✅ **Realiteit**: Deze repo is de BACKEND (Azure Functions), niet de frontend (SWA)

### "Ik zie een nieuwe host in SWA"
❌ **Verkeerde aanname**: Deze code zou naar SWA gedeployed moeten worden  
✅ **Realiteit**: Deze backend wordt naar Azure Functions gedeployed (`.azurewebsites.net`)

### "Waar is mijn frontend?"
De frontend is een **aparte repository** (waarschijnlijk `material-lending-sys`).  
Deze backend-only repository bevat alleen de API endpoints.

## 📝 Volgende Stappen

Als je zowel backend als frontend wilt deployen:

1. **Backend (klaar)**: Deze repository → Azure Functions ✅
2. **Frontend (separaat)**: 
   - Maak een nieuwe repo voor de frontend
   - Deploy naar Azure Static Web Apps
   - Configureer API URL naar deze Functions backend

## 🆘 Hulp Nodig?

- Bekijk README.md voor lokale development setup
- Check GitHub Actions voor deployment logs
- Controleer Azure Portal voor runtime status
