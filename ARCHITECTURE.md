# Architecture Technique - HESK API Scraper

## Vue d'ensemble

L'application est construite avec une architecture classique client-serveur :

```
┌─────────────────────────────────────────────────────────────┐
│                     Interface Admin                          │
│              (HTML/CSS/JS - Authentifié)                     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API REST                              │
│                  (Express.js + JWT)                          │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌──────────────────┬──────────────────┬─────────────────────────┐
│  Service Scraping│  Base de données │  Interface publique     │
│  (Axios/Cheerio) │    (SQLite)      │  (HTML/CSS/JS)         │
└──────────────────┴──────────────────┴─────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Instance HESK                             │
│              (Application externe)                           │
└─────────────────────────────────────────────────────────────┘
```

## Stack Technique

### Backend

- **Runtime** : Node.js 18+
- **Framework Web** : Express.js 4.x
- **Base de données** : SQLite 3
- **Authentification** : JWT (jsonwebtoken)
- **Scraping** : Axios + Cheerio
- **Sécurité** :
  - Helmet (headers HTTP sécurisés)
  - bcryptjs (hashage mots de passe)
  - CORS
  - Rate limiting (express-rate-limit)

### Frontend

- **Admin** : HTML5, CSS3, JavaScript vanilla
- **Écrans publics** : HTML5, CSS3, JavaScript vanilla
- **Pas de framework** : Pour minimiser les dépendances et faciliter la maintenance

### Documentation

- **API** : Swagger UI (swagger-ui-express + swagger-jsdoc)
- **Format** : OpenAPI 3.0

## Structure des Dossiers

```
apihesk/
├── src/
│   ├── server.js                 # Point d'entrée de l'application
│   ├── config/
│   │   └── swagger.js            # Configuration Swagger
│   ├── database/
│   │   ├── init.js               # Script d'initialisation DB
│   │   └── db.js                 # Classe Database (wrapper SQLite)
│   ├── middleware/
│   │   └── auth.middleware.js    # Vérification JWT
│   ├── controllers/
│   │   ├── auth.controller.js    # Login, changement mot de passe
│   │   ├── hesk-config.controller.js  # Gestion config HESK
│   │   ├── screen.controller.js  # CRUD écrans
│   │   └── ticket.controller.js  # Récupération tickets
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── hesk-config.routes.js
│   │   ├── screen.routes.js
│   │   └── ticket.routes.js
│   ├── services/
│   │   └── hesk.service.js       # Logique de scraping HESK
│   └── public/
│       ├── admin/
│       │   ├── index.html
│       │   ├── style.css
│       │   └── script.js
│       └── screen/
│           ├── index.html
│           ├── style.css
│           └── script.js
├── data/
│   └── database.sqlite           # Base de données SQLite
├── .env                          # Variables d'environnement
├── .env.example                  # Template de configuration
├── package.json
├── README.md
├── GUIDE_UTILISATION.md
└── ARCHITECTURE.md
```

## Base de Données

### Schéma SQLite

#### Table `users`
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,              -- bcrypt hash
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `hesk_config`
```sql
CREATE TABLE hesk_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,              -- bcrypt hash
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `screens`
```sql
CREATE TABLE screens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unique_id TEXT UNIQUE NOT NULL,     -- UUID (16 chars)
  filters TEXT NOT NULL,               -- JSON: {status:[], category:[], priority:[]}
  refresh_interval INTEGER DEFAULT 60,
  display_config TEXT,                 -- JSON (pour futures extensions)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Choix de SQLite

SQLite a été choisi car :
- Pas de serveur de base de données à gérer
- Fichier unique facile à sauvegarder
- Performance suffisante pour ce cas d'usage
- Déploiement simplifié
- Idéal pour des petites/moyennes installations

Pour une installation avec beaucoup d'écrans ou de trafic, migrer vers PostgreSQL ou MySQL serait recommandé.

## Flux d'Authentification

### Admin

```
1. POST /api/auth/login
   ├─> Vérification username/password
   ├─> bcrypt.compare()
   └─> Retour JWT token (24h validité)

2. Requêtes suivantes
   ├─> Header: Authorization: Bearer {token}
   ├─> Middleware auth.middleware.js
   ├─> jwt.verify()
   └─> req.user = decoded token
```

### Écrans publics

Les écrans publics n'ont **pas d'authentification** :
- L'URL unique sert de "secret partagé"
- Pas de JWT nécessaire
- Direct access via GET /api/tickets/:uniqueId

## Service de Scraping

### Processus

```
1. Connexion HESK
   ├─> GET /admin/index.php (récup cookies + CSRF)
   ├─> POST /admin/index.php (login)
   └─> Stockage cookies de session

2. Récupération tickets
   ├─> GET /admin/admin_ticket.php
   ├─> Parse HTML avec Cheerio
   ├─> Extraction données (sélecteurs CSS)
   └─> Application filtres

3. Retour données
   └─> JSON array de tickets
```

### Adaptation nécessaire

Le scraping dépend de la structure HTML de HESK qui peut varier :
- Versions différentes de HESK
- Templates personnalisés
- Modules/plugins installés

**Les sélecteurs CSS dans `hesk.service.js` doivent être adaptés** à votre installation.

### Amélioration possible

Pour des installations HESK récentes, l'API REST native de HESK peut être utilisée à la place du scraping :
- Plus fiable
- Plus rapide
- Moins de maintenance

## Sécurité

### Mesures implémentées

1. **Authentification**
   - JWT avec expiration (24h)
   - Passwords hashés avec bcrypt (10 rounds)

2. **Headers HTTP**
   - Helmet.js pour sécuriser les headers
   - CORS configuré

3. **Rate Limiting**
   - 100 requêtes / 15 minutes par IP
   - Sur les routes /api/*

4. **Validation**
   - Validation des inputs côté serveur
   - Échappement HTML côté client

5. **Séparation des privilèges**
   - Routes admin protégées par JWT
   - Routes publiques accessibles sans auth

### Points d'attention

1. **Credentials HESK**
   - Stockés chiffrés dans la DB
   - Utilisés pour chaque scraping
   - Visible par l'admin dans l'interface

2. **URLs publiques**
   - Pas de sécurité supplémentaire
   - L'URL unique est le seul secret
   - Peut être partagée librement

3. **Production**
   - Utiliser HTTPS obligatoirement
   - Changer JWT_SECRET
   - Firewall / reverse proxy recommandé

## API Endpoints

### Publics (sans auth)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tickets/:uniqueId` | Récupérer tickets pour un écran |
| GET | `/api/screens/by-unique-id/:uniqueId` | Info écran par unique ID |

### Admin (JWT requis)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion admin |
| POST | `/api/auth/change-password` | Changer mot de passe |
| GET | `/api/hesk/config` | Récupérer config HESK |
| PUT | `/api/hesk/config` | Mettre à jour config HESK |
| POST | `/api/hesk/test` | Tester connexion HESK |
| GET | `/api/screens` | Liste tous les écrans |
| GET | `/api/screens/:id` | Détails d'un écran |
| POST | `/api/screens` | Créer un écran |
| PUT | `/api/screens/:id` | Modifier un écran |
| DELETE | `/api/screens/:id` | Supprimer un écran |

### Documentation

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api-docs` | Swagger UI |

## Performances

### Optimisations

1. **Pas de cache** actuellement
   - Chaque requête fait un scraping HESK
   - Peut être lent si HESK est lent

2. **Amélioration possible : Cache**
   ```javascript
   // Cache des tickets par écran
   const cache = new Map();
   const CACHE_TTL = 30000; // 30 secondes

   // Vérifier cache avant scraping
   if (cache.has(uniqueId)) {
     const cached = cache.get(uniqueId);
     if (Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data;
     }
   }
   ```

3. **Amélioration possible : File d'attente**
   - Limiter les requêtes simultanées vers HESK
   - Éviter de surcharger le serveur HESK
   - Utiliser une queue (Bull, BullMQ)

### Monitoring

Ajouter des logs pour :
- Temps de réponse du scraping
- Erreurs de connexion HESK
- Taux de succès/échec
- Nombre de tickets par écran

## Évolutions possibles

### Court terme

1. **Cache Redis**
   - Stocker temporairement les tickets
   - Réduire la charge sur HESK
   - Améliorer les temps de réponse

2. **Webhook/SSE**
   - Push automatique des mises à jour
   - Éviter le polling des écrans publics

3. **Multi-tenancy**
   - Supporter plusieurs instances HESK
   - Table supplémentaire pour les "organisations"

### Moyen terme

1. **Dashboard admin**
   - Statistiques d'utilisation
   - Logs d'activité
   - Monitoring santé HESK

2. **Personnalisation écrans**
   - Thèmes / couleurs
   - Layout différents (liste, grille, tableau)
   - Colonnes personnalisables

3. **Notifications**
   - Email / Slack / Teams
   - Alertes sur nouveaux tickets
   - Alertes sur tickets critiques

### Long terme

1. **Migration vers API HESK native**
   - Si HESK supporte l'API REST
   - Plus fiable que le scraping

2. **Application mobile**
   - React Native / Flutter
   - Notifications push

3. **Analytics**
   - Tableaux de bord
   - Métriques sur les tickets
   - Temps de résolution

## Tests

### Tests à implémenter

```javascript
// Tests unitaires
describe('HeskService', () => {
  it('should login to HESK successfully');
  it('should parse tickets correctly');
  it('should apply filters');
});

// Tests d'intégration
describe('API Endpoints', () => {
  it('should create a screen with unique ID');
  it('should retrieve tickets for a screen');
  it('should require auth for admin routes');
});

// Tests E2E
describe('User flows', () => {
  it('should allow admin to configure HESK');
  it('should allow admin to create screen');
  it('should display tickets on public screen');
});
```

### Outils recommandés

- **Jest** : Tests unitaires et d'intégration
- **Supertest** : Tests API
- **Playwright** : Tests E2E

## Déploiement

### Environnements

#### Développement
```bash
npm run dev
```

#### Production
```bash
npm start
```

### Docker (optionnel)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run init-db

EXPOSE 3000

CMD ["npm", "start"]
```

### Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name hesk-api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Maintenance

### Logs

Ajouter un système de logging :
- **Winston** ou **Pino** pour les logs structurés
- Rotation des fichiers de logs
- Niveaux : error, warn, info, debug

### Backups

Sauvegarder régulièrement :
```bash
# Base de données
cp data/database.sqlite backups/db-$(date +%Y%m%d).sqlite

# Configuration
tar -czf backups/config-$(date +%Y%m%d).tar.gz .env src/
```

### Mises à jour

1. Sauvegarder la DB
2. Mettre à jour le code
3. Mettre à jour les dépendances : `npm update`
4. Redémarrer le serveur

## Contact & Support

Pour toute question technique sur l'architecture, consultez :
- Le code source avec commentaires
- La documentation Swagger
- Ce document d'architecture
