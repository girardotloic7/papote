# Papote — Journal de développement

> Ce fichier est mis à jour à chaque session pour garder une trace de où on en est.

---

## ⏸️ État actuel — Pause après la session du 21 avril 2026

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

- [ ] **#1 Dashboard / Stats** (commencé mais annulé suite à un reset de fichier — à refaire proprement)
  - Nouvelle page avec : CA du mois, devis en attente, taux de conversion, factures impayées
  - Sélecteur de période (mois / trimestre / année / total)
  - Top clients
  - Alertes "à traiter"
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
