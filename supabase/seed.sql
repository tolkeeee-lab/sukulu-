-- ============================================================
-- SEED DE TEST UNIQUEMENT - NE PAS EXÉCUTER EN PRODUCTION
-- ============================================================
-- Ce fichier insère des données minimales pour le développement local.
-- Les UUID sont fixes pour faciliter les tests reproductibles.
-- À exécuter APRÈS schema.sql et rls.sql.
-- ============================================================

-- UUID fixes pour les tests
-- École  : a0000000-0000-0000-0000-000000000001
-- Directeur : b0000000-0000-0000-0000-000000000001
-- Comptable : b0000000-0000-0000-0000-000000000002
-- Enseignant: b0000000-0000-0000-0000-000000000003
-- Parent    : b0000000-0000-0000-0000-000000000004
-- Élève     : b0000000-0000-0000-0000-000000000005
-- Classe    : c0000000-0000-0000-0000-000000000001
-- Matière 1 : d0000000-0000-0000-0000-000000000001
-- Matière 2 : d0000000-0000-0000-0000-000000000002
-- Type frais: e0000000-0000-0000-0000-000000000001
-- Paiement  : f0000000-0000-0000-0000-000000000001
-- Student   : g0000000-0000-0000-0000-000000000001

-- ------------------------------------------------------------
-- École de test
-- ------------------------------------------------------------
INSERT INTO schools (id, name, code, address, phone, plan, billing_status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'École de Test Sukulu',
  'TEST001',
  'Abidjan, Côte d''Ivoire',
  '+22500000000',
  'standard',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Profils utilisateurs (les entrées auth.users correspondantes
-- doivent exister dans Supabase Auth avant d'insérer ces profils)
-- ------------------------------------------------------------

-- Directeur
INSERT INTO profiles (id, school_id, full_name, role, phone, momo_phone, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Jean Kouassi (Directeur)',
  'director',
  '+22501000001',
  '+22501000001',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Comptable
INSERT INTO profiles (id, school_id, full_name, role, phone, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Marie Bamba (Comptable)',
  'accountant',
  '+22501000002',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Enseignant
INSERT INTO profiles (id, school_id, full_name, role, phone, momo_phone, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Paul Diallo (Enseignant)',
  'teacher',
  '+22501000003',
  '+22501000003',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Parent
INSERT INTO profiles (id, school_id, full_name, role, phone, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Fatou Traoré (Parent)',
  'parent',
  '+22501000004',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Élève (profil)
INSERT INTO profiles (id, school_id, full_name, role, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Awa Traoré (Élève)',
  'student',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Classe de test
-- ------------------------------------------------------------
INSERT INTO classes (id, school_id, name, level, teacher_id, school_year)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '6ème A',
  '6ème',
  'b0000000-0000-0000-0000-000000000003',
  '2024-2025'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Matières de test
-- ------------------------------------------------------------

-- Mathématiques
INSERT INTO subjects (id, school_id, name, coefficient, class_id, teacher_id)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Mathématiques',
  3,
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (id) DO NOTHING;

-- Français
INSERT INTO subjects (id, school_id, name, coefficient, class_id, teacher_id)
VALUES (
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Français',
  3,
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Élève de test (enregistrement dans la table students)
-- ------------------------------------------------------------
INSERT INTO students (
  id, school_id, profile_id, matricule,
  first_name, last_name, birth_date,
  parent_id, class_id, school_year, is_archived
)
VALUES (
  'g0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000005',
  'STU-TEST-001',
  'Awa',
  'Traoré',
  '2012-05-15',
  'b0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  '2024-2025',
  false
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Type de frais de scolarité
-- ------------------------------------------------------------
INSERT INTO fee_types (id, school_id, name, amount, due_date, school_year)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Frais de scolarité 1er trimestre',
  75000.00,
  '2024-10-31',
  '2024-2025'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Paiement exemple
-- ------------------------------------------------------------
INSERT INTO payments (
  id, school_id, student_id, fee_type_id,
  amount, payment_method, status,
  collected_by, receipt_number, paid_at
)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'g0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  75000.00,
  'cash',
  'success',
  'b0000000-0000-0000-0000-000000000002',
  'REC-TEST-0001',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FIN DU SEED DE TEST
-- ============================================================
