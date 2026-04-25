# Papote — Journal de développement

> Ce fichier est mis à jour à chaque session pour garder une trace de où on en est.

---

## 🆕 Session du 25 avril 2026 — Tableau de bord

### ✅ Fait aujourd'hui

**Page d'accueil "Tableau de bord"**
- Nouvel onglet "Accueil" 🏠 ajouté tout au début de la barre de navigation
- C'est désormais la première page visible en ouvrant Papote
- 4 cartes colorées avec stats temps réel :
  - 💰 **CA encaissé du mois** — somme des factures payées du mois + comparaison % vs mois précédent
  - ⏳ **Devis en attente** — nombre + montant total à confirmer (toutes périodes)
  - ✅ **Taux d'acceptation** — % d'acceptés sur les devis décidés ce mois
  - ⚠️ **Impayés en cours** — factures unpaid/late + détection des retards via dateEcheance
- Bloc "Activité récente" : les 5 derniers documents, cliquables pour ouvrir la modal détails
- Boutons d'accès rapide en bas : Devis · Factures · Historique
- Salutation personnalisée selon l'heure (Bonjour / Bon après-midi / Bonsoir) + prénom du profil

### 🔧 Détails techniques
- Fonction `renderTableau()` (~150 lignes), appelée :
  - au démarrage de l'app (dans `demarrer()`)
  - à chaque navigation vers la page (dans `goPage('tableau')`)
- `currentPage` initialisé à `'tableau'` (au lieu de `'devis'`)
- `PAGE_ORDER` : `'tableau'` ajouté en première position
- CSS : `.dash-grid` (2 colonnes desktop, 1 colonne mobile), `.dash-card`, `.dash-section`, `.dash-actions`

### 🚀 À pousser
- Modifs sur `index.html` et `ROADMAP.md`
- Commit suggéré : `Tableau de bord : page d'accueil avec stats temps réel`

---

## ⏸️ État précédent — Pause après la session du 21 avril 2026

### ✅ Fait et prêt à être déployé

**Sécurité (critique)**
- Clé API Groq sécurisée via proxy backend Vercel
- Rate limiting côté proxy (20 requêtes/minute par IP)
- Timeout de 30s sur les appels IA
- Plafonds : max_tokens = 2000, taille body = 20 000 caractères
- Gestion d'erreurs client améliorée (timeouts, réseau, rate limits, messages clairs)

**Fonctionnalités**
- Envoi email via `mailto:` (ouvre la messagerie du client)
- Export / Import de données (backup JSON téléchargeable dans le Profil)
- Recherche & filtres étendus dans l'historique (filtres "Payés" / "Impayés" ajoutés)
- Fonction `normaliserEmail` améliorée (arobase / arrobe / arobas / dot / dash / etc.)

**Infrastructure**
- Site en ligne : https://papote-kappa.vercel.app
- Code : https://github.com/girardotloic7/papote
- GitHub Desktop configuré
- Dossier de travail : `C:\Users\loicv\Documents\GitHub\papote\`

**Cleanup code**
- Suppression du doublon `PAGE_ORDER_UPDATED` / `PAGE_ORDER`

---

## ⏳ À faire juste après la pause (déploiement)

- [ ] Ouvrir GitHub Desktop
- [ ] Vérifier que les changements sont bien détectés (index.html, api/groq.js, ROADMAP.md)
- [ ] Saisir un message de commit (ex : "Features v2 : email mailto, backup, recherche, hardening")
- [ ] Commit + Push
- [ ] Vérifier dans 30 s que Vercel a redéployé
- [ ] Tester le site : https://papote-kappa.vercel.app

---

## 🎯 Phase 2 — Prochaine session

Objectif : ce qu'on n'a pas eu le temps de faire aujourd'hui.

- [x] **#1 Dashboard / Stats** — ✅ FAIT le 25/04/2026 (page Accueil avec 4 cartes + activité récente)
  - 🔜 Améliorations possibles plus tard : sélecteur de période, top clients, alertes "à traiter"
- [ ] **#3 Catalogue de prestations réutilisables**
  - Bibliothèque personnelle (désignation + prix + temps)
  - Picker en un clic dans le formulaire devis
- [ ] **#8 Relances automatiques**
  - Détection des devis en attente > 7 jours
  - Email de relance auto-rédigé par IA
  - Validation manuelle avant envoi
- [ ] **#6 Photo → IA → Devis** (⚠ nécessite API vision externe : Claude ou GPT-4V)
- [ ] **#7 Signature électronique** (⚠ nécessite backend + DB : Vercel KV ou Supabase)
- [ ] **Polish** : numérotation personnalisable + tooltips d'aide

---

## 🧊 Backlog (pour plus tard)

- Service Worker / PWA offline
- Export CSV/Excel pour le comptable
- Mode sombre
- Raccourcis clavier (Ctrl+S, Cmd+K)
- Acomptes et paiements échelonnés sur factures
- Logo visible dans le PDF généré
- CGV personnalisables dans le profil

---

## ⏳ Bloqué — En attente de pré-requis

- **Intégration Stripe** — en attente du n° de SIRET de Loic
- **Blocage trial 15 jours** — à refaire proprement avec Stripe
- **Nom de domaine** — pas encore choisi
- **Email pro backend** — pour envoi auto devis (nécessite domaine)

---

## 🐛 Bugs connus / à corriger

- `nettoyerDocsExpiresAuto()` supprime les docs > 30j silencieusement → prévenir l'utilisateur
- Lignes pas rechargées proprement au changement de métier
- Pas de validation stricte du format email (juste présence de `@`)
- Historique relances sans limite de taille

---

## 📝 Notes techniques importantes

### Architecture
```
papote/
├── index.html       → App single-page
├── api/
│   └── groq.js      → Proxy serveur (Vercel Serverless Function)
├── ROADMAP.md       → Ce fichier
└── README.txt       → Notes d'installation
```

### Variables d'environnement Vercel
- `GROQ_KEY` : clé API Groq (scope All Environments)

### Workflow de déploiement
1. Modifs locales dans `C:\Users\loicv\Documents\GitHub\papote\`
2. GitHub Desktop détecte les changements
3. Commit + Push (3 clics)
4. Vercel redéploie automatiquement (~30 s)

### Données stockées (localStorage)
Toutes préfixées `dp_` (pour "devis papote").

### Modèle IA utilisé
- `llama-3.3-70b-versatile` via l'API Groq (free tier)

---

## ⚠️ Leçons retenues

- **Ne pas déplacer manuellement les fichiers** entre dossiers pendant une session : ça désynchronise le dossier Git et on risque de perdre des modifs.
- Toujours passer par GitHub Desktop pour le workflow : il garde tout synchronisé.
- **Pousser régulièrement** via GitHub Desktop (commit + push) pour ne pas perdre le travail en cas de pépin.

---

## 📅 Historique des sessions

| Date | Durée | Résumé |
|---|---|---|
| 21/04/2026 | ~4h | Sécurisation clé API + email mailto + backup + recherche + hardening + setup workflow GitHub Desktop. Dashboard reporté à la prochaine session. |
| 25/04/2026 | ~1h | Tableau de bord (page d'accueil) avec 4 cartes de stats + activité récente |
