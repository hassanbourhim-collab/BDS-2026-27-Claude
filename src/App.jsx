import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

// ═══════════════════════════════════════════════════════════════
// 🎓 BULLES DE SAVOIR — Application Live (Supabase)
// ═══════════════════════════════════════════════════════════════

const SB_URL = "https://qkncmlmnbbgyjxqjpejm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbmNtbG1uYmJneWp4cWpwZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzU3MjMsImV4cCI6MjA4NjIxMTcyM30.29r2njN6DSAl4yCQR9tguqWARElsRfKDbX_Nivgx_ZE";

const hdrs = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

const api = {
  get: async (t, q = "") => { const r = await fetch(`${SB_URL}/rest/v1/${t}?${q}&order=id`, { headers: hdrs }); return r.ok ? r.json() : []; },
  post: async (t, d) => { const r = await fetch(`${SB_URL}/rest/v1/${t}`, { method: "POST", headers: hdrs, body: JSON.stringify(d) }); return r.ok ? r.json() : null; },
  patch: async (t, filter, d) => { const r = await fetch(`${SB_URL}/rest/v1/${t}?${filter}`, { method: "PATCH", headers: hdrs, body: JSON.stringify(d) }); return r.ok ? r.json() : null; },
  del: async (t, filter) => { const r = await fetch(`${SB_URL}/rest/v1/${t}?${filter}`, { method: "DELETE", headers: hdrs }); return r.ok; },
};

// ═══ STYLE ═══
const C = {
  bg: "#0B0F1A", surface: "#111827", surfaceLight: "#1F2937", border: "#374151",
  accent: "#3B82F6", accentLight: "#60A5FA", accentDark: "#1D4ED8",
  success: "#10B981", warning: "#F59E0B", danger: "#EF4444",
  text: "#F9FAFB", textMuted: "#9CA3AF", textDim: "#6B7280",
  gold: "#F59E0B", purple: "#8B5CF6", pink: "#EC4899",
};

const CLASSES = ["6ème","5ème","4ème","3ème","2nde","1ère","Tle","PostBac"];
const FORFAITS = { groupe: { l: "Groupe", c: C.accent, t: "15€" }, individuel: { l: "Individuel", c: C.gold, t: "35€" }, Triple: { l: "Triple", c: C.purple, t: "20€" }, double: { l: "Double", c: C.pink, t: "25€" }, stage: { l: "Stage", c: C.textMuted, t: "15€" } };

// ═══ UI COMPONENTS ═══
const Badge = ({ children, color = C.accent }) => (
  <span style={{ display: "inline-flex", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "22", color, whiteSpace: "nowrap" }}>{children}</span>
);

const KPI = ({ icon, label, value, sub, color = C.accent }) => (
  <div style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceLight})`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -10, right: -10, width: 70, height: 70, borderRadius: "50%", background: color + "08" }} />
    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: C.text }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, color = C.accent, small, disabled, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: small ? "5px 12px" : "9px 18px", borderRadius: 8, border: outline ? `1px solid ${color}` : "none", background: outline ? "transparent" : disabled ? C.surfaceLight : color, color: outline ? color : "#fff", fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s" }}>{children}</button>
);

const Input = ({ label, value, onChange, type = "text", options, placeholder }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>{label}</div>}
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, boxSizing: "border-box" }} />
    )}
  </div>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, maxWidth: 550, width: "100%", maxHeight: "85vh", overflow: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Loading = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{ fontSize: 16, color: C.textMuted }}>⏳ Chargement depuis Supabase...</div>
  </div>
);

// ═══ DASHBOARD ═══
const DashboardPage = ({ eleves, creneaux, affectations }) => {
  const actifs = eleves.filter(e => e.actif).length;
  const classeData = useMemo(() => {
    const counts = {};
    eleves.filter(e => e.actif).forEach(e => { if (e.classe) counts[e.classe] = (counts[e.classe] || 0) + 1; });
    return CLASSES.map(c => ({ name: c, value: counts[c] || 0 })).filter(d => d.value > 0);
  }, [eleves]);
  const forfaitData = useMemo(() => {
    const counts = {};
    eleves.filter(e => e.actif).forEach(e => { counts[e.forfait] = (counts[e.forfait] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: (FORFAITS[k]||{}).l || k, value: v, color: (FORFAITS[k]||{}).c || C.textMuted }));
  }, [eleves]);
  const creneauxOccupation = useMemo(() => {
    return creneaux.map(cr => {
      const assigned = affectations.filter(a => a.creneau_id === cr.id && a.actif).length;
      return { name: cr.label ? cr.label.replace(cr.jour + " ", "") : "", jour: cr.jour, occupes: assigned, capacite: cr.capacite };
    });
  }, [creneaux, affectations]);
  const pieColors = ["#3B82F6","#8B5CF6","#EC4899","#F59E0B","#10B981","#06B6D4","#F97316","#6366F1"];
  const dossierComplet = eleves.filter(e => e.actif && e.cotisation_payee && e.fiche_inscription).length;
  const dossierIncomplet = actifs - dossierComplet;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Tableau de bord</h1>
        <p style={{ color: C.textMuted, margin: "4px 0 0", fontSize: 13 }}>Données en direct depuis Supabase — {new Date().toLocaleDateString("fr-FR")}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KPI icon="👥" label="Élèves actifs" value={actifs} sub={`${eleves.length} inscrits au total`} color={C.accent} />
        <KPI icon="📅" label="Créneaux" value={creneaux.length} sub={`${affectations.filter(a=>a.actif).length} places occupées`} color={C.purple} />
        <KPI icon="✅" label="Dossiers complets" value={dossierComplet} sub={`${dossierIncomplet} incomplet(s)`} color={C.success} />
        <KPI icon="⚠️" label="Sans cotisation" value={eleves.filter(e=>e.actif && !e.cotisation_payee).length} color={C.warning} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>🎓 Répartition par classe</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={classeData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">
              {classeData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
            </Pie><Tooltip contentStyle={{ background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} /></PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {classeData.map((d, i) => <span key={d.name} style={{ fontSize: 10, color: pieColors[i], fontWeight: 600 }}>● {d.name} ({d.value})</span>)}
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>📊 Occupation des créneaux</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={creneauxOccupation.filter(c => c.capacite > 1)} layout="vertical">
              <XAxis type="number" domain={[0, 6]} tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
              <Bar dataKey="occupes" name="Occupés" fill={C.accent} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>📋 Forfaits</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {forfaitData.map(f => (
            <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 10, background: C.surfaceLight, borderRadius: 10, padding: "10px 16px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: f.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: f.color }}>{f.value}</div>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{f.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══ ÉLÈVES ═══
const ElevesPage = ({ eleves, refresh }) => {
  const [search, setSearch] = useState("");
  const [filterClasse, setFilterClasse] = useState("all");
  const [filterStatut, setFilterStatut] = useState("actif");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = [...eleves];
    if (search) { const q = search.toLowerCase(); list = list.filter(s => `${s.nom} ${s.prenom} ${s.id}`.toLowerCase().includes(q)); }
    if (filterClasse !== "all") list = list.filter(s => s.classe === filterClasse);
    if (filterStatut === "actif") list = list.filter(s => s.actif);
    if (filterStatut === "inactif") list = list.filter(s => !s.actif);
    return list.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [eleves, search, filterClasse, filterStatut]);

  const saveStudent = async () => {
    setSaving(true);
    const { id, ...data } = editing;
    if (selected) {
      await api.patch("eleves", `id=eq.${selected.id}`, data);
    } else {
      await api.post("eleves", editing);
    }
    setSaving(false);
    setEditing(null);
    setSelected(null);
    refresh();
  };

  const toggleActif = async (s) => {
    await api.patch("eleves", `id=eq.${s.id}`, { actif: !s.actif });
    refresh();
  };

  const openEdit = (s) => {
    setSelected(s);
    setEditing({ ...s });
  };

  const openNew = () => {
    setSelected(null);
    setEditing({ id: "", nom: "", prenom: "", actif: true, forfait: "groupe", classe: "6ème", cotisation_payee: false, fiche_inscription: false, tel_parent1: "", tel_parent2: "", tel_eleve: "", email: "", adresse: "", date_naissance: null });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>👥</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Élèves</h2>
          <Badge color={C.accentLight}>{filtered.length}</Badge>
        </div>
        <Btn onClick={openNew} color={C.success}>+ Nouvel élève</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)} style={{ padding: "9px 12px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}>
          <option value="all">Toutes classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ padding: "9px 12px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}>
          <option value="all">Tous</option><option value="actif">Actifs</option><option value="inactif">Inactifs</option>
        </select>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["","Élève","Classe","Forfait","Créneau","Tél","Dossier",""].map((h,i) => (
                <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const f = FORFAITS[s.forfait] || { l: s.forfait, c: C.textMuted };
              return (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}11`, cursor: "pointer" }}
                  onClick={() => openEdit(s)}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "8px 14px", width: 30 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.actif ? C.success : C.danger }} />
                  </td>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{s.prenom} {s.nom}</div>
                    <div style={{ fontSize: 10, color: C.textDim }}>{s.id}</div>
                  </td>
                  <td style={{ padding: "8px 14px" }}><Badge color={C.purple}>{s.classe || "—"}</Badge></td>
                  <td style={{ padding: "8px 14px" }}><Badge color={f.c}>{f.l}</Badge></td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: C.textMuted }}>{s.creneau || "—"}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: s.tel_parent1 ? C.accentLight : C.textDim }}>{s.tel_parent1 || "—"}</td>
                  <td style={{ padding: "8px 14px" }}>
                    <span style={{ fontSize: 13 }}>{s.cotisation_payee ? "✅" : "❌"}{s.fiche_inscription ? "📋" : "⚠️"}</span>
                  </td>
                  <td style={{ padding: "8px 14px", color: C.textDim }}>›</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal édition */}
      <Modal open={!!editing} onClose={() => { setEditing(null); setSelected(null); }} title={selected ? `Modifier ${selected.prenom} ${selected.nom}` : "Nouvel élève"}>
        {editing && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {!selected && <Input label="Identifiant" value={editing.id} onChange={v => setEditing({ ...editing, id: v })} placeholder="Ex: Pre.NOM" />}
              <Input label="Nom" value={editing.nom} onChange={v => setEditing({ ...editing, nom: v })} />
              <Input label="Prénom" value={editing.prenom} onChange={v => setEditing({ ...editing, prenom: v })} />
              <Input label="Classe" value={editing.classe||""} onChange={v => setEditing({ ...editing, classe: v })} options={CLASSES.map(c => [c, c])} />
              <Input label="Forfait" value={editing.forfait} onChange={v => setEditing({ ...editing, forfait: v })} options={Object.entries(FORFAITS).map(([k, v]) => [k, v.l])} />
              <Input label="Date naissance" value={editing.date_naissance||""} onChange={v => setEditing({ ...editing, date_naissance: v || null })} type="date" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Input label="Tél parent 1" value={editing.tel_parent1||""} onChange={v => setEditing({ ...editing, tel_parent1: v })} />
              <Input label="Tél parent 2" value={editing.tel_parent2||""} onChange={v => setEditing({ ...editing, tel_parent2: v })} />
              <Input label="Tél élève" value={editing.tel_eleve||""} onChange={v => setEditing({ ...editing, tel_eleve: v })} />
            </div>
            <Input label="Email" value={editing.email||""} onChange={v => setEditing({ ...editing, email: v })} />
            <Input label="Adresse" value={editing.adresse||""} onChange={v => setEditing({ ...editing, adresse: v })} />
            <div style={{ display: "flex", gap: 16, marginTop: 8, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={editing.cotisation_payee} onChange={e => setEditing({ ...editing, cotisation_payee: e.target.checked })} /> Cotisation payée
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={editing.fiche_inscription} onChange={e => setEditing({ ...editing, fiche_inscription: e.target.checked })} /> Fiche inscription
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={editing.actif} onChange={e => setEditing({ ...editing, actif: e.target.checked })} /> Actif
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                {selected && <Btn onClick={() => toggleActif(selected)} color={selected.actif ? C.danger : C.success} outline small>{selected.actif ? "Désactiver" : "Réactiver"}</Btn>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={() => { setEditing(null); setSelected(null); }} color={C.textMuted} outline>Annuler</Btn>
                <Btn onClick={saveStudent} disabled={saving || !editing.nom || !editing.prenom}>{saving ? "..." : "Enregistrer"}</Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ═══ CRÉNEAUX ═══
const CreneauxPage = ({ creneaux, affectations, eleves, refresh }) => {
  const [addingTo, setAddingTo] = useState(null);
  const [selectedEleve, setSelectedEleve] = useState("");
  const [addType, setAddType] = useState("abonne");
  const days = ["Lundi", "Mercredi", "Samedi"];

  const grouped = useMemo(() => {
    const g = {};
    days.forEach(d => g[d] = []);
    creneaux.forEach(cr => {
      const day = days.find(d => cr.jour === d);
      if (day) {
        const assigned = affectations.filter(a => a.creneau_id === cr.id && a.actif);
        const studentNames = assigned.map(a => {
          const el = eleves.find(e => e.id === a.eleve_id);
          return el ? { ...el, type_inscription: a.type_inscription, affectation_id: a.id } : null;
        }).filter(Boolean);
        g[day].push({ ...cr, students: studentNames });
      }
    });
    return g;
  }, [creneaux, affectations, eleves]);

  const availableForSlot = (cr) => {
    const assignedIds = affectations.filter(a => a.creneau_id === cr.id && a.actif).map(a => a.eleve_id);
    return eleves.filter(e => e.actif && !assignedIds.includes(e.id)).sort((a, b) => a.nom.localeCompare(b.nom));
  };

  const addToSlot = async () => {
    if (!selectedEleve || !addingTo) return;
    await api.post("affectations_creneaux", { eleve_id: selectedEleve, creneau_id: addingTo.id, type_inscription: addType, actif: true });
    setAddingTo(null);
    setSelectedEleve("");
    refresh();
  };

  const removeFromSlot = async (affId) => {
    await api.del("affectations_creneaux", `id=eq.${affId}`);
    refresh();
  };

  const modeInfo = (mode) => {
    if (mode === "individuel") return { label: "Individuel", color: C.gold };
    if (mode === "Triple") return { label: "Triple", color: C.purple };
    return { label: "Groupe", color: C.accent };
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 22 }}>📅</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Planning des Créneaux</h2>
        <Badge color={C.accentLight}>{creneaux.length} créneaux</Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {days.map(day => (
          <div key={day}>
            <div style={{ background: `linear-gradient(135deg, ${C.accent}22, ${C.purple}11)`, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10, textAlign: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{day}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(grouped[day] || []).map(slot => {
                const m = modeInfo(slot.mode);
                const isFull = slot.students.length >= slot.capacite;
                return (
                  <div key={slot.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, borderLeft: `3px solid ${m.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{slot.label ? slot.label.replace(slot.jour + " ", "") : ""}</span>
                      <Badge color={m.color}>{m.label}</Badge>
                    </div>
                    {/* Capacity bar */}
                    <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
                      {Array.from({ length: slot.capacite }).map((_, j) => (
                        <div key={j} style={{ flex: 1, height: 3, borderRadius: 2, background: j < slot.students.length ? m.color : C.surfaceLight }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6 }}>{slot.students.length}/{slot.capacite} places</div>
                    {/* Students */}
                    {slot.students.map(st => (
                      <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
                        <span style={{ fontSize: 11, color: st.type_inscription === "occasionnel" ? C.warning : C.textMuted }}>
                          {st.type_inscription === "occasionnel" ? "⚡" : "•"} {st.prenom} {st.nom}
                        </span>
                        <button onClick={() => removeFromSlot(st.affectation_id)} style={{ background: "none", border: "none", color: C.danger, fontSize: 10, cursor: "pointer", opacity: 0.5, padding: "2px 4px" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>✕</button>
                      </div>
                    ))}
                    {/* Add button */}
                    {!isFull && (
                      <button onClick={() => { setAddingTo(slot); setSelectedEleve(""); setAddType("abonne"); }}
                        style={{ width: "100%", marginTop: 6, padding: "5px", border: `1px dashed ${C.border}`, borderRadius: 6, background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer" }}>
                        + Ajouter un élève
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal ajouter élève au créneau */}
      <Modal open={!!addingTo} onClose={() => setAddingTo(null)} title={`Ajouter à ${addingTo?.label || ""}`}>
        {addingTo && (
          <div>
            <Input label="Élève" value={selectedEleve} onChange={setSelectedEleve}
              options={[["", "— Choisir un élève —"], ...availableForSlot(addingTo).map(e => [e.id, `${e.prenom} ${e.nom} (${e.classe})`])]} />
            <Input label="Type" value={addType} onChange={setAddType}
              options={[["abonne", "🔄 Abonné (récurrent)"], ["occasionnel", "⚡ Occasionnel (one shot)"]]} />
            <p style={{ fontSize: 12, color: C.textMuted, margin: "8px 0 16px" }}>
              {addType === "abonne" ? "L'élève aura sa place réservée chaque semaine." : "L'élève occupe une place libérée temporairement."}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn onClick={() => setAddingTo(null)} color={C.textMuted} outline>Annuler</Btn>
              <Btn onClick={addToSlot} disabled={!selectedEleve}>Ajouter</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ═══ ABSENCES ═══
const AbsencesPage = ({ creneaux, affectations, eleves, refresh }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(false);

  const dayName = useMemo(() => {
    const d = new Date(selectedDate);
    return ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][d.getDay()];
  }, [selectedDate]);

  const dayCreneaux = useMemo(() => {
    return creneaux.filter(cr => cr.jour === dayName).map(cr => {
      const assigned = affectations.filter(a => a.creneau_id === cr.id && a.actif);
      const students = assigned.map(a => {
        const el = eleves.find(e => e.id === a.eleve_id);
        const pres = presences.find(p => p.eleve_id === a.eleve_id && p.creneau_id === cr.id);
        return el ? { ...el, type_inscription: a.type_inscription, presence: pres } : null;
      }).filter(Boolean);
      return { ...cr, students };
    });
  }, [creneaux, affectations, eleves, dayName, presences]);

  const loadPresences = useCallback(async () => {
    setLoading(true);
    const data = await api.get("presences", `date_cours=eq.${selectedDate}`);
    setPresences(data || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { loadPresences(); }, [loadPresences]);

  const markAbsent = async (eleveId, creneauId, motif) => {
    await api.post("presences", { eleve_id: eleveId, date_cours: selectedDate, creneau_id: creneauId, statut: motif, heures: 0 });
    loadPresences();
  };

  const markPresent = async (eleveId, creneauId, heures = 2) => {
    await api.post("presences", { eleve_id: eleveId, date_cours: selectedDate, creneau_id: creneauId, statut: "present", heures });
    loadPresences();
  };

  const removePresence = async (presId) => {
    await api.del("presences", `id=eq.${presId}`);
    loadPresences();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 22 }}>📝</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Présences & Absences</h2>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          style={{ padding: "9px 14px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }} />
        <Badge color={C.accent}>{dayName}</Badge>
        {loading && <span style={{ fontSize: 12, color: C.textMuted }}>⏳ Chargement...</span>}
      </div>

      {dayCreneaux.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>😴</div>
          <div style={{ color: C.textMuted, fontSize: 14 }}>Pas de créneau le {dayName}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dayCreneaux.map(cr => (
            <div key={cr.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{cr.label}</span>
                <Badge color={C.purple}>{cr.students.length} élèves</Badge>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {cr.students.map(st => {
                  const hasRecord = st.presence;
                  const isAbsent = hasRecord && hasRecord.statut !== "present";
                  const isPresent = hasRecord && hasRecord.statut === "present";
                  return (
                    <div key={st.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isAbsent ? C.danger + "11" : isPresent ? C.success + "11" : C.surfaceLight, borderRadius: 8, padding: "8px 12px", border: `1px solid ${isAbsent ? C.danger + "33" : isPresent ? C.success + "33" : "transparent"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{st.prenom} {st.nom}</span>
                        {st.type_inscription === "occasionnel" && <Badge color={C.warning}>Occasionnel</Badge>}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {hasRecord ? (
                          <>
                            <Badge color={isAbsent ? C.danger : C.success}>{isAbsent ? `Absent (${hasRecord.statut.replace("absent_", "")})` : "Présent ✓"}</Badge>
                            <button onClick={() => removePresence(hasRecord.id)} style={{ background: "none", border: "none", color: C.textDim, fontSize: 11, cursor: "pointer" }}>↩</button>
                          </>
                        ) : (
                          <>
                            <Btn small onClick={() => markPresent(st.id, cr.id)} color={C.success}>✓ Présent</Btn>
                            <Btn small onClick={() => markAbsent(st.id, cr.id, "absent_maladie")} color={C.danger} outline>🤒</Btn>
                            <Btn small onClick={() => markAbsent(st.id, cr.id, "absent_voyage")} color={C.warning} outline>🚌</Btn>
                            <Btn small onClick={() => markAbsent(st.id, cr.id, "absent_autre")} color={C.textMuted} outline>❓</Btn>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══ MAIN APP ═══
const PAGES = [
  { key: "dashboard", icon: "🏠", label: "Tableau de bord" },
  { key: "eleves", icon: "👥", label: "Élèves" },
  { key: "creneaux", icon: "📅", label: "Créneaux" },
  { key: "absences", icon: "📝", label: "Présences" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [eleves, setEleves] = useState([]);
  const [creneaux, setCreneaux] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [e, c, a] = await Promise.all([
        api.get("eleves", "select=*"),
        api.get("creneaux", "select=*"),
        api.get("affectations_creneaux", "select=*"),
      ]);
      setEleves(e || []);
      setCreneaux(c || []);
      setAffectations(a || []);
      setError(null);
    } catch (err) {
      setError("Erreur de connexion à Supabase : " + err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const renderPage = () => {
    if (loading) return <Loading />;
    if (error) return (
      <div style={{ background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 14, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>⚠️</div>
        <div style={{ color: C.danger, fontSize: 14, marginBottom: 12 }}>{error}</div>
        <Btn onClick={loadData}>Réessayer</Btn>
      </div>
    );
    switch (page) {
      case "dashboard": return <DashboardPage eleves={eleves} creneaux={creneaux} affectations={affectations} />;
      case "eleves": return <ElevesPage eleves={eleves} refresh={loadData} />;
      case "creneaux": return <CreneauxPage creneaux={creneaux} affectations={affectations} eleves={eleves} refresh={loadData} />;
      case "absences": return <AbsencesPage creneaux={creneaux} affectations={affectations} eleves={eleves} refresh={loadData} />;
      default: return <DashboardPage eleves={eleves} creneaux={creneaux} affectations={affectations} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif", color: C.text, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <aside style={{ width: sidebarOpen ? 240 : 64, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "width 0.3s", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: sidebarOpen ? "16px" : "16px 8px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, minHeight: 60 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎓</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: C.text, whiteSpace: "nowrap" }}>Bulles de Savoir</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: error ? C.danger : C.success, marginRight: 4 }} />
                {error ? "Hors ligne" : "Connecté"}
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "10px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
          {PAGES.map(p => (
            <button key={p.key} onClick={() => setPage(p.key)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: sidebarOpen ? "9px 12px" : "9px 0", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.15s", background: page === p.key ? C.accent + "22" : "transparent", color: page === p.key ? C.accentLight : C.textMuted, justifyContent: sidebarOpen ? "flex-start" : "center", width: "100%" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
              {sidebarOpen && <span style={{ fontSize: 13, fontWeight: page === p.key ? 700 : 500 }}>{p.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: sidebarOpen ? "12px 16px" : "12px 8px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.success}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>HB</div>
          {sidebarOpen && <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>Hassan</div>}
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ padding: 10, border: "none", borderTop: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 14 }}>
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

