# Guide d'utilisation - HESK API Scraper

## Installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Initialiser la base de données**
   ```bash
   npm run init-db
   ```

3. **Démarrer le serveur**
   ```bash
   npm start
   ```

   Pour le développement avec auto-reload :
   ```bash
   npm run dev
   ```

## Première connexion

1. Ouvrez votre navigateur à l'adresse : **http://localhost:3000/admin**

2. Connectez-vous avec les identifiants par défaut :
   - **Username** : `admin`
   - **Password** : `admin123`

3. Une fois connecté, vous accédez au tableau de bord administrateur.

## Configuration de HESK

### 1. Saisir les credentials HESK

Dans l'onglet **Configuration HESK** :

1. Saisissez l'URL complète de votre instance HESK
   - Exemple : `https://support.example.com/hesk`

2. Entrez votre nom d'utilisateur HESK (avec droits admin)

3. Entrez votre mot de passe HESK

4. Cliquez sur **"Tester la connexion"** pour vérifier que les informations sont correctes

5. Si le test est réussi, cliquez sur **"Enregistrer"**

### 2. Important

- Les credentials HESK sont stockés de manière sécurisée dans la base de données
- Le mot de passe est chiffré avec bcrypt
- Seul un utilisateur admin connecté peut accéder à ces informations

## Créer un écran d'affichage

### 1. Accéder à la gestion des écrans

Cliquez sur l'onglet **"Écrans"** dans le menu

### 2. Créer un nouvel écran

1. Cliquez sur **"Nouvel Écran"**

2. Remplissez les informations :
   - **Nom de l'écran** : Un nom descriptif (ex: "Support IT - Tickets ouverts")
   - **Intervalle de rafraîchissement** : En secondes (par défaut 60s)

3. **Définir les filtres** :

   Vous pouvez filtrer les tickets par :

   - **Statuts** : Saisissez un statut par ligne
     ```
     Open
     In Progress
     Waiting for Reply
     ```

   - **Catégories** : Saisissez une catégorie par ligne
     ```
     Technical Support
     Bug Report
     Feature Request
     ```

   - **Priorités** : Saisissez une priorité par ligne
     ```
     High
     Medium
     Low
     ```

4. Cliquez sur **"Enregistrer"**

### 3. Récupérer le lien unique

Une fois l'écran créé, vous verrez une carte avec :
- Le nom de l'écran
- Les filtres configurés
- **L'URL unique** : `http://localhost:3000/screen/abc123def456`

Cette URL est **unique** et ne nécessite **aucune authentification** pour être consultée.

### 4. Actions disponibles

Pour chaque écran, vous pouvez :
- **Ouvrir** : Visualiser l'écran public
- **Modifier** : Changer le nom ou les filtres
- **Supprimer** : Supprimer définitivement l'écran

## Utiliser un écran public

### 1. Accès

Ouvrez l'URL unique de l'écran dans un navigateur :
```
http://localhost:3000/screen/abc123def456
```

### 2. Fonctionnalités

L'écran affiche :
- **Titre de l'écran**
- **Nombre de tickets** correspondant aux filtres
- **Filtres actifs** en haut de page
- **Liste des tickets** sous forme de cartes

Chaque carte de ticket affiche :
- Numéro du ticket
- Sujet
- Statut (avec couleur)
- Catégorie
- Priorité (avec couleur)
- Assignation
- Dates de création et modification

### 3. Rafraîchissement automatique

- L'écran se rafraîchit automatiquement selon l'intervalle configuré
- Un compteur indique le temps restant avant le prochain rafraîchissement
- La dernière heure de mise à jour est affichée

### 4. Utilisation typique

Ces écrans peuvent être affichés sur :
- Des écrans TV dans les bureaux
- Des tableaux de bord de supervision
- Des navigateurs en mode kiosque
- Des appareils dédiés à la visualisation

## Documentation API

### Accès à Swagger

La documentation complète de l'API est disponible à :
**http://localhost:3000/api-docs**

### Endpoints principaux

#### Authentification

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Retourne un token JWT à utiliser pour les requêtes authentifiées.

#### Récupérer les tickets (Public)

```http
GET /api/tickets/{uniqueId}
```

Retourne les tickets filtrés pour un écran spécifique.

**Pas d'authentification requise**

#### Gérer les écrans (Admin)

```http
GET /api/screens
Authorization: Bearer {token}
```

Liste tous les écrans configurés.

```http
POST /api/screens
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mon écran",
  "filters": {
    "status": ["Open", "In Progress"],
    "category": ["Support"],
    "priority": ["High"]
  },
  "refresh_interval": 60
}
```

Crée un nouvel écran avec génération automatique d'un identifiant unique.

## Sécurité

### Recommandations pour la production

1. **Changer le mot de passe admin** :
   - Connectez-vous en tant qu'admin
   - Utilisez l'endpoint `/api/auth/change-password`

2. **Changer le JWT_SECRET** :
   - Modifiez la valeur dans le fichier `.env`
   - Utilisez une clé longue et aléatoire

3. **HTTPS** :
   - Utilisez un reverse proxy (nginx, Apache) avec SSL/TLS
   - Ne jamais exposer l'application directement sur Internet

4. **Firewall** :
   - Limitez l'accès au port 3000
   - Autorisez uniquement les IPs nécessaires pour l'admin

5. **Base de données** :
   - Sauvegardez régulièrement le fichier `data/database.sqlite`
   - Protégez l'accès au fichier avec les permissions appropriées

6. **Credentials HESK** :
   - Utilisez un compte HESK dédié avec permissions minimales
   - Changez régulièrement le mot de passe

## Personnalisation du service de scraping

Le fichier `src/services/hesk.service.js` contient la logique de scraping.

**Important** : La structure HTML de HESK peut varier selon :
- La version de HESK
- Les personnalisations appliquées
- Le template utilisé

Vous devrez probablement **adapter les sélecteurs CSS** dans la méthode `getTickets()` pour correspondre à votre installation HESK :

```javascript
// Exemple actuel (à adapter)
$('table.white tr').each((i, row) => {
  // ...
  const ticket = {
    id: $(cols[0]).text().trim(),
    subject: $(cols[1]).text().trim(),
    status: $(cols[2]).text().trim(),
    // ...
  };
});
```

### Comment adapter le scraping

1. Connectez-vous à votre HESK en tant qu'admin
2. Affichez la liste des tickets
3. Inspectez le HTML avec les DevTools du navigateur
4. Identifiez la structure des tableaux/listes
5. Modifiez les sélecteurs dans `hesk.service.js`

## Dépannage

### Le serveur ne démarre pas

Vérifiez que le port 3000 n'est pas déjà utilisé :
```bash
netstat -ano | findstr :3000
```

Changez le port dans `.env` si nécessaire.

### Erreur de connexion HESK

- Vérifiez l'URL (doit inclure le protocole https://)
- Vérifiez les credentials
- Testez la connexion manuelle depuis un navigateur
- Vérifiez que le compte a les droits admin

### Les tickets ne s'affichent pas

- Vérifiez que la configuration HESK est correcte
- Vérifiez que les filtres ne sont pas trop restrictifs
- Consultez les logs du serveur pour les erreurs de scraping
- Adaptez les sélecteurs CSS dans `hesk.service.js`

### Base de données corrompue

Réinitialisez la base de données :
```bash
rm data/database.sqlite
npm run init-db
```

**Attention** : Cela supprimera tous les écrans configurés.

## Support

Pour toute question ou problème :
1. Consultez les logs du serveur
2. Vérifiez la documentation Swagger
3. Consultez le code source avec les commentaires
