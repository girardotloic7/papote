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

### 🎤 Migration vers Whisper (25/04 — refonte complète du micro)

**Problème de fond :** sur iPhone Safari, la Web Speech API du navigateur a deux permissions séparées (getUserMedia + SpeechRecognition) et iOS demande l'autorisation à chaque appel. Impossible à corriger côté code, c'est un comportement Apple.

**Solution :** abandonner la reconnaissance vocale du navigateur et basculer vers **Whisper via Groq** (déjà branché pour le LLM, free tier).

**Changements :**
- Nouveau endpoint serveur `api/whisper.js` :
  - Reçoit l'audio en base64 du client
  - Forward à Groq Whisper (`whisper-large-v3`, langue fr)
  - Rate limiting (30 req/min), timeout 30s, taille max 3 MB
- Frontend `index.html` :
  - Suppression complète de `SpeechRecognition` / `webkitSpeechRecognition`
  - Suppression de `recog`, `finalTxt`, `fieldRecog`
  - Nouveau système basé sur `MediaRecorder` :
    - Détecte le bon mimeType selon le navigateur (`audio/webm` Chrome, `audio/mp4` iOS Safari)
    - Enregistre pendant l'appui, puis envoie à `/api/whisper` au relâchement
    - Mode verrouillé (1 sec hold) toujours disponible, jusqu'à 60s d'enregistrement
    - Fonction `transcribeAudio(blob, mimeType)` partagée
  - Refonte de `microChamp` (micro pour les champs email) sur le même modèle

**Avantages :**
- ✅ Marche identiquement sur Android Chrome, iPhone Safari, iPhone Chrome, Firefox, Brave, desktop
- ✅ Une seule autorisation micro suffit (plus de re-demandes Apple)
- ✅ Précision Whisper > reconnaissance navigateur (gère mieux accents, jargon métier)

**Compromis :**
- Latence ~1 sec après lâcher du micro (le temps de transcrire)
- Nécessite internet (déjà nécessaire pour le LLM, donc pas une régression)

### 🎤 Expérience micro améliorée (25/04 — bonus iPhone)

**Problème détecté en test sur iPhone :** le code disait "Autorisez le micro dans Chrome" même sur Safari iOS, et iOS ne demandait pas la permission micro de façon claire.

**Corrections apportées :**
- Détection précise de la plateforme (iOS Safari, iOS Chrome, Android Chrome, Firefox, Brave, etc.)
- Nouveau popup d'aide micro contextuel (`showMicHelp`) avec instructions adaptées à chaque appareil :
  - iPhone Safari → Réglages → Safari → Microphone → Autoriser
  - Android Chrome → cadenas 🔒 dans la barre d'URL
  - Firefox/Brave → message "navigateur non compatible"
- Bouton "💡 Le micro ne marche pas ?" visible en permanence sous le micro → déclenche un test manuel qui force le popup natif iOS
- Suppression du message trompeur "autorisez dans Chrome" (qui s'affichait aussi sur iPhone)
- Gestion de toutes les erreurs SpeechRecognition : `not-allowed`, `service-not-allowed`, `audio-capture`, `network`

### ✅ Polish ajouté (25/04 fin de session)

**Numérotation personnalisable**
- Nouveau bloc "Numérotation" dans le Profil
- 2 champs : préfixe devis (défaut DV) et préfixe facture (défaut FA)
- Aperçu temps réel : "Prochain devis : XX-2026-001"
- Bouton "Modifier le prochain numéro" pour repartir d'un numéro spécifique (utile si on migre depuis un autre logiciel)
- Le préfixe est appliqué partout : preview en haut de page, numéro stocké, document généré

**Tooltips d'aide**
- Petit "?" cliquable à côté des labels des champs techniques
- Au survol (desktop) ou clic (mobile/tactile) : explication courte et claire
- Mis sur 11 champs : SIRET, taux horaire, taux UO, taux majoré, marge matériaux, coût km, forfait déplacement, rayon gratuit, validité devis, préfixe devis, préfixe facture
- CSS pur (pseudo-éléments `::before` et `::after`) + petit JS pour gérer le clic mobile

### 🐛 Bug critique corrigé (25/04 fin de session)
Après le premier push du Tableau de bord, l'app était **complètement cassée** (impossible de sélectionner un métier au démarrage). Diagnostic :
- Le fichier `index.html` était **tronqué** depuis le commit du 21 avril (`27ebee2`) — la fin de la fonction `sauvegarderSetup()` ainsi que les balises de fermeture `</script></body></html>` avaient été coupées (probablement lors d'une copie de fichier interrompue).
- En production, l'app avait l'air de fonctionner car les navigateurs sont parfois tolérants. Mais après mon push, le navigateur a vraiment essayé de re-parser le JS et a échoué avec `SyntaxError: Invalid or unexpected token` à `marge: el('sp-mar`.
- **Correction** : restauration de la fin manquante (~30 lignes) depuis le tout premier commit `69ede12`.

**Leçon** : avant tout push, faire un `node --check` sur le JS extrait du index.html pour valider la syntaxe.

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
- [x] **Polish** ✅ FAIT le 25/04/2026 : numérotation personnalisable + tooltips d'aide sur 11 champs

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
| 25/04/2026 | ~2h | Tableau de bord + numérotation personnalisable + tooltips d'aide + correction fichier tronqué |
| 25/04/2026 | ~1h | Migration micro : Whisper via Groq (remplace Web Speech API, marche partout) |
