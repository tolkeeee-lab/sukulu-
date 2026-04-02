# 🎓 Sukulu — SaaS de Gestion Scolaire pour l'Afrique

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Sukulu** est une plateforme SaaS multi-tenant de gestion scolaire moderne, conçue spécifiquement pour les établissements africains. Elle centralise la gestion des élèves, classes, notes, paiements, absences et communications — avec support des paiements Mobile Money (MTN, Moov) et CinetPay.

---

## ✨ Fonctionnalités

### 🏫 Gestion Académique
- Gestion des **élèves** (inscription, profils, matricules, archivage)
- Gestion des **classes** et **matières** avec coefficients
- Saisie et consultation des **notes** par trimestre
- Suivi des **absences** et présences (présent, absent, en retard, excusé)
- Gestion des **devoirs** et pièces jointes

### 💰 Gestion Financière
- Définition des **frais de scolarité** par type et année scolaire
- Enregistrement des **paiements** (espèces, MoMo MTN/Moov, CinetPay, FedaPay, KKiaPay)
- Génération de **reçus** numérotés
- Gestion de la **paie des enseignants** avec workflow d'approbation

### 🔐 Sécurité & Double Authentification
- Validation des salaires par **OTP SMS** envoyé au directeur via CinetPay
- Workflow complet : préparation → soumission → approbation OTP → paiement MoMo
- **Audit log immuable** de toutes les actions sensibles
- Sécurité **Row Level Security (RLS)** Supabase par école (multi-tenant)

### 🔔 Notifications
- Notifications intégrées (info, paiement, note, absence, salaire)
- Communication interne entre enseignants, parents et administration

---

## 🗄️ Schéma de Base de Données

L'application repose sur une architecture **multi-tenant** — chaque table est isolée par `school_id`.

| Table | Description |
|---|---|
| `schools` | Établissements (tenants) |
| `profiles` | Utilisateurs (directeur, comptable, enseignant, parent, élève) |
| `classes` | Classes par année scolaire |
| `subjects` | Matières avec coefficients |
| `students` | Élèves et leurs informations |
| `grades` | Notes par trimestre |
| `attendances` | Présences et absences |
| `assignments` | Devoirs et ressources |
| `fee_types` | Types de frais scolaires |
| `payments` | Paiements et transactions |
| `payroll` | Salaires enseignants |
| `otp_validations` | OTP pour double authentification directeur |
| `notifications` | Notifications in-app |
| `audit_logs` | Journal d'audit immuable |

### Flux de validation des salaires

```
1. Comptable prépare le salaire        → status: pending
2. Comptable soumet pour validation    → status: awaiting_approval
                                          → SMS OTP envoyé au directeur (CinetPay)
3. Directeur reçoit le code à 6 chiffres par SMS
4. Directeur saisit le code dans l'app → status: approved
5. Paiement MoMo déclenché via CinetPay → status: paid
```

---

## 🚀 Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | [Next.js 15](https://nextjs.org/) (App Router) |
| Style | [Tailwind CSS](https://tailwindcss.com/) |
| Backend / BDD | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) |
| Paiements | CinetPay, FedaPay, KKiaPay, MoMo MTN/Moov |
| Notifications SMS | CinetPay SMS |

---

## 🛠️ Installation

### Prérequis
- Node.js 18+
- Un projet [Supabase](https://supabase.com/) créé
- Un compte [CinetPay](https://cinetpay.com/) (pour les paiements et SMS)

### 1. Cloner le dépôt

```bash
git clone https://github.com/tolkeeee-lab/sukulu-.git
cd sukulu-
npm install
```

### 2. Variables d'environnement

Créez un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CINETPAY_API_KEY=your-cinetpay-key
CINETPAY_SITE_ID=your-cinetpay-site-id
```

### 3. Initialiser la base de données

Exécutez le schéma SQL fourni dans `supabase/schema.sql` depuis le SQL Editor de votre projet Supabase.

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 👥 Rôles Utilisateurs

| Rôle | Accès |
|---|---|
| `super_admin` | Accès global multi-écoles |
| `director` | Gestion complète de son école + validation OTP salaires |
| `accountant` | Paiements, frais, salaires |
| `teacher` | Notes, absences, devoirs de ses classes |
| `parent` | Consultation des résultats et paiements de son enfant |
| `student` | Consultation de ses notes et devoirs |

---

## 📁 Structure du Projet

```
sukulu-/
├── app/                  # Pages Next.js (App Router)
├── components/           # Composants réutilisables
├── lib/                  # Utilitaires et clients Supabase
├── supabase/
│   └── schema.sql        # Schéma complet de la base de données
├── public/               # Assets statiques
└── .env.local            # Variables d'environnement (non commité)
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le dépôt
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'feat: ajout de ma fonctionnalite'`)
4. Pushez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).

---

<p align="center">
  Construit avec ❤️ pour les établissements scolaires africains
</p>