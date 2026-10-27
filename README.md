# Maman tout en douceur — v0.4, vitrine de livrets & supports pédagogiques

Cette version transforme l’ancien site éditorial en **catalogue de créations**, sans perdre les comptes, les articles, les PDFs ni les publications Supabase déjà existantes.

## Mise à jour à partir de v0.3

1. **Sauvegarder / committer** l’état actuel de votre projet. Ne pas supprimer `.env.local`.
2. Décompresser **`maman-tout-en-douceur-catalogue-patch-v0.4.zip`** à la racine du projet (par exemple `C:\localWeb\mted`) en **fusionnant les dossiers** et en remplaçant les fichiers présents. Ne pas exécuter le SQL `setup.sql` une seconde fois par besoin de migration : ce n'est pas nécessaire.
3. Dans Supabase > SQL Editor, exécuter **`sql/migration-v0.4.sql`**, non destructif. Les nouvelles colonnes sont indispensables pour enregistrer depuis le nouveau formulaire admin.
4. Démarrer `npm run dev`, visiter `/`, `/ressources`, puis `/connexion` et `/admin`.
5. Dans l'admin, créer une publication de type **Livret / Support pédagogique**, ajouter un titre, une description, choisir le type, un public/âge conseillé, une couverture et éventuellement un PDF. Cocher **Publier immédiatement**. Le support apparaît alors dans `/ressources` et sur sa fiche `/ressources/son-slug`.
6. Tester les liens et le rendu mobile, puis exécuter `npm run typecheck` et `npm run build` sur votre machine avant `git add . && git commit && git push`.

## Ce qui change

- Nouvelle landing page orientée catalogue, visuels de livrets illustratifs en CSS.
- Catalogue filtrable par type, thématique et recherche textuelle, sans nouveau paquet JS.
- Fiches détaillées par support (présentation, public visé, nombre de pages, document en accès public si ajouté).
- Espace admin conservé et enrichi : type de support, public, pages, mise à la une.
- Les anciens articles restent accessibles dans « Conseils ».
- Anciennes ressources répertoriées comme « Fiche pratique » par défaut ; elles peuvent être reclassées depuis l'admin.
- Fichiers et session Supabase inchangés. La migration n'efface aucun enregistrement.

## Fonctionnalités NON incluses dans cette version

- Aucun paiement, panier, code promo, commande ou expédition n'est implémenté.
- Aucun PDF payant n'est protégé. Le bucket `publications` est **public** : un PDF joint à une publication est téléchargeable par tout le monde, même si l'on cache son lien.
- Pour vendre : intégrer un paiement Stripe/Shopify et un parcours de commande, et **stocker les fichiers payants dans un bucket privé** avec des URL temporaires contrôlées côté serveur après vérification du paiement. Ne jamais protéger un PDF payant avec un simple bouton masqué.
- Les fausses couvertures décoratives sur la landing sont des **illustrations**, pas des produits existants. Les cartes du catalogue viennent uniquement des données Supabase.

## Vérifications

La syntaxe TS/TSX et la feuille CSS ont été parsées localement. L'accès au registre npm et le navigateur de test étaient indisponibles pendant cette génération ; le build complet, les parcours Supabase et les captures mobiles doivent être validés sur l'environnement local avant mise en production.

---

# Maman tout en douceur

Site éditorial francophone pour la maternité / petite enfance : Next.js + TypeScript, Supabase Auth + Postgres + Storage, déployable via GitHub sur Vercel.

## Ce qui est inclus (MVP)

- Design responsive crème, rose poudré, beige, vert sauge, avec motifs délicats.
- Page d'accueil, articles, détail d'article, ressources à télécharger, à propos.
- Référencement de base (métadonnées / Open Graph), langue française.
- Authentification privée `/connexion`, interface `/admin`.
- Gestion des publications : création, modification, suppression et brouillon/publication.
- Upload d'images et de documents (PDF, DOCX, XLSX, PPTX, JPG, PNG, WebP) via Supabase Storage.
- Sécurisation en base par Row Level Security : seul l'administrateur désigné peut écrire.
- Pages publiques visibles avant la configuration Supabase, sans faux articles.

## Installation locale

Prérequis : Node.js 20+ et npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Site : http://localhost:3000 · Connexion : http://localhost:3000/connexion

**Note :** sans Supabase configuré, le site public présente son design et ses pages vides ; la connexion n'est pas disponible.

## Initialiser Supabase

1. Créer un projet sur https://supabase.com (région UE conseillée).
2. Dans **SQL Editor**, coller et exécuter **`sql/setup.sql`**.
3. Dans **Authentication > Users**, créer manuellement le compte e-mail / mot de passe de madame. Ne pas créer de formulaire d'inscription public. S'assurer que l'e-mail est confirmé si nécessaire.
4. Remplacer `REMPLACER_PAR_SON_EMAIL@example.com` dans `sql/add-admin.sql` puis exécuter ce second script dans **SQL Editor**.
5. Dans **Project Settings / Connect / API Keys**, copier l'URL et la **clé publishable publique** (ou l'ancienne `anon` key). **Jamais la service_role key** !
6. Remplir `.env.local` :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

7. Démarrer le site, ouvrir `/connexion`, se connecter, puis accéder à `/admin`.

**Important :** le SQL crée un bucket `publications` public parce que le but est de distribuer les fichiers aux visiteurs. Les documents non publiés ne sont pas référencés sur le site mais leurs URLs sont techniquement publiques si elles sont connues. Ne jamais y déposer des informations confidentielles ou des données personnelles de patients/familles. Pour de futurs documents privés, créer un bucket séparé et des URLs signées.

## Déployer sur GitHub et Vercel

```bash
git init
git add .
git commit -m "Initial site Maman tout en douceur"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/maman-tout-en-douceur.git
git push -u origin main
```

Créer le dépôt GitHub vide avant la commande `git remote add origin` (ou utiliser GitHub CLI si installé). Importer le dépôt sur https://vercel.com/new. **Framework preset : Next.js**.

Dans **Vercel > Project > Settings > Environment Variables**, renseigner :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` = URL de production (puis votre domaine personnalisé)

Faire un `Redeploy` après l'ajout des variables, et configurer le domaine si souhaité. Chaque push vers la branche de production pourra déclencher un déploiement automatique.

Pour un domaine personnalisé, voir les paramètres Domain dans Vercel et ajuster `NEXT_PUBLIC_SITE_URL`.

## Utilisation de l'administration

1. Aller à `/connexion` et se connecter avec le compte administrateur.
2. Créer une publication : choisir **Article** ou **Document / PDF**.
3. Pour un article : titre, description, corps de texte et image (facultative).
4. Pour un document : titre, résumé, catégorie, fichier à télécharger, couverture optionnelle.
5. Cocher **Publier immédiatement** ou enregistrer comme brouillon.
6. Les publications se modifient / se suppriment dans la colonne de gauche.

Fichiers : images de couverture <= 6 Mo, pièces jointes <= 15 Mo. Les uploads standards sont particulièrement adaptés aux petits fichiers ; pour une meilleure fiabilité au-delà de 6 Mo, faire évoluer l'upload vers le protocole TUS recommandé par Supabase. Le compte Supabase doit disposer de suffisamment d'espace de stockage.

## Points à personnaliser avant le lancement officiel

- Vérifier et ajuster les textes de présentation de madame (les formulations actuelles sont génériques et basées sur sa bio Instagram visible sur les captures).
- Remplacer le visuel floral provisoire `/public/ornament.svg` par son véritable logo et d'éventuelles photos qu'elle accepte de publier.
- Compléter les mentions légales, confidentialité et cookies si nécessaires pour l'usage réel, ainsi que les coordonnées de contact professionnelles.
- Ajouter, si souhaité : éditeur de texte enrichi, recherche, catégories filtrables, formulaires de contact (avec anti-spam), statistiques respectueuses de la vie privée, reprise d'articles Instagram.
- Décider si les téléchargements sont tous gratuits et publics ; un espace membre privé serait une évolution distincte.
- Sécuriser le compte avec un mot de passe unique, vérifier les politiques de sauvegarde du projet Supabase, mettre en place un domaine et une adresse e-mail adaptés.

## Architecture

```
app/
  page.tsx               Accueil
  articles/              Liste et détail d'articles
  ressources/            Bibliothèque des documents publics
  a-propos/              Présentation
  connexion/             Connexion administrateur
  admin/                 Éditeur de contenu et uploads
components/              En-tête, pied de page, cartes
lib/data.ts              Types, fonctions de lecture et client Supabase
sql/                     Tables et sécurité (RLS)
public/                  Illustration provisoire
```

## Notes techniques

Le client Supabase utilise exclusivement la clé publique. L'autorisation d'écrire ne dépend **pas** de la page `/admin` ni de la dissimulation d'une route : elle est imposée par les policies SQL `public.is_admin()` sur les tables et sur les objets du bucket. Même un utilisateur connecté mais non autorisé ne peut pas modifier les données.

L'interface admin est une Client Component ; les pages publiques sont rendues côté serveur pour être lisibles par les moteurs de recherche. Les articles sont affichés en texte brut avec sauts de lignes, donc aucun HTML utilisateur n'est injecté.

Les couvertures remplacées pendant l'édition ne sont pas automatiquement purgées du Storage. Une routine de nettoyage des fichiers orphelins pourra être ajoutée plus tard.

## État de validation

Le code a été écrit pour Next.js 16 et Supabase JS v2. Le réseau npm n'était pas disponible dans l'environnement de génération ; `npm install`, `npm run typecheck`, `npm run build` et le test réel de connexion/upload **n'ont donc pas pu être exécutés ici**. Effectuer ces vérifications après `npm install` avant mise en production.

## Landing v0.2 : animations légères

L'accueil comprend désormais : une grande accroche illustrée, une bande de valeurs,
des rubriques animées, une phrase signature, les derniers articles, un encart PDF et
un appel à découvrir Instagram. Aucun changement n'a été apporté à la base SQL,
à l'authentification ni à la gestion des fichiers.

Les mouvements sont réalisés en CSS ; un petit `ScrollReveal` (IntersectionObserver)
déclenche les apparitions au défilement. Si JavaScript n'est pas disponible,
le contenu reste visible. Le réglage système « réduire les animations » est respecté.
Aucune bibliothèque d'animation ni aucun service de polices distant n'a été ajouté.

Sur une version précédente du projet, tu peux soit remplacer tout le dossier en
conservant ton `.env.local`, soit ne copier que :

- `app/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `components/scroll-reveal.tsx` (nouveau)

Le logo SVG `/public/ornament.svg` reste volontairement provisoire.

---

## v0.5 — Vente numérique et livret imprimé

Le catalogue v0.4 comprend maintenant des variantes de vente (`PDF`, `imprimé`) et un panier mixte. Le paiement est réalisé dans Stripe Checkout. Les PDF **payants** sont déposés dans le bucket privé `paid-downloads`; les anciens documents déposés dans `publications` restent publics.

Consultez **`INSTALLATION-v0.5.txt`** pour l'installation, les variables d'environnement, la migration Supabase, les tests Stripe et surtout les prérequis obligatoires à une vente en ligne. Exécuter `sql/migration-v0.5.sql` *après* `sql/migration-v0.4.sql`. Définir `COMMERCE_ENABLED=false` tant que les vérifications ne sont pas terminées. Le schéma de commande est `orders` + `order_items`; le webhook Stripe confirme le paiement; l'administratrice peut traiter les commandes dans `/admin/commandes`.

**Statut** : prototype technique pour essais en mode Stripe Test ; pas une boutique de production prête à encaisser. La mise en conformité commerciale, les confirmations e-mail et les tests intégrés restent à effectuer.
