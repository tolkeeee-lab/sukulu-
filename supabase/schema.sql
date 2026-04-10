-- ============================================================
-- SUKULU - Schéma Multi-Tenant COMPLET
-- Ordre d'exécution : schema.sql → rls.sql → seed.sql (dev uniquement)
-- Idempotent : peut être réexécuté sans erreur
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Fonction utilitaire pour la mise à jour automatique de updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TENANTS
-- ============================================================

-- Établissements scolaires (tenants)
CREATE TABLE IF NOT EXISTS schools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  code            TEXT UNIQUE NOT NULL,
  address         TEXT,
  phone           TEXT,
  logo_url        TEXT,
  plan            TEXT DEFAULT 'standard' CHECK (plan IN ('free','standard','premium')),
  billing_status  TEXT DEFAULT 'active' CHECK (billing_status IN ('active','suspended','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at sur schools
DROP TRIGGER IF EXISTS set_updated_at_schools ON schools;
CREATE TRIGGER set_updated_at_schools
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Index de performance sur schools
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_billing_status ON schools(billing_status);

-- ============================================================
-- UTILISATEURS
-- ============================================================

-- Profils utilisateurs (liés à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id   UUID REFERENCES schools(id) ON DELETE SET NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN (
                'super_admin','director','accountant','teacher','parent','student'
              )),
  phone       TEXT,
  momo_phone  TEXT,                          -- Numéro Mobile Money (directeur/enseignant)
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at sur profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Index de performance sur profiles
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- ============================================================
-- ACADÉMIQUE
-- ============================================================

-- Classes par année scolaire
CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  level       TEXT,
  teacher_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  school_year TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur classes
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_year ON classes(school_year);

-- Matières avec coefficients
CREATE TABLE IF NOT EXISTS subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  coefficient INTEGER DEFAULT 1 CHECK (coefficient > 0),
  class_id    UUID REFERENCES classes(id) ON DELETE SET NULL,
  teacher_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur subjects
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);

-- Élèves inscrits dans l'école
CREATE TABLE IF NOT EXISTS students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  profile_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  matricule   TEXT UNIQUE NOT NULL,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  birth_date  DATE,
  photo_url   TEXT,
  parent_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id    UUID REFERENCES classes(id) ON DELETE SET NULL,
  school_year TEXT NOT NULL,
  is_archived BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at sur students
DROP TRIGGER IF EXISTS set_updated_at_students ON students;
CREATE TRIGGER set_updated_at_students
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Index de performance sur students
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_school_year ON students(school_year);
CREATE INDEX IF NOT EXISTS idx_students_is_archived ON students(is_archived);

-- Notes par trimestre
CREATE TABLE IF NOT EXISTS grades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  student_id    UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  subject_id    UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  class_id      UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id    UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  grade         NUMERIC(5,2) NOT NULL CHECK (grade >= 0),
  max_grade     NUMERIC(5,2) DEFAULT 20 CHECK (max_grade > 0),
  trimestre     INTEGER CHECK (trimestre IN (1,2,3)),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur grades
CREATE INDEX IF NOT EXISTS idx_grades_school_id ON grades(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_trimestre ON grades(trimestre);

-- Absences et présences
CREATE TABLE IF NOT EXISTS attendances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id    UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  status      TEXT CHECK (status IN ('present','absent','late','excused')) NOT NULL,
  reason      TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur attendances
CREATE INDEX IF NOT EXISTS idx_attendances_school_id ON attendances(school_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_class_id ON attendances(class_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON attendances(status);

-- Devoirs et ressources pédagogiques
CREATE TABLE IF NOT EXISTS assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  class_id       UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject_id     UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id     UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  due_date       DATE,
  attachment_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur assignments
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- ============================================================
-- FINANCIER
-- ============================================================

-- Types de frais de scolarité
CREATE TABLE IF NOT EXISTS fee_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  due_date    DATE,
  school_year TEXT NOT NULL
);

-- Index de performance sur fee_types
CREATE INDEX IF NOT EXISTS idx_fee_types_school_id ON fee_types(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_types_school_year ON fee_types(school_year);

-- Paiements de scolarité
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  fee_type_id     UUID REFERENCES fee_types(id) ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method  TEXT CHECK (payment_method IN ('cash','momo_mtn','momo_moov','fedapay','kkiapay','cinetpay')),
  cinetpay_tx_id  TEXT,                         -- Identifiant de transaction CinetPay
  momo_phone      TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  collected_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receipt_number  TEXT UNIQUE,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur payments
CREATE INDEX IF NOT EXISTS idx_payments_school_id ON payments(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- ============================================================
-- SALAIRES + DOUBLE AUTHENTIFICATION DIRECTEUR
-- ============================================================

-- Codes OTP pour la validation des salaires par le directeur
CREATE TABLE IF NOT EXISTS otp_validations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code          TEXT NOT NULL,                    -- Code OTP à 6 chiffres — DOIT être haché (bcrypt) côté applicatif avant insertion
  purpose       TEXT NOT NULL CHECK (purpose IN ('salary_approval','payment_validation','login_2fa')),
  entity_id     UUID,                             -- Identifiant du salaire à valider
  is_used       BOOLEAN DEFAULT false,
  expires_at    TIMESTAMPTZ NOT NULL,             -- Expire après 10 minutes
  cinetpay_ref  TEXT,                             -- Référence d'envoi SMS CinetPay
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur otp_validations
CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_entity_id ON otp_validations(entity_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_validations(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_is_used ON otp_validations(is_used);

-- Salaires des enseignants avec workflow d'approbation
CREATE TABLE IF NOT EXISTS payroll (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id            UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  teacher_id           UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month                TEXT NOT NULL,
  gross_amount         NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
  deductions           NUMERIC(12,2) DEFAULT 0 CHECK (deductions >= 0),
  net_amount           NUMERIC(12,2) NOT NULL CHECK (net_amount >= 0),
  momo_phone           TEXT,
  cinetpay_tx_id       TEXT,                      -- Identifiant de transaction CinetPay
  status               TEXT DEFAULT 'pending' CHECK (
                         status IN ('pending','awaiting_approval','approved','paid','failed')
                       ),
  -- Traçabilité de la double authentification du directeur
  director_otp_sent_at  TIMESTAMPTZ,             -- Date d'envoi de l'OTP
  director_approved_at  TIMESTAMPTZ,             -- Date de validation par le directeur
  approved_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  paid_by               UUID REFERENCES profiles(id) ON DELETE SET NULL,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur payroll
CREATE INDEX IF NOT EXISTS idx_payroll_school_id ON payroll(school_id);
CREATE INDEX IF NOT EXISTS idx_payroll_teacher_id ON payroll(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(month);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Notifications in-app pour les utilisateurs
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT CHECK (type IN ('info','warning','payment','grade','absence','salary')),
  is_read     BOOLEAN DEFAULT false,
  entity      TEXT,                               -- Nom de la table concernée
  entity_id   UUID,                              -- Identifiant de l'enregistrement concerné
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur notifications
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- AUDIT LOG (Immuable)
-- ============================================================

-- Journal d'audit immuable pour toutes les actions sensibles
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  school_id   UUID REFERENCES schools(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,                      -- Ex: INSERT, UPDATE, DELETE
  entity      TEXT NOT NULL,                      -- Nom de la table concernée
  entity_id   UUID,
  old_data    JSONB,                              -- État avant modification
  new_data    JSONB,                              -- État après modification
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- FLUX DE VALIDATION DES SALAIRES AVEC CINETPAY
-- ============================================================
-- Étape 1 : Le comptable prépare le salaire           → status: 'pending'
-- Étape 2 : Le comptable soumet pour validation        → status: 'awaiting_approval'
--           → Le système envoie un SMS OTP au directeur via CinetPay
--           → Une entrée est créée dans otp_validations (expire dans 10 min)
-- Étape 3 : Le directeur reçoit le code à 6 chiffres par SMS
-- Étape 4 : Le directeur saisit le code dans l'application
--           → Vérification dans otp_validations (code + expires_at + is_used)
--           → status: 'approved' + director_approved_at = now()
-- Étape 5 : Le système déclenche le paiement MoMo via CinetPay
--           → status: 'paid' + cinetpay_tx_id + paid_at = now()
-- ============================================================

-- ============================================================
-- EXTENSIONS MODULAIRES
-- Exécuter dans cet ordre après ce fichier :
--   supabase/rls.sql         → Row Level Security
--   supabase/delegations.sql → Tables de délégation
--   supabase/seed.sql        → Données de test (dev uniquement)
-- ============================================================
