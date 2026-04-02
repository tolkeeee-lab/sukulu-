# Sukulu — Supabase

Ce dossier contient les fichiers SQL nécessaires à l'initialisation de la base de données Supabase du projet Sukulu.

---

## 📂 Fichiers

| Fichier | Description |
|---|---|
| `schema.sql` | Schéma complet : extensions, tables, index, triggers |
| `rls.sql` | Toutes les policies Row Level Security (RLS) |
| `seed.sql` | Données de test minimales (**dev uniquement**) |

---

## 🚀 Ordre d'exécution

Les fichiers SQL doivent être exécutés **dans cet ordre** depuis le **SQL Editor** de votre projet Supabase :

```
1. schema.sql   → Crée les extensions, tables, index et triggers
2. rls.sql      → Active le RLS et définit toutes les policies de sécurité
3. seed.sql     → (Développement uniquement) Insère des données de test
```

> ⚠️ **Important** : n'exécutez jamais `seed.sql` sur un environnement de production.

---

## 🔌 Activer les extensions dans Supabase

Les extensions `uuid-ossp` et `pgcrypto` sont activées automatiquement par `schema.sql` grâce aux instructions :

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

Si vous rencontrez une erreur de permissions, activez-les manuellement depuis le tableau de bord Supabase :  
**Database → Extensions → chercher `uuid-ossp` et `pgcrypto` → activer**

---

## 🌱 Seed de test (`seed.sql`)

Le fichier `seed.sql` insère des données minimales avec des **UUID fixes** pour faciliter les tests reproductibles :

| Élément | UUID | Détail |
|---|---|---|
| École | `a0000000-...0001` | Code : `TEST001` |
| Directeur | `b0000000-...0001` | Jean Kouassi |
| Comptable | `b0000000-...0002` | Marie Bamba |
| Enseignant | `b0000000-...0003` | Paul Diallo |
| Parent | `b0000000-...0004` | Fatou Traoré |
| Élève | `b0000000-...0005` / `g0000000-...0001` | Awa Traoré |
| Classe | `c0000000-...0001` | 6ème A (2024-2025) |
| Matière 1 | `d0000000-...0001` | Mathématiques (coef. 3) |
| Matière 2 | `d0000000-...0002` | Français (coef. 3) |
| Type frais | `e0000000-...0001` | Frais 1er trimestre : 75 000 XOF |
| Paiement | `f0000000-...0001` | Reçu `REC-TEST-0001` |

> **Note** : les profils référencent `auth.users`. Pour utiliser le seed, créez d'abord les utilisateurs correspondants dans Supabase Auth (Authentication → Users → Add user), puis exécutez `seed.sql`.

---

## 🔐 Sécurité — `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Ne jamais exposer la `service_role_key` côté client.**

La `service_role_key` contourne toutes les policies RLS. Elle doit être utilisée **uniquement** dans :
- les **Server Actions** Next.js
- les **API Routes** côté serveur
- les fonctions **Edge Functions** Supabase

```env
# ✅ Utilisable côté client (lecture publique)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# ❌ JAMAIS côté client — uniquement serveur
SUPABASE_SERVICE_ROLE_KEY=...
```

Consultez `.env.local.example` à la racine du projet pour la liste complète des variables d'environnement.

---

## 🏗️ Architecture Multi-Tenant

Chaque table (sauf `schools`) contient une colonne `school_id` qui isole strictement les données par établissement. Les policies RLS vérifient systématiquement que l'utilisateur connecté appartient au même `school_id` via :

```sql
(SELECT school_id FROM profiles WHERE id = auth.uid())
```
