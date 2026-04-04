-- ============================================================
-- SUKULU - Row Level Security (RLS)
-- À exécuter APRÈS schema.sql
-- Idempotent : les policies sont supprimées puis recrées
-- ============================================================

-- ------------------------------------------------------------
-- Activation RLS sur toutes les tables
-- ------------------------------------------------------------
ALTER TABLE schools         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll         ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FONCTIONS HELPER (SECURITY DEFINER)
-- Évitent la récursivité infinie des policies RLS sur `profiles`.
-- Les sous-requêtes directes `(SELECT school_id FROM profiles WHERE …)`
-- déclenchent à nouveau les policies RLS de `profiles`, provoquant
-- une récursion. Les fonctions SECURITY DEFINER contournent le RLS
-- lors de leur propre exécution, cassant la récursion.
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- TABLE : schools
-- ============================================================
DROP POLICY IF EXISTS "schools_select_members"  ON schools;
DROP POLICY IF EXISTS "schools_update_director" ON schools;

-- Tous les membres de l'école peuvent lire les informations de leur établissement
CREATE POLICY "schools_select_members" ON schools
  FOR SELECT
  USING (id = get_my_school_id());

-- Seul le directeur peut modifier les informations de l'école
CREATE POLICY "schools_update_director" ON schools
  FOR UPDATE
  USING (
    id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- Note : INSERT sur schools est réservé au service_role (inscription via /api/register).
-- Aucune policy INSERT = rejet automatique pour les utilisateurs normaux.

-- ============================================================
-- TABLE : profiles
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_same_school"    ON profiles;
DROP POLICY IF EXISTS "profiles_select_own"            ON profiles;
DROP POLICY IF EXISTS "profiles_insert_director_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_director_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"            ON profiles;

-- Tous les membres de la même école peuvent voir les profils
-- Utilise get_my_school_id() (SECURITY DEFINER) pour éviter la récursivité
CREATE POLICY "profiles_select_same_school" ON profiles
  FOR SELECT
  USING (school_id = get_my_school_id());

-- Un utilisateur peut toujours voir son propre profil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Seuls le directeur et le super_admin peuvent créer des profils
CREATE POLICY "profiles_insert_director_admin" ON profiles
  FOR INSERT
  WITH CHECK (get_my_role() IN ('director','super_admin'));

-- Seuls le directeur et le super_admin peuvent modifier les profils
CREATE POLICY "profiles_update_director_admin" ON profiles
  FOR UPDATE
  USING (
    get_my_role() IN ('director','super_admin')
    AND school_id = get_my_school_id()
  );

-- Un utilisateur peut toujours modifier son propre profil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- TABLE : classes
-- ============================================================
DROP POLICY IF EXISTS "classes_select_same_school"         ON classes;
DROP POLICY IF EXISTS "classes_insert_director_teacher"    ON classes;
DROP POLICY IF EXISTS "classes_update_director_teacher"    ON classes;
DROP POLICY IF EXISTS "classes_delete_director_teacher"    ON classes;

-- Tous les membres de la même école peuvent voir les classes
CREATE POLICY "classes_select_same_school" ON classes
  FOR SELECT
  USING (school_id = get_my_school_id());

-- Le directeur et les enseignants peuvent créer des classes
CREATE POLICY "classes_insert_director_teacher" ON classes
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','teacher')
  );

-- Le directeur peut modifier toutes les classes ; un enseignant uniquement ses propres classes
CREATE POLICY "classes_update_director_teacher" ON classes
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (get_my_role() = 'teacher' AND teacher_id = auth.uid())
    )
  );

-- Le directeur peut supprimer toutes les classes ; un enseignant uniquement ses propres classes
CREATE POLICY "classes_delete_director_teacher" ON classes
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (get_my_role() = 'teacher' AND teacher_id = auth.uid())
    )
  );

-- ============================================================
-- TABLE : subjects
-- ============================================================
DROP POLICY IF EXISTS "subjects_select_same_school"      ON subjects;
DROP POLICY IF EXISTS "subjects_insert_director_teacher" ON subjects;
DROP POLICY IF EXISTS "subjects_update_director_teacher" ON subjects;
DROP POLICY IF EXISTS "subjects_delete_director_teacher" ON subjects;

-- Tous les membres de la même école peuvent voir les matières
CREATE POLICY "subjects_select_same_school" ON subjects
  FOR SELECT
  USING (school_id = get_my_school_id());

-- Le directeur et les enseignants assignés peuvent créer des matières
CREATE POLICY "subjects_insert_director_teacher" ON subjects
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','teacher')
  );

-- Le directeur peut modifier toutes les matières ; un enseignant uniquement les siennes
CREATE POLICY "subjects_update_director_teacher" ON subjects
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (get_my_role() = 'teacher' AND teacher_id = auth.uid())
    )
  );

-- Le directeur peut supprimer toutes les matières ; un enseignant uniquement les siennes
CREATE POLICY "subjects_delete_director_teacher" ON subjects
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (get_my_role() = 'teacher' AND teacher_id = auth.uid())
    )
  );

-- ============================================================
-- TABLE : students
-- ============================================================
DROP POLICY IF EXISTS "students_select_same_school"        ON students;
DROP POLICY IF EXISTS "students_select_parent_own_children" ON students;
DROP POLICY IF EXISTS "students_insert_director_accountant" ON students;
DROP POLICY IF EXISTS "students_update_director_accountant" ON students;
DROP POLICY IF EXISTS "students_delete_director_only"       ON students;

-- Le directeur, le comptable et les enseignants de la même école voient tous les élèves
CREATE POLICY "students_select_same_school" ON students
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','accountant','teacher')
  );

-- Un parent ne voit que ses propres enfants
CREATE POLICY "students_select_parent_own_children" ON students
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'parent'
    AND parent_id = auth.uid()
  );

-- Le directeur et le comptable peuvent inscrire des élèves
CREATE POLICY "students_insert_director_accountant" ON students
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','accountant')
  );

-- Le directeur et le comptable peuvent modifier les dossiers des élèves
CREATE POLICY "students_update_director_accountant" ON students
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','accountant')
  );

-- Seul le directeur peut archiver (soft delete) un élève
CREATE POLICY "students_delete_director_only" ON students
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- ============================================================
-- TABLE : grades
-- ============================================================
DROP POLICY IF EXISTS "grades_select_director_teacher"    ON grades;
DROP POLICY IF EXISTS "grades_select_parent_own_children" ON grades;
DROP POLICY IF EXISTS "grades_select_student_own"         ON grades;
DROP POLICY IF EXISTS "grades_insert_teacher_only"        ON grades;
DROP POLICY IF EXISTS "grades_update_teacher_only"        ON grades;
DROP POLICY IF EXISTS "grades_delete_director_only"       ON grades;

-- Le directeur voit toutes les notes ; un enseignant voit uniquement ses propres notes
CREATE POLICY "grades_select_director_teacher" ON grades
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (get_my_role() = 'teacher' AND teacher_id = auth.uid())
    )
  );

-- Un parent voit les notes de ses enfants
CREATE POLICY "grades_select_parent_own_children" ON grades
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'parent'
    AND student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Un élève voit uniquement ses propres notes
CREATE POLICY "grades_select_student_own" ON grades
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'student'
    AND student_id IN (
      SELECT id FROM students WHERE profile_id = auth.uid()
    )
  );

-- Seul l'enseignant assigné à la matière peut saisir des notes
CREATE POLICY "grades_insert_teacher_only" ON grades
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() = 'teacher'
    AND teacher_id = auth.uid()
  );

-- Seul l'enseignant assigné peut modifier ses notes
CREATE POLICY "grades_update_teacher_only" ON grades
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'teacher'
    AND teacher_id = auth.uid()
  );

-- Seul le directeur peut supprimer des notes
CREATE POLICY "grades_delete_director_only" ON grades
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- ============================================================
-- TABLE : attendances
-- ============================================================
DROP POLICY IF EXISTS "attendances_select_director_teacher"    ON attendances;
DROP POLICY IF EXISTS "attendances_select_parent_own_children" ON attendances;
DROP POLICY IF EXISTS "attendances_select_student_own"         ON attendances;
DROP POLICY IF EXISTS "attendances_insert_teacher_only"        ON attendances;
DROP POLICY IF EXISTS "attendances_update_teacher_only"        ON attendances;
DROP POLICY IF EXISTS "attendances_delete_director_only"       ON attendances;

-- Le directeur voit toutes les absences ; un enseignant voit celles de ses classes
CREATE POLICY "attendances_select_director_teacher" ON attendances
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (
        get_my_role() = 'teacher'
        AND class_id IN (
          SELECT id FROM classes WHERE teacher_id = auth.uid()
        )
      )
    )
  );

-- Un parent voit les absences de ses enfants
CREATE POLICY "attendances_select_parent_own_children" ON attendances
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'parent'
    AND student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Un élève voit uniquement ses propres absences
CREATE POLICY "attendances_select_student_own" ON attendances
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'student'
    AND student_id IN (
      SELECT id FROM students WHERE profile_id = auth.uid()
    )
  );

-- Seul un enseignant de la classe peut enregistrer des présences
CREATE POLICY "attendances_insert_teacher_only" ON attendances
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() = 'teacher'
    AND class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Seul un enseignant de la classe peut modifier les présences
CREATE POLICY "attendances_update_teacher_only" ON attendances
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'teacher'
    AND class_id IN (
      SELECT id FROM classes WHERE teacher_id = auth.uid()
    )
  );

-- Seul le directeur peut supprimer des enregistrements de présence
CREATE POLICY "attendances_delete_director_only" ON attendances
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- ============================================================
-- TABLE : assignments
-- ============================================================
DROP POLICY IF EXISTS "assignments_select_same_school"         ON assignments;
DROP POLICY IF EXISTS "assignments_insert_director_teacher"    ON assignments;
DROP POLICY IF EXISTS "assignments_update_director_teacher"    ON assignments;
DROP POLICY IF EXISTS "assignments_delete_director_teacher"    ON assignments;

-- Tous les membres de la même école voient les devoirs
CREATE POLICY "assignments_select_same_school" ON assignments
  FOR SELECT
  USING (school_id = get_my_school_id());

-- Le directeur et l'enseignant assigné peuvent créer des devoirs
CREATE POLICY "assignments_insert_director_teacher" ON assignments
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (get_my_role() = 'teacher' AND teacher_id = auth.uid())
    )
  );

-- Le directeur et l'enseignant assigné peuvent modifier les devoirs
CREATE POLICY "assignments_update_director_teacher" ON assignments
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (get_my_role() = 'teacher' AND teacher_id = auth.uid())
    )
  );

-- Le directeur et l'enseignant assigné peuvent supprimer des devoirs
CREATE POLICY "assignments_delete_director_teacher" ON assignments
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND (
      get_my_role() = 'director'
      OR (get_my_role() = 'teacher' AND teacher_id = auth.uid())
    )
  );

-- ============================================================
-- TABLE : fee_types
-- ============================================================
DROP POLICY IF EXISTS "fee_types_select_director_accountant" ON fee_types;
DROP POLICY IF EXISTS "fee_types_insert_director_only"       ON fee_types;
DROP POLICY IF EXISTS "fee_types_update_director_only"       ON fee_types;
DROP POLICY IF EXISTS "fee_types_delete_director_only"       ON fee_types;

-- Seuls le directeur et le comptable peuvent voir les types de frais
CREATE POLICY "fee_types_select_director_accountant" ON fee_types
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','accountant')
  );

-- Seul le directeur peut créer des types de frais
CREATE POLICY "fee_types_insert_director_only" ON fee_types
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- Seul le directeur peut modifier les types de frais
CREATE POLICY "fee_types_update_director_only" ON fee_types
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- Seul le directeur peut supprimer des types de frais
CREATE POLICY "fee_types_delete_director_only" ON fee_types
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- ============================================================
-- TABLE : payments
-- ============================================================
DROP POLICY IF EXISTS "payments_select_director_accountant"   ON payments;
DROP POLICY IF EXISTS "payments_select_parent_own_children"   ON payments;
DROP POLICY IF EXISTS "payments_insert_director_accountant"   ON payments;
DROP POLICY IF EXISTS "payments_update_director_only"         ON payments;
DROP POLICY IF EXISTS "payments_delete_director_only"         ON payments;

-- Le directeur et le comptable voient tous les paiements
CREATE POLICY "payments_select_director_accountant" ON payments
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','accountant')
  );

-- Un parent voit les paiements de ses enfants
CREATE POLICY "payments_select_parent_own_children" ON payments
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'parent'
    AND student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Le directeur et le comptable peuvent enregistrer des paiements
CREATE POLICY "payments_insert_director_accountant" ON payments
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','accountant')
  );

-- Seul le directeur peut modifier un paiement enregistré
CREATE POLICY "payments_update_director_only" ON payments
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- Seul le directeur peut supprimer un paiement
CREATE POLICY "payments_delete_director_only" ON payments
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- ============================================================
-- TABLE : payroll
-- ============================================================
DROP POLICY IF EXISTS "payroll_select_director_accountant"  ON payroll;
DROP POLICY IF EXISTS "payroll_insert_accountant"           ON payroll;
DROP POLICY IF EXISTS "payroll_update_accountant"           ON payroll;
DROP POLICY IF EXISTS "payroll_update_status_director_only" ON payroll;

-- Le directeur et le comptable voient tous les salaires
CREATE POLICY "payroll_select_director_accountant" ON payroll
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() IN ('director','accountant')
  );

-- Le comptable et le directeur peuvent créer des fiches de salaire
CREATE POLICY "payroll_insert_accountant" ON payroll
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() IN ('accountant','director')
  );

-- Le comptable peut modifier les salaires en attente
CREATE POLICY "payroll_update_accountant" ON payroll
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'accountant'
    AND status IN ('pending','awaiting_approval')
  );

-- Seul le directeur peut approuver (changer le statut vers approved/paid)
CREATE POLICY "payroll_update_status_director_only" ON payroll
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- ============================================================
-- TABLE : otp_validations
-- ============================================================
DROP POLICY IF EXISTS "otp_select_own_user"   ON otp_validations;
DROP POLICY IF EXISTS "otp_update_own_user"   ON otp_validations;
DROP POLICY IF EXISTS "otp_insert_service"    ON otp_validations;

-- Un utilisateur ne peut voir que ses propres OTP
CREATE POLICY "otp_select_own_user" ON otp_validations
  FOR SELECT
  USING (user_id = auth.uid());

-- Un utilisateur ne peut mettre à jour que ses propres OTP (ex: marquer comme utilisé)
CREATE POLICY "otp_update_own_user" ON otp_validations
  FOR UPDATE
  USING (user_id = auth.uid());

-- L'insertion est réservée au service_role (côté serveur uniquement)
-- Aucune policy INSERT pour les utilisateurs normaux = rejet par défaut
-- (Le service_role contourne toujours le RLS)

-- ============================================================
-- TABLE : notifications
-- ============================================================
DROP POLICY IF EXISTS "notifications_select_own"  ON notifications;
DROP POLICY IF EXISTS "notifications_update_own"  ON notifications;

-- Un utilisateur ne voit que ses propres notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Un utilisateur peut uniquement marquer ses notifications comme lues
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- L'insertion est réservée au service_role (côté serveur uniquement)

-- ============================================================
-- TABLE : audit_logs
-- ============================================================
DROP POLICY IF EXISTS "audit_insert_only"          ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_director" ON audit_logs;

-- Seuls les utilisateurs authentifiés peuvent insérer dans les logs d'audit
CREATE POLICY "audit_insert_only" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Le directeur de l'école peut lire les logs d'audit de son établissement
CREATE POLICY "audit_logs_select_director" ON audit_logs
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- ============================================================
-- FIN DES POLICIES RLS
-- INSERT sur otp_validations et notifications uniquement via service_role
-- INSERT sur schools uniquement via service_role (inscription /api/register)
-- ============================================================
