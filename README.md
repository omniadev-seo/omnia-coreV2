# Omnia Core

Pilotage de la performance clients OmniaRank.

Documentation : `spec-omnia-core.md` pour le quoi, `wiki-dev-omnia-core.md` pour le comment et le pourquoi.

---

## Installation

Node.js 20 ou plus est requis (`node --version` pour vérifier).

```bash
npm install
cp .env.example .env.local
npm run dev
```

L'application démarre sur http://localhost:3000. Elle ne fonctionnera qu'une fois les six variables de `.env.local` remplies.

---

## Les six variables

### 1 à 3 — Connexion des membres

Console Google Cloud → API et services → Identifiants → Créer un ID client OAuth, type « Application Web ».

URI de redirection autorisée, en local :

```
http://localhost:3000/api/auth/callback/google
```

Et en production, une fois le projet déployé :

```
https://VOTRE-DOMAINE/api/auth/callback/google
```

Reportez l'identifiant et le secret dans `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET`.

Pour `AUTH_SECRET`, une commande dans le terminal :

```bash
openssl rand -base64 32
```

### 4 et 5 — Compte de service

C'est le compte qui lira Search Console et GA4. Il appartient à l'application, pas à une personne : si quelqu'un quitte l'agence, rien ne casse.

Console Google Cloud → Comptes de service → Créer → puis onglet Clés → Ajouter une clé → JSON.

Le fichier téléchargé contient `client_email` et `private_key`. Reportez-les dans `GOOGLE_SERVICE_ACCOUNT_EMAIL` et `GOOGLE_PRIVATE_KEY`, en gardant les guillemets autour de la clé privée.

Activez ensuite les deux API dans le même projet : **Google Search Console API** et **Google Analytics Data API**. Sans ça les appels échouent avec un message peu explicite.

### 6 — GEO

`GEO_API_KEY` reste vide en V1. Le fournisseur de suivi de visibilité LLM n'est pas encore arrêté.

---

## Donner l'accès au compte de service

Une fois par client, deux gestes.

**Search Console** — Paramètres → Utilisateurs et autorisations → Ajouter, avec l'email du compte de service et le rôle Lecteur restreint.

**GA4** — Admin → Gestion des accès à la propriété → Ajouter, même email, rôle Lecteur. Uniquement pour les clients e-commerce.

---

## Remplir la table des clients

`config/clients.ts` contient une ligne par client. Deux champs à compléter :

**`gscProperty`** se copie telle quelle depuis Search Console. Selon la façon dont la propriété a été créée, c'est `https://exemple.com/` ou `sc-domain:exemple.com`. Une valeur approximative renvoie une erreur 403, pas 404 — ne cherchez pas une faute de frappe dans l'URL du site.

**`ga4PropertyId`** est le nombre affiché dans GA4 → Admin → Paramètres de la propriété. À laisser vide pour les clients sans e-commerce.

Un client dont `gscProperty` est vide est ignoré : vous pouvez donc en brancher deux ou trois pour tester avant de tout remplir.

---

## Ajouter un membre

`config/members.ts`, une ligne par personne. `scope: "*"` donne accès à tous les clients, sinon une liste d'identifiants. Une adresse absente de cette table ne peut pas se connecter, même avec un compte Google valide.

---

## Structure

```
app/            pages et routes
config/         tables de correspondance : clients, membres
lib/            un fichier par source de données
types/          types partagés
```

Règle : aucun appel API dans un composant, tout passe par `lib/`.
