# HESK API Scraper

API de scraping HESK avec interface d'administration et écrans publics de visualisation.

## Fonctionnalités

- **Console Admin** : Gestion des credentials HESK, configuration des écrans, documentation API
- **API REST** : Endpoints pour récupérer les demandes HESK via scraping
- **Écrans publics** : Affichage des demandes avec filtres configurables via liens uniques
- **Sécurité** : Authentification JWT pour l'admin, liens uniques par écran

## Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier de configuration
cp .env.example .env

# Initialiser la base de données
npm run init-db

# Démarrer le serveur
npm start
```

## Développement

```bash
npm run dev
```

## Accès

- **Interface Admin** : http://localhost:3000/admin
- **Documentation API** : http://localhost:3000/api-docs
- **Écrans publics** : http://localhost:3000/screen/:uniqueId

## Configuration par défaut

- Username: admin
- Password: admin123

⚠️ **Changez ces credentials en production !**

## Structure du projet

```
apihesk/
├── src/
│   ├── server.js              # Point d'entrée
│   ├── config/                # Configuration
│   ├── database/              # Gestion base de données
│   ├── middleware/            # Middlewares Express
│   ├── routes/                # Routes API
│   ├── services/              # Services (scraping, etc.)
│   ├── controllers/           # Contrôleurs
│   └── public/                # Frontend (HTML/CSS/JS)
├── data/                      # Base de données SQLite
└── package.json
```

## API Endpoints

### Admin
- `POST /api/auth/login` - Connexion admin

**Configuration HESK:**
- `GET /api/hesk/config` - Récupérer la configuration HESK
- `PUT /api/hesk/config` - Mettre à jour la configuration HESK
- `POST /api/hesk/test` - Tester la connexion HESK

**Gestion des écrans:**
- `GET /api/screens` - Liste des écrans
- `POST /api/screens` - Créer un écran
- `GET /api/screens/:id` - Détails d'un écran
- `PUT /api/screens/:id` - Modifier un écran
- `DELETE /api/screens/:id` - Supprimer un écran

**Gestion des utilisateurs:**
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id/password` - Modifier le mot de passe
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Public
- `GET /api/tickets/:screenId` - Récupérer les demandes pour un écran

## Déploiement Docker

### Configuration initiale

Avant de démarrer, copiez et personnalisez le fichier de configuration Docker :

```bash
# Créer votre fichier de configuration
cp .env.docker.example .env.docker

# Éditez le fichier .env.docker et modifiez au minimum :
# - HOST_PORT (port sur lequel l'application sera accessible)
# - JWT_SECRET (clé secrète pour JWT)
# - ENCRYPTION_KEY (clé de chiffrement)
# - ADMIN_USERNAME et ADMIN_PASSWORD
```

**Note:** Le fichier `.env.docker` contient des commentaires détaillés pour chaque variable.

### Utilisation avec Docker Compose (recommandé)

```bash
# Construire et démarrer le conteneur
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter le conteneur
docker-compose down

# Arrêter et supprimer les volumes (attention: efface la base de données)
docker-compose down -v
```

### Utilisation avec Docker seul

```bash
# Construire l'image
docker build -t hesk-api .

# Démarrer le conteneur avec un volume pour persister les données
docker run -d \
  --name hesk-api \
  -p 3000:3000 \
  -v hesk-data:/app/data \
  -e JWT_SECRET=your-secret-key \
  -e ENCRYPTION_KEY=your-encryption-key \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  hesk-api

# Voir les logs
docker logs -f hesk-api

# Arrêter le conteneur
docker stop hesk-api

# Supprimer le conteneur
docker rm hesk-api
```

### Variables d'environnement Docker

Toutes les variables sont configurables dans le fichier `.env.docker` :

**Configuration du serveur:**
- `HOST_PORT` - Port exposé sur l'hôte (défaut: 3000)
- `CONTAINER_PORT` - Port interne du conteneur (défaut: 3000)
- `NODE_ENV` - Environnement d'exécution (défaut: production)

**Sécurité (⚠️ À CHANGER EN PRODUCTION):**
- `JWT_SECRET` - Clé secrète pour les tokens JWT
- `ENCRYPTION_KEY` - Clé de chiffrement pour les credentials HESK
- `ADMIN_USERNAME` - Nom d'utilisateur admin (défaut: admin)
- `ADMIN_PASSWORD` - Mot de passe admin (défaut: admin123)

**Rate Limiting:**
- `RATE_LIMIT_WINDOW_MS` - Fenêtre de temps en ms (défaut: 900000 = 15 min)
- `RATE_LIMIT_MAX_REQUESTS` - Nombre max de requêtes (défaut: 100)

**Génération de clés sécurisées:**
```bash
# Générer une clé aléatoire pour JWT_SECRET ou ENCRYPTION_KEY
openssl rand -hex 32
```

### Persistance des données

Les données de la base SQLite sont stockées dans un volume Docker nommé `hesk-data`. Cela permet de conserver les données même après la suppression du conteneur.

### Health Check

Un endpoint `/health` est disponible pour vérifier l'état du conteneur :

```bash
curl http://localhost:3000/health
```
