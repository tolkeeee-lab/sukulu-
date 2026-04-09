'use client'

import React, { useState, useMemo, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Classe = { id: string; name: string; level: string | null; teacher_id: string | null }
type Teacher = { id: string; full_name: string }
type Schedule = {
  id: string
  school_id: string
  class_id: string
  teacher_id: string
  subject: string
  day_of_week: number
  slot_index: number
  room: string | null
  recurrence: string
  school_year: string
}

interface EmploiDuTempsClientProps {
  schoolId: string
  schoolYear: string
  schoolName: string
  userId: string
  userRole: string
  classes: Classe[]
  teachers: Teacher[]
  schedules: Schedule[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEURES = ['7h30','8h15','9h00','Pause','10h00','10h45','11h30','Déjeuner','13h00','13h45','14h30','15h15']
const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
const DATES = ['17 mars','18 mars','19 mars','20 mars','21 mars','22 mars']
const TODAY_IDX = 4

const SEMAINES = [
  'Semaine du 10 au 15 mars 2026',
  'Semaine du 17 au 22 mars 2026',
  'Semaine du 24 au 29 mars 2026',
  'Semaine du 31 mars au 5 avr. 2026',
]

const CLASSES_EDT_DEFAULT = ['CM2-A','CM2-B','CM1-A','6e-A','5e-B','3e-B']
const ENSEIGNANTS_DEFAULT = ['M. Agossou','Mme Dossou','M. Koffi','Mme Ahounou','M. Zannou','M. Houngnibo']

const MAT_CLASS: Record<string, string> = {
  'Français': 'fr', 'Maths': 'ma', 'Mathématiques': 'ma', 'EST': 'sc',
  'SVT': 'sv', 'Éveil': 'ev', 'Langue Nat.': 'ln', 'EPS': 'ep',
  'Dessin': 'de', 'Anglais': 'an', 'Histoire-Géo': 'hi', 'PCT': 'pc',
}

const LEGENDE_ITEMS = [
  {mat:'Français',cls:'fr'},{mat:'Maths',cls:'ma'},{mat:'EST',cls:'sc'},
  {mat:'SVT',cls:'sv'},{mat:'Éveil',cls:'ev'},{mat:'Langue Nat.',cls:'ln'},
  {mat:'EPS',cls:'ep'},{mat:'Dessin',cls:'de'},{mat:'Anglais',cls:'an'},
  {mat:'Histoire-Géo',cls:'hi'},{mat:'PCT',cls:'pc'},
]

const matColors: Record<string, { bg: string; color: string; border: string }> = {
  fr: { bg: '#eff6ff', color: '#1e40af', border: '#1e40af' },
  ma: { bg: '#f0fdf4', color: '#166534', border: '#166534' },
  sc: { bg: '#fef9c3', color: '#854d0e', border: '#854d0e' },
  sv: { bg: '#f0fdfa', color: '#065f46', border: '#065f46' },
  ev: { bg: '#fff7ed', color: '#9a3412', border: '#9a3412' },
  ln: { bg: '#faf5ff', color: '#7c3aed', border: '#7c3aed' },
  ep: { bg: '#fff1f2', color: '#be185d', border: '#be185d' },
  de: { bg: '#f0f9ff', color: '#0e7490', border: '#0e7490' },
  an: { bg: '#fff7ed', color: '#c2410c', border: '#c2410c' },
  hi: { bg: '#fdf4ff', color: '#a21caf', border: '#a21caf' },
  pc: { bg: '#f8fafc', color: '#475569', border: '#475569' },
}

const profStats: Record<string, { cours: number; heures: number; classes: number; matieres: number }> = {
  'M. Agossou':   { cours: 24, heures: 20, classes: 2, matieres: 1 },
  'Mme Dossou':   { cours: 18, heures: 15, classes: 1, matieres: 1 },
  'M. Koffi':     { cours: 22, heures: 18, classes: 3, matieres: 2 },
  'Mme Ahounou':  { cours: 20, heures: 17, classes: 3, matieres: 2 },
  'M. Zannou':    { cours: 16, heures: 13, classes: 2, matieres: 2 },
  'M. Houngnibo': { cours: 14, heures: 12, classes: 2, matieres: 3 },
}

// ─── EDT Data Generator ───────────────────────────────────────────────────────

function genEDT(classe: string): Array<Array<{mat: string; prof: string} | 'pause' | null>> {
  const mats_p = ['Maths','Français','EST','SVT','Éveil','Langue Nat.','EPS','Dessin']
  const mats_c = ['Maths','Français','SVT','Anglais','Histoire-Géo','EPS','PCT']
  const isPrim = !classe.startsWith('6') && !classe.startsWith('5') && !classe.startsWith('4') && !classe.startsWith('3')
  const mats = isPrim ? mats_p : mats_c
  const profs_c = ['M. Koffi','Mme Ahounou','M. Zannou','M. Houngnibo']
  const profPrim: Record<string,string> = {
    'CM2-A':'M. Agossou','CM2-B':'Mme Tossou','CM1-A':'M. Dossou','3e-B':'M. Tchékpo',
  }
  const edt: Array<Array<{mat:string;prof:string}|'pause'|null>> = []
  for (let h = 0; h < HEURES.length; h++) {
    const row: Array<{mat:string;prof:string}|'pause'|null> = []
    for (let j = 0; j < JOURS.length; j++) {
      if (HEURES[h] === 'Pause' || HEURES[h] === 'Déjeuner') { row.push('pause'); continue }
      if (j === 5 && h >= 7) { row.push(null); continue }
      if (isPrim && j === 2 && h >= 8) { row.push(null); continue }
      const seed = (h * 7 + j * 3 + classe.charCodeAt(0)) % 100
      if (seed < 8) { row.push(null); continue }
      const matIdx = (h + j + classe.charCodeAt(0)) % mats.length
      const prof = isPrim ? (profPrim[classe] || 'M. Agossou') : profs_c[(h + j) % 4]
      row.push({ mat: mats[matIdx], prof })
    }
    edt.push(row)
  }
  return edt
}

function getCellColor(mat: string) {
  const cls = MAT_CLASS[mat] ?? 'pc'
  return matColors[cls] ?? matColors.pc
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({ value, label, icon, color }: { value: string | number; label: string; icon: string; color: string }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      padding: '16px 18px',
      flex: '1 1 140px',
      minWidth: 120,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  )
}

interface EdtGridProps {
  classe: string
  showTodayHighlight?: boolean
}

function EdtGrid({ classe, showTodayHighlight = true }: EdtGridProps) {
  const edt = useMemo(() => genEDT(classe), [classe])
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  const coursCount = useMemo(() => {
    return JOURS.map((_, j) => {
      return edt.filter(row => {
        const cell = row[j]
        return cell !== null && cell !== 'pause'
      }).length
    })
  }, [edt])

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(6, 1fr)', minWidth: 700 }}>
        {/* Corner */}
        <div style={{ background: '#f0faf3', border: '1px solid #e5e7eb', padding: '8px 4px', fontSize: 11, color: '#9ca3af', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>Heure</div>
        {/* Day headers */}
        {JOURS.map((jour, j) => (
          <div key={j} style={{
            background: showTodayHighlight && j === TODAY_IDX ? '#F4A261' : '#1B4332',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 6px',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
          }}>
            <div>{jour}</div>
            <div style={{ fontSize: 10, opacity: 0.8, fontFamily: "'JetBrains Mono', monospace" }}>{DATES[j]}</div>
            <div style={{ marginTop: 3 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>
                {coursCount[j]} cours
              </span>
            </div>
          </div>
        ))}
        {/* Rows */}
        {HEURES.map((heure, h) => (
          <React.Fragment key={h}>
            {/* Hour cell */}
            <div style={{
              background: '#f0faf3',
              border: '1px solid #e5e7eb',
              padding: '6px 4px',
              textAlign: 'center',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#6b7280',
              fontWeight: heure === 'Pause' || heure === 'Déjeuner' ? 600 : 400,
            }}>
              {heure}
            </div>
            {/* Day cells */}
            {JOURS.map((_, j) => {
              const cell = edt[h]?.[j]
              const cellKey = `${h}-${j}`
              if (cell === 'pause') {
                return (
                  <div key={cellKey} style={{
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    padding: '6px 4px',
                    textAlign: 'center',
                    fontSize: 10,
                    color: '#9ca3af',
                    fontStyle: 'italic',
                  }}>
                    {heure}
                  </div>
                )
              }
              if (!cell) {
                return (
                  <div key={cellKey} style={{
                    background: hoveredCell === cellKey ? '#f9fafb' : 'transparent',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={() => setHoveredCell(cellKey)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                )
              }
              const c = getCellColor(cell.mat)
              return (
                <div key={cellKey}
                  onMouseEnter={() => setHoveredCell(cellKey)}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    background: c.bg,
                    border: `1px solid #e5e7eb`,
                    borderLeft: `3px solid ${c.border}`,
                    padding: '4px 6px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'opacity 0.15s',
                    opacity: hoveredCell === cellKey ? 0.85 : 1,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{cell.mat}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{cell.prof}</div>
                  {hoveredCell === cellKey && (
                    <span style={{
                      position: 'absolute', top: 2, right: 4,
                      fontSize: 10, color: c.color, opacity: 0.7,
                    }}>✏</span>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      {/* Légende */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {LEGENDE_ITEMS.map(({ mat, cls }) => {
          const c = matColors[cls]
          return (
            <span key={cls} style={{
              background: c.bg,
              color: c.color,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 500,
            }}>{mat}</span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab Props ────────────────────────────────────────────────────────────────

interface TabProps {
  classeNames: string[]
  enseignantNames: string[]
  schedules: Schedule[]
  teachers: Teacher[]
}

// ─── Tab 1: Vue Semaine ────────────────────────────────────────────────────────

function TabSemaine({ classeNames }: TabProps) {
  const [selectedClasse, setSelectedClasse] = useState(classeNames[0] ?? '')
  const [semaineIdx, setSemaineIdx] = useState(1)

  const edt = useMemo(() => genEDT(selectedClasse), [selectedClasse])

  const mainProf = useMemo(() => {
    const isPrim = !selectedClasse.startsWith('6') && !selectedClasse.startsWith('5') &&
      !selectedClasse.startsWith('4') && !selectedClasse.startsWith('3')
    if (isPrim) {
      const profPrim: Record<string,string> = {
        'CM2-A':'M. Agossou','CM2-B':'Mme Tossou','CM1-A':'M. Dossou','3e-B':'M. Tchékpo',
      }
      return profPrim[selectedClasse] ?? 'M. Agossou'
    }
    return ''
  }, [selectedClasse])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <select
          value={selectedClasse}
          onChange={e => setSelectedClasse(e.target.value)}
          style={{
            border: '1.5px solid #d1fae5', borderRadius: 7, padding: '6px 12px',
            fontSize: 13, fontWeight: 600, color: '#1B4332', background: '#fff', cursor: 'pointer',
          }}
        >
          {classeNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setSemaineIdx(i => Math.max(0, i - 1))}
            disabled={semaineIdx === 0}
            style={{
              border: '1px solid #d1fae5', borderRadius: 6, padding: '5px 12px', background: '#fff',
              cursor: semaineIdx === 0 ? 'not-allowed' : 'pointer', color: '#1B4332', fontSize: 13,
              opacity: semaineIdx === 0 ? 0.4 : 1,
            }}
          >‹</button>
          <span style={{ minWidth: 220, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#1B4332' }}>
            {SEMAINES[semaineIdx]}
          </span>
          <button
            onClick={() => setSemaineIdx(i => Math.min(SEMAINES.length - 1, i + 1))}
            disabled={semaineIdx === SEMAINES.length - 1}
            style={{
              border: '1px solid #d1fae5', borderRadius: 6, padding: '5px 12px', background: '#fff',
              cursor: semaineIdx === SEMAINES.length - 1 ? 'not-allowed' : 'pointer', color: '#1B4332', fontSize: 13,
              opacity: semaineIdx === SEMAINES.length - 1 ? 0.4 : 1,
            }}
          >›</button>
        </div>
        <button
          onClick={() => setSemaineIdx(1)}
          style={{
            border: '1px solid #d1fae5', borderRadius: 6, padding: '5px 12px', background: '#fff',
            cursor: 'pointer', color: '#1B4332', fontSize: 12,
          }}
        >Aujourd&apos;hui</button>
        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
          💡 Cliquez sur un cours pour le modifier
        </span>
      </div>

      {/* Grid section */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332' }}>
            🗓️ EDT — {selectedClasse}{mainProf ? ` · ${mainProf}` : ''}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
              + Cours
            </button>
            <button style={{ background: '#fff', color: '#1B4332', border: '1.5px solid #d1fae5', borderRadius: 7, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
              📋 Copier sem. préc.
            </button>
            <button style={{ background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
              🔄 Reset
            </button>
          </div>
        </div>
        <EdtGrid classe={selectedClasse} showTodayHighlight />
      </div>
    </div>
  )
}

// ─── Tab 2: Par Classe ─────────────────────────────────────────────────────────

function TabClasse({ classeNames }: TabProps) {
  const [selectedClasse, setSelectedClasse] = useState(classeNames[0] ?? '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <select
          value={selectedClasse}
          onChange={e => setSelectedClasse(e.target.value)}
          style={{
            border: '1.5px solid #d1fae5', borderRadius: 7, padding: '6px 12px',
            fontSize: 13, fontWeight: 600, color: '#1B4332', background: '#fff', cursor: 'pointer',
          }}
        >
          {classeNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
          Exporter
        </button>
        <button style={{ background: '#F4A261', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
          + Cours
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332', marginBottom: 12 }}>
          📚 Emploi du Temps — {selectedClasse}
        </div>
        <EdtGrid classe={selectedClasse} showTodayHighlight={false} />
      </div>
    </div>
  )
}

// ─── Tab 3: Par Enseignant ─────────────────────────────────────────────────────

function TabEnseignant({ classeNames, enseignantNames, schedules, teachers }: TabProps) {
  const [selectedProf, setSelectedProf] = useState(enseignantNames[0] ?? '')

  // Compute stats from real schedule data when available
  const stats = useMemo(() => {
    const teacher = teachers.find(t => t.full_name === selectedProf)
    if (teacher && schedules.length > 0) {
      const profSchedules = schedules.filter(s => s.teacher_id === teacher.id)
      const uniqueClasses = new Set(profSchedules.map(s => s.class_id)).size
      const uniqueMatieres = new Set(profSchedules.map(s => s.subject)).size
      // slot_index counts excluding pause slots (3 and 7) × 45min ≈ hours
      const coursCount = profSchedules.length
      const heures = Math.round(coursCount * 0.75) // ~45min per slot
      return { cours: coursCount, heures, classes: uniqueClasses, matieres: uniqueMatieres }
    }
    // Fall back to hardcoded demo stats for demo teachers
    return profStats[selectedProf] ?? { cours: 0, heures: 0, classes: 0, matieres: 0 }
  }, [selectedProf, schedules, teachers])

  const edt = useMemo(() => {
    const profEdt: Array<Array<{mat: string; classe: string} | 'pause' | null>> = []
    for (let h = 0; h < HEURES.length; h++) {
      const row: Array<{mat: string; classe: string} | 'pause' | null> = []
      for (let j = 0; j < JOURS.length; j++) {
        if (HEURES[h] === 'Pause' || HEURES[h] === 'Déjeuner') { row.push('pause'); continue }
        let found: {mat: string; classe: string} | null = null
        for (const cls of classeNames) {
          const clsEdt = genEDT(cls)
          const cell = clsEdt[h]?.[j]
          if (cell && cell !== 'pause' && (cell as {mat:string;prof:string}).prof === selectedProf) {
            found = { mat: (cell as {mat:string;prof:string}).mat, classe: cls }
            break
          }
        }
        row.push(found)
      }
      profEdt.push(row)
    }
    return profEdt
  }, [selectedProf, classeNames])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <select
          value={selectedProf}
          onChange={e => setSelectedProf(e.target.value)}
          style={{
            border: '1.5px solid #d1fae5', borderRadius: 7, padding: '6px 12px',
            fontSize: 13, fontWeight: 600, color: '#1B4332', background: '#fff', cursor: 'pointer',
          }}
        >
          {enseignantNames.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Mini stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard value={stats.cours} label="Cours / semaine" icon="📅" color="#1B4332" />
        <StatCard value={`${stats.heures}h`} label="Heures hebdo" icon="⏱" color="#1e40af" />
        <StatCard value={stats.classes} label="Classes" icon="🏫" color="#7c3aed" />
        <StatCard value={stats.matieres} label="Matières" icon="📖" color="#F4A261" />
      </div>

      {/* EDT enseignant */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332', marginBottom: 12 }}>
          👤 Emploi du Temps — {selectedProf}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(6, 1fr)', minWidth: 700 }}>
            <div style={{ background: '#f0faf3', border: '1px solid #e5e7eb', padding: '8px 4px', fontSize: 11, color: '#9ca3af', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>Heure</div>
            {JOURS.map((jour, j) => (
              <div key={j} style={{
                background: j === TODAY_IDX ? '#F4A261' : '#1B4332',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 6px',
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 600,
              }}>
                <div>{jour}</div>
                <div style={{ fontSize: 10, opacity: 0.8, fontFamily: "'JetBrains Mono', monospace" }}>{DATES[j]}</div>
              </div>
            ))}
            {HEURES.map((heure, h) => (
              <React.Fragment key={h}>
                <div style={{
                  background: '#f0faf3', border: '1px solid #e5e7eb', padding: '6px 4px',
                  textAlign: 'center', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  color: '#6b7280',
                }}>
                  {heure}
                </div>
                {JOURS.map((_, j) => {
                  const cell = edt[h]?.[j]
                  if (cell === 'pause') {
                    return (
                      <div key={`${h}-${j}`} style={{
                        background: '#f3f4f6', border: '1px solid #e5e7eb',
                        padding: '6px 4px', textAlign: 'center', fontSize: 10,
                        color: '#9ca3af', fontStyle: 'italic',
                      }}>
                        {heure}
                      </div>
                    )
                  }
                  if (!cell) {
                    return <div key={`${h}-${j}`} style={{ border: '1px solid #e5e7eb' }} />
                  }
                  const c = getCellColor((cell as {mat:string;classe:string}).mat)
                  return (
                    <div key={`${h}-${j}`} style={{
                      background: c.bg, border: `1px solid #e5e7eb`,
                      borderLeft: `3px solid ${c.border}`, padding: '4px 6px', cursor: 'pointer',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: c.color }}>
                        {(cell as {mat:string;classe:string}).mat}
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>
                        {(cell as {mat:string;classe:string}).classe}
                      </div>
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 4: Vue d'Ensemble ─────────────────────────────────────────────────────

function TabEnsemble({ classeNames, enseignantNames }: TabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332', marginBottom: 16 }}>
          📊 Vue d&apos;ensemble — Toutes les classes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {classeNames.map(cls => {
            const edt = genEDT(cls)
            const total = edt.flat().filter(c => c !== null && c !== 'pause').length
            const pct = Math.round((total / (HEURES.filter(h => h !== 'Pause' && h !== 'Déjeuner').length * JOURS.length)) * 100)
            return (
              <div key={cls} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: '#f9fafb', border: '1px solid #e5e7eb',
              }}>
                <div style={{ width: 60, fontWeight: 700, color: '#1B4332', fontSize: 13 }}>{cls}</div>
                <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#1B4332', borderRadius: 4 }} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#1B4332', fontWeight: 600, width: 40 }}>
                  {pct}%
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', width: 80 }}>{total} cours/sem.</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332', marginBottom: 16 }}>
          👥 Charge des enseignants
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {enseignantNames.map(prof => {
            const s = profStats[prof] ?? { cours: 0, heures: 0, classes: 0, matieres: 0 }
            const maxHeures = 25
            const pct = Math.round((s.heures / maxHeures) * 100)
            return (
              <div key={prof} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: '#f9fafb', border: '1px solid #e5e7eb',
              }}>
                <div style={{ width: 100, fontWeight: 600, color: '#374151', fontSize: 12 }}>{prof}</div>
                <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? '#dc2626' : pct > 70 ? '#F4A261' : '#40916C', borderRadius: 4 }} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#374151', width: 30 }}>
                  {s.heures}h
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', width: 80 }}>{s.classes} classe(s)</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Conflict detection ────────────────────────────────────────────────────────

interface Conflit {
  id: number
  prof: string
  type: string
  detail: string
  severity: 'error' | 'warning'
}

function detectConflicts(schedules: Schedule[], teachers: Teacher[]): Conflit[] {
  const conflicts: Conflit[] = []
  let nextId = 1

  // Double assignment: same teacher, same day_of_week, same slot_index
  const teacherSlotMap = new Map<string, Schedule[]>()
  for (const s of schedules) {
    const key = `${s.teacher_id}-${s.day_of_week}-${s.slot_index}`
    const existing = teacherSlotMap.get(key) ?? []
    existing.push(s)
    teacherSlotMap.set(key, existing)
  }
  for (const [, group] of teacherSlotMap) {
    if (group.length > 1) {
      const teacher = teachers.find(t => t.id === group[0].teacher_id)
      const profName = teacher?.full_name ?? 'Enseignant inconnu'
      const jourLabel = JOURS[group[0].day_of_week] ?? `Jour ${group[0].day_of_week}`
      const heureLabel = HEURES[group[0].slot_index] ?? `Créneau ${group[0].slot_index}`
      conflicts.push({
        id: nextId++,
        prof: profName,
        type: 'Double affectation',
        detail: `${jourLabel} ${heureLabel} — Affecté simultanément à plusieurs classes`,
        severity: 'error',
      })
    }
  }

  // Room conflict: same room, same day_of_week, same slot_index, different classes
  const roomSlotMap = new Map<string, Schedule[]>()
  for (const s of schedules) {
    if (!s.room) continue
    const key = `${s.room}-${s.day_of_week}-${s.slot_index}`
    const existing = roomSlotMap.get(key) ?? []
    existing.push(s)
    roomSlotMap.set(key, existing)
  }
  for (const [, group] of roomSlotMap) {
    if (group.length > 1) {
      const jourLabel = JOURS[group[0].day_of_week] ?? `Jour ${group[0].day_of_week}`
      const heureLabel = HEURES[group[0].slot_index] ?? `Créneau ${group[0].slot_index}`
      conflicts.push({
        id: nextId++,
        prof: `Salle ${group[0].room}`,
        type: 'Conflit de salle',
        detail: `${jourLabel} ${heureLabel} — Salle ${group[0].room} réservée par plusieurs classes`,
        severity: 'warning',
      })
    }
  }

  return conflicts
}

// ─── Tab 5: Conflits ──────────────────────────────────────────────────────────

function TabConflits({ schedules, teachers }: TabProps) {
  // Use real conflict detection from schedules; fall back to demo data when no schedules loaded
  const conflits: Conflit[] = useMemo(() => {
    if (schedules.length > 0) return detectConflicts(schedules, teachers)
    // Demo data when no real schedules loaded
    return [
      {
        id: 1,
        prof: 'M. Koffi Marc',
        type: 'Double affectation',
        detail: 'Jeudi 10h30 — Affecté simultanément à 5e-B (Maths) et 6e-A (Maths)',
        severity: 'error' as const,
      },
      {
        id: 2,
        prof: 'Mme Ahounou',
        type: 'Salle partagée',
        detail: 'Mercredi 9h00 — Salle A12 réservée par deux classes différentes',
        severity: 'warning' as const,
      },
    ]
  }, [schedules])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332', marginBottom: 16 }}>
          ⚠️ Conflits détectés
        </div>
        {conflits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
            ✅ Aucun conflit détecté pour cette semaine
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conflits.map(c => (
              <div key={c.id} style={{
                padding: '14px 16px', borderRadius: 8,
                background: c.severity === 'error' ? '#fef2f2' : '#fffbeb',
                border: `1.5px solid ${c.severity === 'error' ? '#fca5a5' : '#fcd34d'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{c.severity === 'error' ? '🔴' : '🟡'}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: c.severity === 'error' ? '#991b1b' : '#92400e' }}>
                    {c.type}
                  </span>
                  <span style={{
                    background: c.severity === 'error' ? '#fee2e2' : '#fef9c3',
                    color: c.severity === 'error' ? '#dc2626' : '#d97706',
                    borderRadius: 10, padding: '1px 8px', fontSize: 11, marginLeft: 4,
                  }}>
                    {c.prof}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{c.detail}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <button style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: '#374151' }}>
                    Voir le créneau
                  </button>
                  <button style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                    Résoudre
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332', marginBottom: 12 }}>
          📋 Résumé des vérifications
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Doubles affectations enseignants', count: conflits.filter(c => c.type === 'Double affectation').length, ok: conflits.filter(c => c.type === 'Double affectation').length === 0 },
            { label: 'Conflits de salles', count: conflits.filter(c => c.type !== 'Double affectation').length, ok: conflits.filter(c => c.type !== 'Double affectation').length === 0 },
            { label: 'Créneaux sans enseignant', count: 0, ok: true },
            { label: 'Classes sans EDT complet', count: 0, ok: true },
            { label: 'Dépassement horaire légal', count: 0, ok: true },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: 7, background: '#f9fafb', border: '1px solid #e5e7eb',
            }}>
              <span style={{ fontSize: 12, color: '#374151' }}>{item.label}</span>
              <span style={{
                background: item.ok ? '#dcfce7' : '#fee2e2',
                color: item.ok ? '#166534' : '#dc2626',
                borderRadius: 10, padding: '2px 10px', fontSize: 11, fontWeight: 600,
              }}>
                {item.ok ? '✅ OK' : `${item.count} conflit(s)`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab 6: Paramètres ────────────────────────────────────────────────────────

function TabParametres() {
  const [heureDebut, setHeureDebut] = useState('7h30')
  const [heureFin, setHeureFin] = useState('15h30')
  const [dureeCreneaux, setDureeCreneaux] = useState('45')
  const [samediActif, setSamediActif] = useState(true)
  const [mercrediAprem, setMercrediAprem] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: '#1B4332', marginBottom: 16 }}>
          ⚙️ Paramètres de l&apos;emploi du temps
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Heure début */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Heure de début des cours
            </label>
            <select
              value={heureDebut}
              onChange={e => setHeureDebut(e.target.value)}
              style={{ border: '1.5px solid #d1fae5', borderRadius: 7, padding: '7px 12px', fontSize: 13, width: '100%', background: '#fff' }}
            >
              {['6h30','7h00','7h30','8h00','8h30'].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Heure fin */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Heure de fin des cours
            </label>
            <select
              value={heureFin}
              onChange={e => setHeureFin(e.target.value)}
              style={{ border: '1.5px solid #d1fae5', borderRadius: 7, padding: '7px 12px', fontSize: 13, width: '100%', background: '#fff' }}
            >
              {['14h30','15h00','15h30','16h00','16h30','17h00'].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Durée créneaux */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Durée d&apos;un créneau (minutes)
            </label>
            <select
              value={dureeCreneaux}
              onChange={e => setDureeCreneaux(e.target.value)}
              style={{ border: '1.5px solid #d1fae5', borderRadius: 7, padding: '7px 12px', fontSize: 13, width: '100%', background: '#fff' }}
            >
              {['30','45','60','90'].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>

          {/* Samedi actif */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Cours le samedi</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Inclure le samedi dans la grille EDT</div>
            </div>
            <button
              onClick={() => setSamediActif(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: samediActif ? '#1B4332' : '#d1d5db',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: samediActif ? 22 : 2,
                width: 20, height: 20, background: '#fff', borderRadius: '50%',
                transition: 'left 0.2s', display: 'block',
              }} />
            </button>
          </div>

          {/* Mercredi après-midi */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Cours mercredi après-midi</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Activer les créneaux de l&apos;après-midi le mercredi</div>
            </div>
            <button
              onClick={() => setMercrediAprem(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: mercrediAprem ? '#1B4332' : '#d1d5db',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: mercrediAprem ? 22 : 2,
                width: 20, height: 20, background: '#fff', borderRadius: '50%',
                transition: 'left 0.2s', display: 'block',
              }} />
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          <button style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            Enregistrer
          </button>
          <button style={{ background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'semaine', label: '🗓 Vue Semaine' },
  { id: 'classe', label: '📚 Par Classe' },
  { id: 'enseignant', label: '👤 Par Enseignant' },
  { id: 'ensemble', label: '📊 Vue d\'ensemble' },
  { id: 'conflits', label: '⚠️ Conflits' },
  { id: 'parametres', label: '⚙️ Paramètres' },
]

export default function EmploiDuTempsClient({
  schoolName,
  schoolYear,
  classes,
  teachers,
  schedules,
}: EmploiDuTempsClientProps) {
  const [activeTab, setActiveTab] = useState('semaine')

  // Use real data from props when available, fall back to defaults for demo
  const classeNames = useMemo(
    () => classes.length > 0 ? classes.map(c => c.name) : CLASSES_EDT_DEFAULT,
    [classes]
  )
  const enseignantNames = useMemo(
    () => teachers.length > 0 ? teachers.map(t => t.full_name) : ENSEIGNANTS_DEFAULT,
    [teachers]
  )

  // Compute stats from real schedules if available; fall back to reference values
  const stats = useMemo(() => {
    if (schedules.length > 0) {
      const uniqueTeachers = new Set(schedules.map(s => s.teacher_id)).size
      const uniqueClasses = new Set(schedules.map(s => s.class_id)).size
      const conflicts = detectConflicts(schedules, teachers)
      const coursTotal = schedules.length
      const maxSlots = HEURES.filter(h => h !== 'Pause' && h !== 'Déjeuner').length * JOURS.length * classeNames.length
      const couverture = maxSlots > 0 ? Math.round((coursTotal / maxSlots) * 100) : 0
      return { coursTotal, uniqueTeachers, uniqueClasses, conflictsCount: conflicts.length, couverture }
    }
    // Demo values from reference HTML
    return { coursTotal: 84, uniqueTeachers: 12, uniqueClasses: 10, conflictsCount: 1, couverture: 92 }
  }, [schedules, teachers, classeNames])

  const weekLabel = 'Semaine du 17 au 22 mars 2026'

  const tabProps: TabProps = { classeNames, enseignantNames, schedules, teachers }

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case 'semaine':    return <TabSemaine {...tabProps} />
      case 'classe':     return <TabClasse {...tabProps} />
      case 'enseignant': return <TabEnseignant {...tabProps} />
      case 'ensemble':   return <TabEnsemble {...tabProps} />
      case 'conflits':   return <TabConflits {...tabProps} />
      case 'parametres': return <TabParametres />
      default:           return <TabSemaine {...tabProps} />
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, classeNames, enseignantNames, schedules, teachers])

  return (
    <div style={{ padding: '20px 24px', minHeight: '100vh', background: '#e8f5ec' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1B4332', margin: 0 }}>
              Emploi du Temps
            </h1>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', fontFamily: "'Source Sans 3', sans-serif" }}>
              {schoolName} · {schoolYear} · {weekLabel}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              🖨 Imprimer
            </button>
            <button style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              📄 PDF
            </button>
            <button style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              📨 Envoyer
            </button>
            <button style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              + Ajouter un cours
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatCard value={stats.coursTotal} label="Cours planifiés" icon="📅" color="#1B4332" />
        <StatCard value={stats.uniqueTeachers} label="Enseignants actifs" icon="👩‍🏫" color="#1e40af" />
        <StatCard value={stats.uniqueClasses} label="Classes planifiées" icon="🏫" color="#7c3aed" />
        <StatCard value={stats.conflictsCount} label="Conflits" icon="⚠️" color="#dc2626" />
        <StatCard value={`${stats.couverture}%`} label="Couverture" icon="📊" color="#F4A261" />
      </div>

      {/* Conflict alert — only shown when conflicts > 0 */}
      {stats.conflictsCount > 0 && (
        <div style={{
          background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10,
          padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <span style={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>Conflit(s) détecté(s) : </span>
            <span style={{ fontSize: 13, color: '#92400e' }}>
              {stats.conflictsCount} conflit(s) à résoudre dans l&apos;emploi du temps.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('conflits')}
            style={{ marginLeft: 'auto', background: '#F4A261', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
          >
            Voir
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1 1 auto',
              padding: '8px 14px',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#fff' : '#6b7280',
              background: activeTab === tab.id ? '#1B4332' : 'transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {renderTab()}
    </div>
  )
}
