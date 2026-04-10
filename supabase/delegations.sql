-- ============================================================
-- SUKULU - Tables de Délégations
-- À exécuter APRÈS schema.sql et rls.sql
-- Ajoute les tables : delegations, delegation_logs
-- ============================================================

-- ============================================================
-- TABLE : delegations
-- ============================================================

CREATE TABLE IF NOT EXISTS delegations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  delegated_to    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  intitule        TEXT NOT NULL,
  permissions     TEXT[] NOT NULL DEFAULT '{}',
  classes_scope   TEXT NOT NULL DEFAULT 'all',
  note            TEXT,
  starts_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at      DATE NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at sur delegations
DROP TRIGGER IF EXISTS set_updated_at_delegations ON delegations;
CREATE TRIGGER set_updated_at_delegations
  BEFORE UPDATE ON delegations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Index de performance sur delegations
CREATE INDEX IF NOT EXISTS idx_delegations_school_id    ON delegations(school_id);
CREATE INDEX IF NOT EXISTS idx_delegations_delegated_to ON delegations(delegated_to);
CREATE INDEX IF NOT EXISTS idx_delegations_is_active    ON delegations(is_active);
CREATE INDEX IF NOT EXISTS idx_delegations_expires_at   ON delegations(expires_at);

-- ============================================================
-- TABLE : delegation_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS delegation_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  delegation_id  UUID REFERENCES delegations(id) ON DELETE SET NULL,
  delegated_to   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  detail         TEXT,
  severity       TEXT NOT NULL DEFAULT 'ok' CHECK (severity IN ('ok','warn','danger')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Index de performance sur delegation_logs
CREATE INDEX IF NOT EXISTS idx_delegation_logs_school_id     ON delegation_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_delegation_logs_delegation_id ON delegation_logs(delegation_id);
CREATE INDEX IF NOT EXISTS idx_delegation_logs_delegated_to  ON delegation_logs(delegated_to);
CREATE INDEX IF NOT EXISTS idx_delegation_logs_severity      ON delegation_logs(severity);
CREATE INDEX IF NOT EXISTS idx_delegation_logs_created_at    ON delegation_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Activation RLS
ALTER TABLE delegations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_logs  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE : delegations
-- ============================================================
DROP POLICY IF EXISTS "delegations_select_same_school" ON delegations;
DROP POLICY IF EXISTS "delegations_insert_director"    ON delegations;
DROP POLICY IF EXISTS "delegations_update_director"    ON delegations;
DROP POLICY IF EXISTS "delegations_delete_director"    ON delegations;

-- Tous les membres de la même école peuvent voir les délégations
CREATE POLICY "delegations_select_same_school" ON delegations
  FOR SELECT
  USING (school_id = get_my_school_id());

-- Seul le directeur peut créer des délégations
CREATE POLICY "delegations_insert_director" ON delegations
  FOR INSERT
  WITH CHECK (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- Seul le directeur peut modifier des délégations
CREATE POLICY "delegations_update_director" ON delegations
  FOR UPDATE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- Seul le directeur peut supprimer des délégations
CREATE POLICY "delegations_delete_director" ON delegations
  FOR DELETE
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- ============================================================
-- TABLE : delegation_logs
-- ============================================================
DROP POLICY IF EXISTS "delegation_logs_select_director" ON delegation_logs;
DROP POLICY IF EXISTS "delegation_logs_insert_service"  ON delegation_logs;

-- Seul le directeur peut consulter les logs (service_role pour les inserts via API)
CREATE POLICY "delegation_logs_select_director" ON delegation_logs
  FOR SELECT
  USING (
    school_id = get_my_school_id()
    AND get_my_role() = 'director'
  );

-- L'insertion est réservée au service_role (côté serveur uniquement)
-- Aucune policy INSERT pour les utilisateurs normaux = rejet par défaut
-- (Le service_role contourne toujours le RLS)
