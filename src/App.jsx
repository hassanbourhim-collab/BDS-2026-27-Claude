import { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ═══════════════════════════════════════════════════════════════
// 🎓 BULLES DE SAVOIR — Application Live v4 (Palette colorée)
// ═══════════════════════════════════════════════════════════════

const SB_URL = "https://qkncmlmnbbgyjxqjpejm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbmNtbG1uYmJneWp4cWpwZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzU3MjMsImV4cCI6MjA4NjIxMTcyM30.29r2njN6DSAl4yCQR9tguqWARElsRfKDbX_Nivgx_ZE";
const hdrs = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
const api = {
  get: async (t, q = "") => { const r = await fetch(`${SB_URL}/rest/v1/${t}?${q}&order=id`, { headers: hdrs }); return r.ok ? r.json() : []; },
  post: async (t, d) => { const r = await fetch(`${SB_URL}/rest/v1/${t}`, { method: "POST", headers: hdrs, body: JSON.stringify(d) }); if (!r.ok) { const txt = await r.text(); console.error("[BDS] POST", t, r.status, txt); return null; } return r.json(); },
  patch: async (t, filter, d) => { const r = await fetch(`${SB_URL}/rest/v1/${t}?${filter}`, { method: "PATCH", headers: hdrs, body: JSON.stringify(d) }); return r.ok ? r.json() : null; },
  del: async (t, filter) => { const r = await fetch(`${SB_URL}/rest/v1/${t}?${filter}`, { method: "DELETE", headers: hdrs }); return r.ok; },
};

// ═══ NOUVELLE PALETTE COLORÉE (style ENT / Google Sheet) ═══
const C = {
  // Fond et surfaces
  bg: "#F5F7FA",           // Gris très clair
  surface: "#FFFFFF",       // Blanc
  surfaceLight: "#F0F4F8",  // Gris clair pour hover
  border: "#E0E6ED",        // Bordure gris clair
  
  // Couleurs principales
  accent: "#00BCD4",        // Cyan (boutons, liens)
  accentLight: "#4DD0E1",   // Cyan clair
  accentDark: "#0097A7",    // Cyan foncé
  
  // Couleurs sémantiques
  success: "#4CAF50",       // Vert vif
  warning: "#FF9800",       // Orange
  danger: "#F44336",        // Rouge
  
  // Texte
  text: "#333333",          // Texte principal
  textMuted: "#666666",     // Texte secondaire
  textDim: "#999999",       // Texte tertiaire
  
  // Couleurs d'accent supplémentaires
  gold: "#FFC107",          // Jaune/Or
  purple: "#9C27B0",        // Violet
  pink: "#E91E63",          // Rose/Magenta (sidebar)
  orange: "#FF9800",        // Orange (stages)
  blue: "#03A9F4",          // Bleu ciel (headers)
  
  // Sidebar
  sidebarBg: "#E91E63",     // Rose/Magenta
  sidebarText: "#FFFFFF",   // Blanc
  sidebarHover: "#C2185B",  // Rose foncé
};

const CLASSES = ["6ème","5ème","4ème","3ème","2nde","1ère","Tle","PostBac"];
const FORFAITS = { groupe: { l: "Groupe", c: C.blue, t: 15 }, individuel: { l: "Individuel", c: C.gold, t: 35 }, Triple: { l: "Triple", c: C.purple, t: 20 }, double: { l: "Double", c: C.pink, t: 25 }, stage: { l: "Stage", c: C.orange, t: 15 } };
const MOIS_LABELS = { "Août":"Août","Septembre":"Sept","Octobre":"Oct","Novembre":"Nov","Décembre":"Déc","Janvier":"Jan","Février":"Fév","Mars":"Mars","Avril":"Avr","Mai":"Mai","Juin":"Juin","Juillet":"Juil" };
const MOIS_ORDER = ["Août","Septembre","Octobre","Novembre","Décembre","Janvier","Février","Mars","Avril","Mai","Juin","Juillet"];
const JOURS_SEMAINE = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const JOURS_ALL = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const JOURS_STAGE = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];

// ═══ VACANCES ZONE B 2025-2026 ═══
const VACANCES_2526 = [
  { id: "toussaint", label: "🍂 Toussaint 25-26", s1d: "2025-10-20", s1f: "2025-10-24", s2d: "2025-10-27", s2f: "2025-10-31", samMilieu: "2025-10-25" },
  { id: "noel",      label: "🎄 Noël 25-26",      s1d: "2025-12-22", s1f: "2025-12-26", s2d: "2025-12-29", s2f: "2026-01-02", samMilieu: "2025-12-27" },
  { id: "hiver",     label: "❄️ Hiver 25-26",     s1d: "2026-02-16", s1f: "2026-02-20", s2d: "2026-02-23", s2f: "2026-02-27", samMilieu: "2026-02-21" },
  { id: "printemps", label: "🌸 Printemps 25-26",  s1d: "2026-04-13", s1f: "2026-04-17", s2d: "2026-04-20", s2f: "2026-04-24", samMilieu: "2026-04-18" },
];

// ═══ VACANCES ZONE B 2026-2027 ═══
// ⚠️ Dates approximatives Zone B — vérifier sur education.gouv.fr
const VACANCES_2627 = [
  { id: "toussaint_27", label: "🍂 Toussaint 26-27", s1d: "2026-10-19", s1f: "2026-10-23", s2d: "2026-10-26", s2f: "2026-10-30", samMilieu: "2026-10-24" },
  { id: "noel_27",      label: "🎄 Noël 26-27",      s1d: "2026-12-21", s1f: "2026-12-25", s2d: "2026-12-28", s2f: "2027-01-01", samMilieu: "2026-12-26" },
  { id: "hiver_27",     label: "❄️ Hiver 26-27",     s1d: "2027-02-15", s1f: "2027-02-19", s2d: "2027-02-22", s2f: "2027-02-26", samMilieu: "2027-02-20" },
  { id: "printemps_27", label: "🌸 Printemps 26-27", s1d: "2027-04-12", s1f: "2027-04-16", s2d: "2027-04-19", s2f: "2027-04-23", samMilieu: "2027-04-17" },
];

const ALL_VACANCES = [...VACANCES_2526, ...VACANCES_2627];
const PERIODES = ALL_VACANCES.map(v => [v.id, v.label]);

const getDateContext = (dateStr) => {
  const d = new Date(dateStr);
  const dow = d.getDay();
  for (const v of ALL_VACANCES) {
    if (dateStr === v.samMilieu) return { type: "samedi_milieu", vacance: v, semaine: null };
    if (dateStr >= v.s1d && dateStr <= v.s1f && dow >= 1 && dow <= 5) return { type: "vacances", vacance: v, semaine: 1 };
    if (dateStr >= v.s2d && dateStr <= v.s2f && dow >= 1 && dow <= 5) return { type: "vacances", vacance: v, semaine: 2 };
  }
  return { type: "hors_vacances", vacance: null, semaine: null };
};

const getSmartDay = () => {
  const today = new Date(); const todayStr = today.toISOString().split("T")[0];
  const ctx = getDateContext(todayStr); const dow = today.getDay();
  if (ctx.type === "hors_vacances" && dow >= 1 && dow <= 6) return { date: todayStr, isToday: true, ctx };
  if (ctx.type === "vacances") return { date: todayStr, isToday: true, ctx };
  for (let i = 1; i <= 7; i++) {
    const next = new Date(today); next.setDate(today.getDate() + i);
    const ns = next.toISOString().split("T")[0]; const nc = getDateContext(ns); const nd = next.getDay();
    if (nc.type === "vacances" && nd >= 1 && nd <= 5) return { date: ns, isToday: false, ctx: nc };
    if (nc.type === "hors_vacances" && nd >= 1 && nd <= 6) return { date: ns, isToday: false, ctx: nc };
  }
  return { date: todayStr, isToday: true, ctx };
};

const getMoisActuel = () => ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][new Date().getMonth()];

// ═══ PARAMÈTRES GLOBAUX ═══
const DEFAULT_SETTINGS = {
  nomStructure: "Bulles de Savoir",
  nomExpediteurSMS: "BdS Hassan",
  tarifGroupe: 15, tarifReduit: 20, tarifIndividuel: 35, tarifStage: 15, cotisation: 30,
  adresse: "", telephone: "", email: "", siret: "",
  anneeScolaire: "2025-2026",
  capaciteGroupe: 6, capaciteReduit: 3, capaciteDuo: 2, capaciteStage: 6,
};
const loadSettings = () => { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("bds_settings") || "{}") }; } catch { return { ...DEFAULT_SETTINGS }; } };
let _s = loadSettings();
const SettingsCtx = createContext(null);
const useSettings = () => useContext(SettingsCtx);

const tarifMode = (mode) => ({ individuel: _s.tarifIndividuel, Triple: _s.tarifReduit, double: _s.tarifReduit, groupe: _s.tarifGroupe, stage: _s.tarifStage }[mode] ?? 15);
const slotDur = (cr) => { if (!cr.heure_debut || !cr.heure_fin) return 2; const [h1,m1] = cr.heure_debut.split(":").map(Number); const [h2,m2] = cr.heure_fin.split(":").map(Number); return (h2 + (m2||0)/60) - (h1 + (m1||0)/60) || 2; };
const getWeekDates = (dateStr) => { const d = new Date(dateStr); const dow = d.getDay(); const diffToMon = dow === 0 ? -6 : 1 - dow; const mon = new Date(d); mon.setDate(d.getDate() + diffToMon); return Array.from({length: 6}, (_, i) => { const day = new Date(mon); day.setDate(mon.getDate() + i); return day.toISOString().split("T")[0]; }); };
const todayStr = () => new Date().toISOString().split("T")[0];
const getWeekNumber = (dateStr) => { const d = new Date(dateStr); d.setHours(0,0,0,0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const w1 = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7); };
const getNextOccurrences = (jour, fromDate, count = 10) => { const dayIdx = JOURS_SEMAINE.indexOf(jour); if (dayIdx < 0) return []; const dates = []; const d = new Date(fromDate); for (let i = 0; dates.length < count && i < 365; i++) { d.setDate(d.getDate() + 1); if (d.getDay() === dayIdx) dates.push(d.toISOString().split("T")[0]); } return dates; };
const fmtDateFr = (dateStr) => { const d = new Date(dateStr); return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}`; };
const getVacationWeekDates = (periodeId, semaine) => { const vac = ALL_VACANCES.find(v => v.id === periodeId); if (!vac) return []; const start = semaine === 1 ? vac.s1d : vac.s2d; const end = semaine === 1 ? vac.s1f : vac.s2f; const dates = []; const d = new Date(start + "T12:00:00"); const endD = new Date(end + "T12:00:00"); while (d <= endD) { if (d.getDay() >= 1 && d.getDay() <= 5) dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate() + 1); } return dates; };

// ═══ UI COMPONENTS ═══
const Badge = ({ children, color = C.accent, onClick, title }) => (
  <span onClick={onClick} title={title} style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "22", color, whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default" }}>{children}</span>
);

const KPI = ({ icon, label, value, sub, color = C.accent, onClick }) => (
  <div onClick={onClick} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    onMouseEnter={e => { if(onClick) { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; } }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}>
    <div style={{ position: "absolute", top: -10, right: -10, width: 70, height: 70, borderRadius: "50%", background: color + "15" }} />
    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{sub}</div>}
    {onClick && <div style={{ fontSize: 10, color, marginTop: 4, fontWeight: 600 }}>Cliquer pour détails →</div>}
  </div>
);

const Btn = ({ children, onClick, color = C.accent, small, disabled, outline, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{ padding: small ? "6px 14px" : "10px 20px", borderRadius: 8, border: outline ? `2px solid ${color}` : "none", background: outline ? "transparent" : disabled ? C.surfaceLight : color, color: outline ? color : "#fff", fontSize: small ? 12 : 13, fontWeight: 700, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", boxShadow: outline ? "none" : "0 2px 4px rgba(0,0,0,0.1)" }}>{children}</button>
);

const Input = ({ label, value, onChange, type = "text", options, placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, fontWeight: 700 }}>{label}</div>}
    {options ? <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `2px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `2px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, boxSizing: "border-box" }} />}
  </div>
);

const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (<div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, maxWidth: wide ? 800 : 550, width: "100%", maxHeight: "85vh", overflow: "auto", padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${C.border}`, background: C.pink, borderRadius: "20px 20px 0 0" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>);
};

// ═══ PAYMENT MODAL ═══
const PaymentModal = ({ open, onClose, eleves, preselectedEleve, refresh }) => {
  const [form, setForm] = useState({ eleve_id: "", montant: "", mode_paiement: "especes", mois_concerne: "", commentaire: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (preselectedEleve) setForm(f => ({ ...f, eleve_id: preselectedEleve })); }, [preselectedEleve]);
  const save = async () => { setSaving(true); await api.post("paiements", { ...form, montant: parseFloat(form.montant), date_paiement: new Date().toISOString().split("T")[0] }); setSaving(false); onClose(); setForm({ eleve_id: "", montant: "", mode_paiement: "especes", mois_concerne: "", commentaire: "" }); refresh(); };
  return (
    <Modal open={open} onClose={onClose} title="💳 Enregistrer un règlement">
      <Input label="Élève" value={form.eleve_id} onChange={v => setForm({...form, eleve_id: v})} options={[["", "— Choisir —"], ...eleves.filter(e=>e.actif).sort((a,b)=>a.nom.localeCompare(b.nom)).map(e => [e.id, `${e.prenom} ${e.nom}`])]} />
      <Input label="Montant (€)" value={form.montant} onChange={v => setForm({...form, montant: v})} type="number" placeholder="Ex: 120" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Mode" value={form.mode_paiement} onChange={v => setForm({...form, mode_paiement: v})} options={[["especes","💵 Espèces"],["cheque","📝 Chèque"],["virement","🏦 Virement"],["CB","💳 CB"]]} />
        <Input label="Mois concerné" value={form.mois_concerne} onChange={v => setForm({...form, mois_concerne: v})} options={[["","— Optionnel —"],...MOIS_ORDER.map(m => [m,m])]} />
      </div>
      <Input label="Commentaire" value={form.commentaire} onChange={v => setForm({...form, commentaire: v})} placeholder="Ex: Chèque n°1234" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
        <Btn onClick={onClose} color={C.textMuted} outline>Annuler</Btn>
        <Btn onClick={save} disabled={saving || !form.eleve_id || !form.montant} color={C.success}>{saving ? "..." : "✓ Enregistrer"}</Btn>
      </div>
    </Modal>
  );
};

// ═══ CRÉNEAU MODAL ═══
const CreneauModal = ({ open, onClose, creneau, creneaux, refresh }) => {
  const [form, setForm] = useState({ jour: "Lundi", heure_debut: "16:00", heure_fin: "17:00", mode: "groupe", capacite: 6, type_creneau: "regulier", periode_vacances: null, semaine_vacances: 1 });
  const [saving, setSaving] = useState(false);
  const [conflictMsg, setConflictMsg] = useState("");
  useEffect(() => {
    if (creneau) setForm({ jour: creneau.jour, heure_debut: creneau.heure_debut?.substring(0,5)||"16:00", heure_fin: creneau.heure_fin?.substring(0,5)||"17:00", mode: creneau.mode, capacite: creneau.capacite, type_creneau: creneau.type_creneau || "regulier", periode_vacances: creneau.periode_vacances || "toussaint", semaine_vacances: creneau.semaine_vacances || 1 });
    else setForm({ jour: "Lundi", heure_debut: "16:00", heure_fin: "17:00", mode: "groupe", capacite: 6, type_creneau: "regulier", periode_vacances: "toussaint", semaine_vacances: 1 });
    setConflictMsg("");
  }, [creneau, open]);
  const toMin = t => { const [h,m] = (t||"00:00").split(":").map(Number); return h*60+m; };
  const save = async () => {
    setConflictMsg("");
    const startMin = toMin(form.heure_debut);
    const endMin = toMin(form.heure_fin);
    if (endMin <= startMin) { setConflictMsg("L'heure de fin doit être après l'heure de début."); return; }
    const others = (creneaux||[]).filter(cr => {
      if (creneau && cr.id === creneau.id) return false;
      if (form.type_creneau === "regulier") return (cr.type_creneau||"regulier") === "regulier" && cr.jour === form.jour;
      return cr.type_creneau === "stage" && cr.periode_vacances === form.periode_vacances && (cr.semaine_vacances||1) === parseInt(form.semaine_vacances);
    });
    const conflict = others.find(cr => toMin(cr.heure_debut) < endMin && startMin < toMin(cr.heure_fin));
    if (conflict) { setConflictMsg(`⚠️ Conflit avec le créneau ${(conflict.heure_debut||"").substring(0,5)}-${(conflict.heure_fin||"").substring(0,5)}`); return; }
    setSaving(true);
    const data = { ...form, capacite: parseInt(form.capacite), periode_vacances: form.type_creneau === "stage" ? form.periode_vacances : null, semaine_vacances: form.type_creneau === "stage" ? parseInt(form.semaine_vacances) : null, jour: form.type_creneau === "stage" ? "Lundi" : form.jour };
    if (creneau) await api.patch("creneaux", `id=eq.${creneau.id}`, data);
    else await api.post("creneaux", data);
    setSaving(false); onClose(); refresh();
  };
  const isStage = form.type_creneau === "stage";
  return (
    <Modal open={open} onClose={onClose} title={creneau ? "✏️ Modifier créneau" : "➕ Nouveau créneau"}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["regulier","📅 Régulier"],["stage","🏖️ Vacances"]].map(([k,l]) => (
          <div key={k} onClick={() => setForm({...form, type_creneau: k})} style={{ flex: 1, padding: 12, borderRadius: 10, textAlign: "center", cursor: "pointer", border: `2px solid ${form.type_creneau===k?(k==="stage"?C.orange:C.accent):C.border}`, background: form.type_creneau===k?(k==="stage"?C.orange:C.accent)+"15":"transparent", color: form.type_creneau===k?C.text:C.textMuted, fontWeight: 700, fontSize: 14 }}>{l}</div>
        ))}
      </div>
      {isStage && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Période" value={form.periode_vacances||"toussaint"} onChange={v => setForm({...form, periode_vacances: v})} options={PERIODES} />
          <Input label="Semaine" value={form.semaine_vacances} onChange={v => setForm({...form, semaine_vacances: v})} options={[["1","Semaine 1"],["2","Semaine 2"]]} />
        </div>
      )}
      {isStage ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Début" value={form.heure_debut} onChange={v => setForm({...form, heure_debut: v})} type="time" />
          <Input label="Fin" value={form.heure_fin} onChange={v => setForm({...form, heure_fin: v})} type="time" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Input label="Jour" value={form.jour} onChange={v => setForm({...form, jour: v})} options={JOURS_ALL.map(j => [j, j])} />
          <Input label="Début" value={form.heure_debut} onChange={v => setForm({...form, heure_debut: v})} type="time" />
          <Input label="Fin" value={form.heure_fin} onChange={v => setForm({...form, heure_fin: v})} type="time" />
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Mode" value={form.mode} onChange={v => setForm({...form, mode: v})} options={Object.entries(FORFAITS).map(([k,v]) => [k, `${v.l} (${v.t}€/h)`])} />
        <Input label="Capacité" value={form.capacite} onChange={v => setForm({...form, capacite: v})} type="number" />
      </div>
      {isStage && <div style={{ background: C.orange+"15", borderRadius: 10, padding: 12, marginTop: 6, fontSize: 12, color: C.orange, border: `1px solid ${C.orange}33` }}>🏖️ Ce créneau apparaîtra <b>du lundi au vendredi</b> (semaine {form.semaine_vacances}) des vacances {ALL_VACANCES.find(v=>v.id===form.periode_vacances)?.label||""}.</div>}
      {conflictMsg && <div style={{ background: C.danger+"15", border: `2px solid ${C.danger}44`, borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 13, color: C.danger, fontWeight: 700 }}>{conflictMsg}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <Btn onClick={onClose} color={C.textMuted} outline>Annuler</Btn>
        <Btn onClick={save} disabled={saving} color={isStage?C.orange:C.accent}>{saving?"...":creneau?"Modifier":"Créer"}</Btn>
      </div>
    </Modal>
  );
};

// ═══ SLOT DETAIL MODAL ═══
const SlotDetailModal = ({ open, onClose, slot, eleves, affectations, refresh }) => {
  const [addEleve, setAddEleve] = useState("");
  const [addType, setAddType] = useState("abonne");
  const [addJours, setAddJours] = useState(JOURS_STAGE.map(() => true));
  const [addDatesOccasion, setAddDatesOccasion] = useState([]);
  if (!open || !slot) return null;
  const isStage = slot.type_creneau === "stage";
  const allAffs = affectations.filter(a => a.creneau_id === slot.id && a.actif);
  const students = allAffs.map(a => { const el = eleves.find(e => e.id === a.eleve_id); return el ? { ...el, affectation_id: a.id, type_inscription: a.type_inscription, jours_stage: a.jours_stage, dates_occasion: a.dates_occasion } : null; }).filter(Boolean);
  const jourCounts = isStage ? JOURS_STAGE.map(j => allAffs.filter(a => !a.jours_stage || a.jours_stage.includes(j)).length) : [];
  const removeStudent = async (affId) => { await api.del("affectations_creneaux", `id=eq.${affId}`); refresh(); };
  const addStudent = async () => {
    if (!addEleve) return;
    const joursStr = isStage ? JOURS_STAGE.filter((_, i) => addJours[i]).join(",") : null;
    const affData = { eleve_id: addEleve, creneau_id: slot.id, type_inscription: isStage ? "stage" : addType, actif: true, jours_stage: joursStr };
    const datesOcc = !isStage && addType === "occasionnel" && addDatesOccasion.length > 0 ? addDatesOccasion.join(",") : null;
    const created = await api.post("affectations_creneaux", affData);
    const newId = Array.isArray(created) ? created[0]?.id : created?.id;
    if (datesOcc && newId) await api.patch("affectations_creneaux", `id=eq.${newId}`, { dates_occasion: datesOcc });
    setAddEleve(""); setAddJours(JOURS_STAGE.map(() => true)); setAddDatesOccasion([]); refresh();
  };
  const periodeLabel = isStage ? PERIODES.find(p => p[0] === slot.periode_vacances)?.[1] || "" : "";
  const isRegularFull = !isStage && students.length >= slot.capacite;
  const needsDates = !isStage && addType === "occasionnel";
  const canAdd = !isRegularFull && (isStage ? addJours.some(Boolean) : (!needsDates || addDatesOccasion.length > 0));

  return (
    <Modal open={open} onClose={onClose} title={`${isStage?"Lun→Ven":slot.jour} ${(slot.heure_debut||"").substring(0,5)}-${(slot.heure_fin||"").substring(0,5)}`} wide>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||slot.mode} · {tarifMode(slot.mode)}€/h</Badge>
        {isStage && <Badge color={C.orange}>Stage {periodeLabel} — S{slot.semaine_vacances}</Badge>}
        {!isStage && <><Badge color={C.accent}>Régulier</Badge><Badge color={C.textMuted}>{students.length}/{slot.capacite} places</Badge></>}
      </div>

      {isStage && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {JOURS_STAGE.map((j, i) => {
            const full = jourCounts[i] >= slot.capacite;
            return (<div key={j} style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 10, background: full ? C.danger+"15" : C.surfaceLight, border: `2px solid ${full ? C.danger+"44" : C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: full ? C.danger : C.textMuted }}>{j.substring(0,3)}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: full ? C.danger : C.text }}>{jourCounts[i]}/{slot.capacite}</div>
            </div>);
          })}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, textTransform: "uppercase" }}>Élèves inscrits ({students.length})</div>
        {students.length === 0 ? <div style={{ color: C.textDim, fontSize: 13, padding: 20, textAlign: "center", background: C.surfaceLight, borderRadius: 10 }}>Aucun élève inscrit</div> :
          students.map(st => (
            <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: C.surfaceLight, marginBottom: 6, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{st.prenom} {st.nom}</span>
                <Badge color={C.purple}>{st.classe}</Badge>
                {isStage && st.jours_stage && <span style={{ fontSize: 11, color: C.orange, fontWeight: 600 }}>{st.jours_stage.split(",").map(j => j.substring(0,3)).join(" · ")}</span>}
                {!isStage && st.type_inscription === "occasionnel" && <Badge color={C.warning}>Occ.</Badge>}
              </div>
              <button onClick={() => removeStudent(st.affectation_id)} style={{ background: C.danger+"15", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>✕ Retirer</button>
            </div>
          ))
        }
      </div>

      <div style={{ borderTop: `2px solid ${C.border}`, paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, textTransform: "uppercase" }}>Inscrire un élève</div>
        {isRegularFull ? (
          <div style={{ background:C.danger+"15", border:`2px solid ${C.danger}44`, borderRadius:10, padding:"12px 16px", textAlign:"center", fontWeight:700, fontSize:14, color:C.danger }}>🚫 Créneau complet ({students.length}/{slot.capacite} places)</div>
        ) : (<>
          <Input label="Élève" value={addEleve} onChange={setAddEleve} options={[["","— Choisir —"], ...eleves.filter(e => e.actif && !students.find(s => s.id === e.id)).sort((a,b) => a.nom.localeCompare(b.nom)).map(e => [e.id, `${e.prenom} ${e.nom} (${e.classe})`])]} />
          {isStage ? (
            <div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>Jours de présence</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {JOURS_STAGE.map((j, i) => {
                  const full = jourCounts[i] >= slot.capacite;
                  const checked = addJours[i] && !full;
                  return (<label key={j} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px", borderRadius: 10, border: `2px solid ${checked ? C.orange : full ? C.danger+"44" : C.border}`, background: checked ? C.orange+"15" : full ? C.danger+"08" : "transparent", cursor: full ? "not-allowed" : "pointer", opacity: full ? 0.5 : 1 }}>
                    <input type="checkbox" checked={checked} disabled={full} onChange={() => { const nj = [...addJours]; nj[i] = !nj[i]; setAddJours(nj); }} style={{ accentColor: C.orange, width: 18, height: 18 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: checked ? C.orange : full ? C.danger : C.textMuted }}>{j.substring(0,3)}</span>
                    {full && <span style={{ fontSize: 9, color: C.danger }}>Complet</span>}
                  </label>);
                })}
              </div>
            </div>
          ) : (<>
            <Input label="Type" value={addType} onChange={v => { setAddType(v); setAddDatesOccasion([]); }} options={[["abonne","🔄 Abonné"],["occasionnel","⚡ Occasionnel"]]} />
            {addType === "occasionnel" && (() => {
              const nextDates = getNextOccurrences(slot.jour, todayStr(), 8);
              return (<div style={{ marginTop: 6, marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>Séances concernées <span style={{ color: C.warning }}>(cocher les dates)</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                  {nextDates.map(d => {
                    const sel = addDatesOccasion.includes(d);
                    return (<label key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 10px", borderRadius: 10, border: `2px solid ${sel ? C.warning : C.border}`, background: sel ? C.warning+"15" : "transparent", cursor: "pointer", minWidth: 56 }}>
                      <input type="checkbox" checked={sel} onChange={() => setAddDatesOccasion(prev => sel ? prev.filter(x => x !== d) : [...prev, d])} style={{ accentColor: C.warning, width: 16, height: 16 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: sel ? C.warning : C.text }}>{fmtDateFr(d)}</span>
                    </label>);
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.textDim }}>{addDatesOccasion.length} séance{addDatesOccasion.length > 1 ? "s" : ""} sélectionnée{addDatesOccasion.length > 1 ? "s" : ""}</div>
              </div>);
            })()}
          </>)}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={addStudent} disabled={!addEleve || !canAdd} color={C.success}>+ Inscrire</Btn>
          </div>
        </>)}
      </div>
    </Modal>
  );
};

// ═══ DASHBOARD ═══
const DashboardPage = ({ eleves, creneaux, affectations, suiviMensuel, paiements, presences, onNavigate }) => {
  const [classeOpen, setClasseOpen] = useState(false);
  const [retardsOpen, setRetardsOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payEleve, setPayEleve] = useState("");
  const [slotDetail, setSlotDetail] = useState(null);

  const actifs = eleves.filter(e => e.actif).length;
  const smart = getSmartDay();
  const dayName = JOURS_SEMAINE[new Date(smart.date).getDay()];

  const classeData = useMemo(() => { const c = {}; eleves.filter(e => e.actif).forEach(e => { if (e.classe) c[e.classe] = (c[e.classe]||0)+1; }); return CLASSES.map(cl => ({ name: cl, value: c[cl]||0 })).filter(d => d.value > 0); }, [eleves]);

  const creneauxOccupation = useMemo(() => creneaux.filter(cr => (cr.type_creneau||"regulier")==="regulier").map(cr => {
    const n = affectations.filter(a => a.creneau_id === cr.id && a.actif).length;
    return { name: `${cr.jour.substring(0,3)} ${(cr.heure_debut||"").substring(0,5)}-${(cr.heure_fin||"").substring(0,5)}`, occupes: n, capacite: cr.capacite, id: cr.id };
  }).filter(c => c.capacite > 1), [creneaux, affectations]);

  const caMensuel = useMemo(() => {
    const bm = {};
    suiviMensuel.forEach(s => { if (!bm[s.mois]) bm[s.mois] = { facture: 0, paye: 0 }; bm[s.mois].facture += parseFloat(s.montant_facture||0); });
    paiements.forEach(p => { if (p.mois_concerne && bm[p.mois_concerne]) bm[p.mois_concerne].paye += parseFloat(p.montant||0); });
    return MOIS_ORDER.filter(m => bm[m]).map(m => ({ name: MOIS_LABELS[m], Facturé: bm[m].facture, Payé: bm[m].paye }));
  }, [suiviMensuel, paiements]);

  const totalCA = suiviMensuel.reduce((s, x) => s + parseFloat(x.montant_facture||0), 0);
  const totalPaye = paiements.reduce((s, x) => s + parseFloat(x.montant||0), 0);

  const retards = useMemo(() => {
    const sol = {};
    suiviMensuel.forEach(s => { if (!sol[s.eleve_id]) sol[s.eleve_id] = { f: 0, p: 0 }; sol[s.eleve_id].f += parseFloat(s.montant_facture||0); });
    paiements.forEach(p => { if (!sol[p.eleve_id]) sol[p.eleve_id] = { f: 0, p: 0 }; sol[p.eleve_id].p += parseFloat(p.montant||0); });
    return Object.entries(sol).map(([id, s]) => { const el = eleves.find(e => e.id === id); return el && el.actif && s.p - s.f < 0 ? { ...el, facture: s.f, paye: s.p, solde: s.p - s.f } : null; }).filter(Boolean).sort((a, b) => a.solde - b.solde);
  }, [suiviMensuel, paiements, eleves]);

  const totalRetard = retards.reduce((s, r) => s + r.solde, 0);
  const pieColors = ["#03A9F4","#9C27B0","#E91E63","#FF9800","#4CAF50","#00BCD4","#FF5722","#3F51B5"];

  const nextCourseSlots = useMemo(() => {
    const ctx = smart.ctx;
    const rel = ctx.type === "vacances"
      ? creneaux.filter(cr => cr.type_creneau === "stage" && cr.periode_vacances === ctx.vacance?.id && cr.semaine_vacances === ctx.semaine)
      : creneaux.filter(cr => (cr.type_creneau||"regulier") === "regulier" && cr.jour === dayName);
    return rel.map(cr => { const sts = affectations.filter(a => a.creneau_id === cr.id && a.actif).map(a => eleves.find(e => e.id === a.eleve_id)).filter(Boolean); return { ...cr, students: sts }; });
  }, [creneaux, affectations, eleves, smart, dayName]);

  const ctxLabel = smart.ctx.type === "vacances" ? `🏕️ ${smart.ctx.vacance.label} S${smart.ctx.semaine}` : smart.ctx.type === "samedi_milieu" ? "😴 Samedi milieu" : "📚 Période scolaire";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div><h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Tableau de bord</h1><p style={{ color: C.textMuted, margin: "6px 0 0", fontSize: 14 }}>Données en direct — {new Date().toLocaleDateString("fr-FR")}</p></div>
        <div style={{ display: "flex", gap: 10 }}><Btn onClick={() => onNavigate("eleves", { action: "new" })} color={C.success}>+ Nouveau client</Btn><Btn onClick={() => setPayOpen(true)} color={C.pink}>+ Nouveau règlement</Btn></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KPI icon="👥" label="Élèves actifs" value={actifs} sub={`${eleves.length} au total`} color={C.blue} onClick={() => onNavigate("eleves")} />
        <KPI icon="📅" label="Créneaux" value={creneaux.length} sub={`${creneaux.filter(c=>(c.type_creneau||"regulier")==="regulier").length} rég. / ${creneaux.filter(c=>c.type_creneau==="stage").length} stages`} color={C.purple} onClick={() => onNavigate("creneaux")} />
        <KPI icon="💰" label="CA total" value={totalCA > 0 ? `${totalCA.toFixed(0)}€` : "—"} sub={totalPaye > 0 ? `${totalPaye.toFixed(0)}€ payés` : ""} color={C.success} />
        <KPI icon="🚨" label="Retards" value={retards.length > 0 ? `${Math.abs(totalRetard).toFixed(0)}€` : "—"} sub={retards.length > 0 ? `${retards.length} famille(s)` : "Aucun"} color={C.danger} onClick={retards.length > 0 ? () => setRetardsOpen(true) : null} />
      </div>

      {/* Prochain cours bandeau */}
      <div style={{ background: C.surface, border: `2px solid ${smart.ctx.type==="vacances"?C.orange:C.accent}`, borderRadius: 16, padding: 18, marginBottom: 24, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} onClick={() => onNavigate("planning", { date: smart.date })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 24 }}>📋</span><span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{smart.isToday ? `Aujourd'hui — ${dayName}` : `Prochain cours — ${dayName}`}</span><Badge color={smart.ctx.type==="vacances"?C.orange:C.accent}>{ctxLabel}</Badge></div>
          <span style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>Ouvrir le planning →</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {nextCourseSlots.length > 0 ? nextCourseSlots.map(sl => (
            <div key={sl.id} style={{ background: C.surfaceLight, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.border}`, flex: "1 1 150px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{(sl.heure_debut||"").substring(0,5)}-{(sl.heure_fin||"").substring(0,5)}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{sl.students.length}/{sl.capacite} — {sl.mode}</div>
            </div>
          )) : <div style={{ fontSize: 13, color: C.textDim }}>Aucun créneau prévu</div>}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>📊 Occupation créneaux <span style={{ fontSize: 11, color: C.textDim, fontWeight: 400 }}>(cliquez pour détails)</span></h3>
          <ResponsiveContainer width="100%" height={creneauxOccupation.length * 32 + 20}>
            <BarChart data={creneauxOccupation} layout="vertical" onClick={(e) => { if (e?.activePayload?.[0]) { const d = e.activePayload[0].payload; const cr = creneaux.find(c => c.id === d.id); if (cr) setSlotDetail(cr); } }}>
              <XAxis type="number" domain={[0, 6]} tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} />
              <RTooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13 }} />
              <Bar dataKey="occupes" name="Inscrits" fill={C.blue} radius={[0,6,6,0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>💰 CA mensuel</h3>
          {caMensuel.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={caMensuel}>
                <XAxis dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} />
                <RTooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13 }} formatter={v => [`${v.toFixed(0)}€`]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Facturé" fill={C.blue} radius={[6,6,0,0]} />
                <Bar dataKey="Payé" fill={C.success} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, color: C.textDim, fontSize: 14 }}>Après la première facturation</div>}
        </div>
      </div>

      {/* Classe */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div onClick={() => setClasseOpen(!classeOpen)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>🎓 Répartition par classe</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{classeData.map((d, i) => <span key={d.name} style={{ fontSize: 11, color: pieColors[i], fontWeight: 700 }}>{d.name}({d.value})</span>)}<span style={{ color: C.textMuted, fontSize: 16, marginLeft: 8 }}>{classeOpen?"▲":"▼"}</span></div>
        </div>
        {classeOpen && <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={classeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">{classeData.map((_, i) => <Cell key={i} fill={pieColors[i%pieColors.length]} />)}</Pie></PieChart></ResponsiveContainer>}
      </div>

      {/* Modals */}
      <Modal open={retardsOpen} onClose={() => setRetardsOpen(false)} title={`🚨 Retards — ${Math.abs(totalRetard).toFixed(0)}€`} wide>
        {retards.map(r => (<div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surfaceLight, borderRadius: 10, padding: "12px 16px", marginBottom: 8, borderLeft: `4px solid ${C.danger}` }}>
          <div><span style={{ fontWeight: 700, color: C.text, fontSize: 14, cursor: "pointer" }} onClick={() => { setRetardsOpen(false); onNavigate("eleves", { openId: r.id }); }}>{r.prenom} {r.nom}</span><span style={{ fontSize: 12, color: C.textMuted, marginLeft: 10 }}>{r.classe}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ textAlign: "right" }}><div style={{ fontWeight: 800, color: C.danger, fontSize: 16 }}>{r.solde.toFixed(0)}€</div></div><Btn small color={C.success} onClick={() => { setRetardsOpen(false); setPayEleve(r.id); setPayOpen(true); }}>💳</Btn></div>
        </div>))}
      </Modal>
      <PaymentModal open={payOpen} onClose={() => { setPayOpen(false); setPayEleve(""); }} eleves={eleves} preselectedEleve={payEleve} refresh={() => onNavigate("dashboard")} />
      <SlotDetailModal open={!!slotDetail} onClose={() => setSlotDetail(null)} slot={slotDetail} eleves={eleves} affectations={affectations} refresh={() => onNavigate("dashboard")} />
    </div>
  );
};

// ═══ VUE SEMAINE (style Pronote) ═══
const WeekView = ({ creneaux, affectations, presences, baseDate, onDayClick, onWeekChange }) => {
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const today = todayStr();

  const weekData = useMemo(() => weekDates.map(dateStr => {
    const ctx = getDateContext(dateStr);
    const dow = new Date(dateStr).getDay();
    const dayName = JOURS_SEMAINE[dow];
    let slots = [];
    if (ctx.type !== "samedi_milieu" && dow !== 0) {
      if (ctx.type === "vacances" && dow >= 1 && dow <= 5) {
        slots = creneaux.filter(cr => cr.type_creneau === "stage" && cr.periode_vacances === ctx.vacance?.id && cr.semaine_vacances === ctx.semaine);
      } else if (ctx.type === "hors_vacances" && dow >= 1 && dow <= 6) {
        slots = creneaux.filter(cr => (cr.type_creneau||"regulier") === "regulier" && cr.jour === dayName);
      }
    }
    const slotsWithData = slots.sort((a,b) => (a.heure_debut||"").localeCompare(b.heure_debut||"")).map(cr => {
      const aff = affectations.filter(a => a.creneau_id === cr.id && a.actif);
      // Count students expected on this specific date (handles abonné, occasionnel, old jours_stage)
      const inscribed = ctx.type === "vacances"
        ? aff.filter(a => {
            if (a.jours_stage) return a.jours_stage.includes(dayName); // rétro-compat ancien système
            if (a.type_inscription === "occasionnel" && a.dates_occasion) return a.dates_occasion.split(",").includes(dateStr);
            return true; // abonné ou stage sans restriction = toute la semaine
          }).length
        : aff.filter(a => {
            if (a.type_inscription === "occasionnel" && a.dates_occasion) return a.dates_occasion.split(",").includes(dateStr);
            return true; // abonné = toujours présent
          }).length;
      const dayPres = presences.filter(p => p.date_cours === dateStr && p.creneau_id === cr.id);
      const absJust = dayPres.filter(p => p.statut === "absent_justifie").length;
      // n = présents attendus = inscrits - absences prévenus
      const n = Math.max(0, inscribed - absJust);
      const pct = cr.capacite > 0 ? inscribed / cr.capacite : 0;
      const fillColor = pct >= 1 ? C.danger : pct >= 0.5 ? C.warning : inscribed > 0 ? C.success : C.textDim;
      const fillLabel = pct >= 1 ? "Complet" : pct >= 0.5 ? "Partiel" : inscribed > 0 ? "Libre" : "Vide";
      const appelFait = inscribed > 0 && dayPres.length >= inscribed;
      const isFuture = dateStr > today;
      return { ...cr, n, inscribed, pct, fillColor, fillLabel, appelFait, isFuture, absJust };
    });
    return { dateStr, ctx, dayName, dow, slots: slotsWithData, isToday: dateStr === today };
  }), [weekDates, creneaux, affectations, presences, today]);

  const d0 = new Date(weekDates[0]); const d5 = new Date(weekDates[5]);
  const wNum = getWeekNumber(weekDates[0]);
  const wLabel = `${d0.getDate()} ${d0.toLocaleDateString("fr-FR",{month:"short"})} — ${d5.getDate()} ${d5.toLocaleDateString("fr-FR",{month:"short",year:"numeric"})}`;
  const vacCtx = weekData.find(d => d.ctx.type === "vacances")?.ctx;

  const goPrev = () => { if (!onWeekChange) return; const d = new Date(weekDates[0]); d.setDate(d.getDate()-7); onWeekChange(d.toISOString().split("T")[0]); };
  const goNext = () => { if (!onWeekChange) return; const d = new Date(weekDates[0]); d.setDate(d.getDate()+7); onWeekChange(d.toISOString().split("T")[0]); };

  return (
    <div>
      {/* Bandeau semaine + navigation */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          {onWeekChange && <button onClick={goPrev} style={{ background:C.surfaceLight, border:`1px solid ${C.border}`, color:C.text, cursor:"pointer", width:32, height:32, borderRadius:8, fontWeight:800, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>‹</button>}
          <span style={{ background:C.accent+"20", color:C.accent, fontWeight:800, fontSize:13, padding:"4px 14px", borderRadius:20, border:`1px solid ${C.accent}44` }}>S{wNum}</span>
          <span style={{ fontSize:14, fontWeight:700, color:C.textMuted }}>{wLabel}</span>
          {vacCtx && <span style={{ background:C.orange+"20", color:C.orange, fontWeight:700, fontSize:12, padding:"4px 12px", borderRadius:20, border:`1px solid ${C.orange}44` }}>🏕️ {vacCtx.vacance.label} — S{vacCtx.semaine}</span>}
          {onWeekChange && <button onClick={goNext} style={{ background:C.surfaceLight, border:`1px solid ${C.border}`, color:C.text, cursor:"pointer", width:32, height:32, borderRadius:8, fontWeight:800, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>›</button>}
        </div>
        {onWeekChange && <button onClick={() => onWeekChange(today)} style={{ background:C.accent+"15", border:`1px solid ${C.accent}44`, color:C.accent, cursor:"pointer", padding:"5px 14px", borderRadius:8, fontWeight:700, fontSize:12 }}>Aujourd'hui</button>}
      </div>

      {/* Légende */}
      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        {[[C.success,"Libre"],[C.warning,"Partiel"],[C.danger,"Complet"],[C.blue,"Appel fait"]].map(([col,lbl]) => (
          <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.textMuted }}>
            <div style={{ width:12, height:12, borderRadius:3, background:lbl==="Appel fait"?col+"60":col, ...(lbl==="Appel fait"?{border:`1px solid ${col}`}:{}) }} />{lbl}
          </div>
        ))}
      </div>

      {/* Grille 6 colonnes */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:8 }}>
        {weekData.map(day => (
          <div key={day.dateStr}>
            {/* En-tête jour */}
            <div
              onClick={() => onDayClick(day.dateStr)}
              style={{ padding:"10px 6px", textAlign:"center", borderRadius:10, marginBottom:8, cursor:"pointer",
                background: day.isToday ? C.accent+"25" : C.surfaceLight,
                border: `2px solid ${day.isToday ? C.accent : C.border}`,
                transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor=C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor=day.isToday?C.accent:C.border}
            >
              <div style={{ fontSize:10, fontWeight:700, color:day.isToday?C.accent:C.textMuted, textTransform:"uppercase", letterSpacing:1 }}>{day.dayName.substring(0,3)}</div>
              <div style={{ fontSize:18, fontWeight:800, color:day.isToday?C.accent:C.text }}>{new Date(day.dateStr).getDate()}</div>
              {day.isToday && <div style={{ fontSize:9, color:C.accent, fontWeight:700, marginTop:2 }}>Aujourd'hui</div>}
            </div>

            {/* Contenu du jour */}
            {day.ctx.type === "samedi_milieu" ? (
              <div style={{ fontSize:10, color:C.textDim, textAlign:"center", padding:"12px 4px", background:C.surfaceLight, borderRadius:8, border:`1px dashed ${C.border}` }}>Milieu vac.</div>
            ) : day.slots.length === 0 ? (
              <div style={{ fontSize:10, color:C.textDim, textAlign:"center", padding:"20px 4px" }}>—</div>
            ) : (
              day.slots.map(slot => (
                <div
                  key={slot.id}
                  onClick={() => onDayClick(day.dateStr)}
                  style={{ background: slot.appelFait ? C.blue+"15" : slot.fillColor+"15",
                    border: `2px solid ${slot.appelFait ? C.blue+"66" : slot.fillColor+"55"}`,
                    borderLeft: `4px solid ${slot.appelFait ? C.blue : slot.fillColor}`,
                    borderRadius:10, padding:"8px 8px", marginBottom:6, cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
                >
                  <div style={{ fontSize:12, fontWeight:800, color:C.text }}>{(slot.heure_debut||"").substring(0,5)}</div>
                  <div style={{ fontSize:10, color:C.textMuted, marginBottom:3 }}>{(slot.heure_fin||"").substring(0,5)}</div>
                  <div style={{ display:"flex", gap:2, marginBottom:4 }}>
                    {Array.from({length: Math.min(slot.capacite, 8)}).map((_, j) => (
                      <div key={j} style={{ flex:1, height:4, borderRadius:2, background: j < slot.inscribed ? slot.fillColor : C.border }} />
                    ))}
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color: slot.appelFait ? C.blue : slot.fillColor }}>
                    {slot.n}/{slot.capacite}
                    {slot.absJust > 0 && !slot.appelFait && <span style={{ fontWeight:400, color:C.warning, fontSize:9 }}> (−{slot.absJust})</span>}
                  </div>
                  {slot.appelFait ? (
                    <div style={{ fontSize:9, color:C.blue, fontWeight:700, marginTop:2 }}>✓ Appel fait</div>
                  ) : slot.inscribed > 0 && slot.isFuture ? (
                    <div style={{ fontSize:9, color:C.accent, fontWeight:600, marginTop:2 }}>→ Faire l'appel</div>
                  ) : slot.inscribed > 0 ? (
                    <div style={{ fontSize:9, color:C.warning, fontWeight:700, marginTop:2 }}>⚡ En attente</div>
                  ) : null}
                  <div style={{ fontSize:9, color:C.textDim, marginTop:2 }}>{(FORFAITS[slot.mode]||{}).l||slot.mode}</div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══ MODAL VALIDATION SÉANCE & FACTURATION ═══
const ValidationSeanceModal = ({ open, onClose, slot, dateStr, students, suiviMensuel, refresh }) => {
  const [mois, setMois] = useState(getMoisActuel());
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setMois(getMoisActuel()); }, [open]);
  if (!open || !slot) return null;

  const tarif = tarifMode(slot.mode);
  const dur = slotDur(slot);

  // Présents (facturation réelle) + absents non justifiés (facturés quand même)
  const aFacturer = students.filter(st =>
    st.presence?.statut === "present" || st.presence?.statut === "absent_non_justifie"
  ).map(st => {
    const isPresent = st.presence.statut === "present";
    const hrs = isPresent ? parseFloat(st.presence.heures || dur) : dur;
    return { ...st, hrs, montant: tarif * hrs, isPresent };
  });

  const nonMarques = students.filter(st => !st.presence);
  const absJustifies = students.filter(st => st.presence?.statut === "absent_justifie");
  const grandTotal = aFacturer.reduce((s, st) => s + st.montant, 0);

  // Groupement par famille (nom_parent1)
  const familles = {};
  aFacturer.forEach(st => {
    const fkey = st.nom_parent1?.trim() || `${st.prenom} ${st.nom}`;
    if (!familles[fkey]) familles[fkey] = { label: fkey, students: [], total: 0 };
    familles[fkey].students.push(st);
    familles[fkey].total += st.montant;
  });

  // Vérifie si déjà facturé ce mois
  const existingFor = (eid) => suiviMensuel.find(s => s.eleve_id === eid && s.mois === mois);

  const validate = async () => {
    setSaving(true);
    for (const st of aFacturer) {
      const ex = existingFor(st.id);
      if (ex) {
        await api.patch("suivi_mensuel", `id=eq.${ex.id}`, { montant_facture: parseFloat(ex.montant_facture || 0) + st.montant });
      } else {
        await api.post("suivi_mensuel", { eleve_id: st.id, mois, montant_facture: st.montant });
      }
    }
    setSaving(false); onClose(); refresh();
  };

  const dateLabel = new Date(dateStr).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
  const slotLabel = `${(slot.heure_debut||"").substring(0,5)}–${(slot.heure_fin||"").substring(0,5)}`;

  return (
    <Modal open={open} onClose={onClose} title="💶 Validation séance & Facturation" wide>
      {/* En-tête séance */}
      <div style={{ background: C.surfaceLight, borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{dateLabel} · {slotLabel}</span>
        <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||slot.mode} · {tarif}€/h</Badge>
        <Badge color={C.textMuted}>{students.length} élève{students.length>1?"s":""}</Badge>
      </div>

      {/* Avertissement non marqués */}
      {nonMarques.length > 0 && (
        <div style={{ background: C.warning+"15", border: `2px solid ${C.warning}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.warning, fontWeight: 600 }}>
          ⚠️ {nonMarques.length} élève{nonMarques.length>1?"s":""} non marqué{nonMarques.length>1?"s":""} : {nonMarques.map(st => `${st.prenom} ${st.nom}`).join(", ")}
        </div>
      )}

      {/* Absents justifiés (non facturés) */}
      {absJustifies.length > 0 && (
        <div style={{ background: C.blue+"10", border: `1px solid ${C.blue}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.blue }}>
          💬 Non facturés (absents prévenus) : {absJustifies.map(st => `${st.prenom} ${st.nom}`).join(", ")}
        </div>
      )}

      {/* Tableau par famille */}
      {aFacturer.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: C.textMuted, fontSize: 14 }}>
          Aucun élève à facturer pour cette séance.
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>
            Facturation par famille
          </div>
          {Object.entries(familles).map(([fkey, fam]) => {
            const exTotal = fam.students.reduce((s, st) => s + parseFloat(existingFor(st.id)?.montant_facture || 0), 0);
            return (
              <div key={fkey} style={{ background: C.surfaceLight, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
                {/* En-tête famille */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>👨‍👩‍👧</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Famille {fkey}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: C.success }}>{fam.total.toFixed(0)}€</div>
                    {exTotal > 0 && <div style={{ fontSize: 11, color: C.textMuted }}>Déjà facturé ce mois : {exTotal.toFixed(0)}€ → nouveau total : {(exTotal + fam.total).toFixed(0)}€</div>}
                  </div>
                </div>
                {/* Détail élèves */}
                {fam.students.map(st => (
                  <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: st.isPresent ? C.success+"10" : C.danger+"10", border: `1px solid ${st.isPresent ? C.success+"33" : C.danger+"33"}`, marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>{st.isPresent ? "✓" : "❌"}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{st.prenom} {st.nom}</span>
                      <Badge color={C.purple}>{st.classe}</Badge>
                      {!st.isPresent && <Badge color={C.danger}>Non prévenu</Badge>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: st.isPresent ? C.success : C.danger }}>
                      {st.isPresent ? `${st.hrs}h × ${tarif}€` : `${dur}h × ${tarif}€`} = {st.montant.toFixed(0)}€
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Total + mois */}
      {aFacturer.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.success+"15", border: `2px solid ${C.success}44`, borderRadius: 12, padding: "14px 18px", marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Total séance à facturer</span>
            <span style={{ fontWeight: 800, fontSize: 24, color: C.success }}>{grandTotal.toFixed(0)}€</span>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Imputer au mois</div>
            <select value={mois} onChange={e => setMois(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `2px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }}>
              {MOIS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn onClick={onClose} color={C.textMuted} outline>Annuler</Btn>
        {aFacturer.length > 0 && (
          <Btn onClick={validate} disabled={saving} color={C.success}>
            {saving ? "⏳ Enregistrement..." : `✓ Confirmer la facturation — ${grandTotal.toFixed(0)}€`}
          </Btn>
        )}
      </div>
    </Modal>
  );
};

// ═══ PLANNING PRONOTE ═══
const PlanningPage = ({ creneaux, affectations, eleves, presences, suiviMensuel, refresh, initialDate }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || getSmartDay().date);
  const [viewMode, setViewMode] = useState("week"); // "week" | "day"
  const [localPresences, setLocalPresences] = useState([]);
  const [saving, setSaving] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [addEleve, setAddEleve] = useState("");
  const [addType, setAddType] = useState("abonne");
  const [addJours, setAddJours] = useState(JOURS_STAGE.map(() => true));
  const [addHeuresDef, setAddHeuresDef] = useState(null); // durée par défaut pour cet élève
  const [showNewEleve, setShowNewEleve] = useState(false);
  const [newEleveData, setNewEleveData] = useState({ prenom:"", nom:"", classe:"6ème", forfait:"groupe", nom_parent1:"", tel_parent1:"" });
  const [addHoursChecks, setAddHoursChecks] = useState([]); // per-hour checkboxes for slots ≥ 2h
  const [addDatesOccasion, setAddDatesOccasion] = useState([]); // dates sélectionnées pour occasionnel
  const [slotDetail, setSlotDetail] = useState(null);
  const [arretModal, setArretModal] = useState(null); // { st, slot }
  const [validatingSlot, setValidatingSlot] = useState(null); // slot with students

  const addingJourCounts = useMemo(() => {
    if (!addingTo || addingTo.type_creneau !== "stage") return [];
    const affs = affectations.filter(a => a.creneau_id === addingTo.id && a.actif);
    return JOURS_STAGE.map(j => affs.filter(a => !a.jours_stage || a.jours_stage.includes(j)).length);
  }, [addingTo, affectations]);

  const dayName = useMemo(() => JOURS_SEMAINE[new Date(selectedDate).getDay()], [selectedDate]);
  const dateCtx = useMemo(() => getDateContext(selectedDate), [selectedDate]);
  const dow = new Date(selectedDate).getDay();

  const isCoursDay = useMemo(() => {
    if (dateCtx.type === "samedi_milieu") return false;
    if (dateCtx.type === "vacances") return dow >= 1 && dow <= 5;
    return dow >= 1 && dow <= 6;
  }, [dateCtx, dow]);

  const loadPresences = useCallback(async () => { const d = await api.get("presences", `date_cours=eq.${selectedDate}`); setLocalPresences(d||[]); }, [selectedDate]);
  useEffect(() => { loadPresences(); }, [loadPresences]);

  const daySlots = useMemo(() => {
    let rel;
    if (dateCtx.type === "vacances") {
      rel = creneaux.filter(cr => cr.type_creneau === "stage" && cr.periode_vacances === dateCtx.vacance?.id && (cr.semaine_vacances === dateCtx.semaine || cr.semaine_vacances === null));
    } else {
      rel = creneaux.filter(cr => (cr.type_creneau||"regulier") === "regulier" && cr.jour === dayName);
    }
    return rel.map(cr => {
      const assigned = affectations.filter(a => a.creneau_id === cr.id && a.actif);
      const students = assigned.map(a => {
        if (cr.type_creneau === "stage" && a.jours_stage && !a.jours_stage.includes(dayName)) return null;
        if (a.type_inscription === "occasionnel" && a.dates_occasion && !a.dates_occasion.split(",").includes(selectedDate)) return null;
        const el = eleves.find(e => e.id === a.eleve_id); const pres = localPresences.find(p => p.eleve_id === a.eleve_id && p.creneau_id === cr.id); return el ? { ...el, type_inscription: a.type_inscription, presence: pres, affectation_id: a.id, jours_stage: a.jours_stage, heures_defaut: a.heures_defaut || null, dates_occasion: a.dates_occasion || null } : null;
      }).filter(Boolean);
      return { ...cr, students, dur: slotDur(cr) };
    });
  }, [creneaux, affectations, eleves, dayName, localPresences, dateCtx]);

  const markPresent = async (eid, cid, h) => { setSaving(true); await api.post("presences", { eleve_id: eid, date_cours: selectedDate, creneau_id: cid, statut: "present", heures: h }); await loadPresences(); setSaving(false); };
  const markAbsent = async (eid, cid, m) => { setSaving(true); await api.post("presences", { eleve_id: eid, date_cours: selectedDate, creneau_id: cid, statut: m, heures: 0 }); await loadPresences(); setSaving(false); };
  const removePresence = async (pid) => { await api.del("presences", `id=eq.${pid}`); await loadPresences(); };
  const markAllPresent = async (slot) => { setSaving(true); for (const st of slot.students) { if (!st.presence) await api.post("presences", { eleve_id: st.id, date_cours: selectedDate, creneau_id: slot.id, statut: "present", heures: st.heures_defaut || slot.dur }); } await loadPresences(); setSaving(false); };
  const adjustDuration = async (pid, newH) => { if (newH < 0.5) return; await api.patch("presences", `id=eq.${pid}`, { heures: newH }); await loadPresences(); };
  const handleArretDefinitif = async (eleveId, creneauId) => { await api.patch("affectations_creneaux", `eleve_id=eq.${eleveId}&creneau_id=eq.${creneauId}&actif=eq.true`, { actif: false }); setArretModal(null); refresh(); };
  const addOcc = async () => {
    if (!addEleve || !addingTo) return;
    const affData = { eleve_id: addEleve, creneau_id: addingTo.id, type_inscription: addType, actif: true, jours_stage: null };
    const checkedCount = addHoursChecks.filter(Boolean).length;
    if (addHoursChecks.length > 0 && checkedCount < addHoursChecks.length) affData.heures_defaut = checkedCount;
    else if (addHeuresDef) affData.heures_defaut = addHeuresDef;
    const datesOcc = addType === "occasionnel" && addDatesOccasion.length > 0 ? addDatesOccasion.join(",") : null;
    const created = await api.post("affectations_creneaux", affData);
    const newId = Array.isArray(created) ? created[0]?.id : created?.id;
    if (datesOcc && newId) await api.patch("affectations_creneaux", `id=eq.${newId}`, { dates_occasion: datesOcc });
    await refresh();
    setAddingTo(null); setAddEleve(""); setAddType("abonne"); setAddJours(JOURS_STAGE.map(() => true)); setAddHeuresDef(null); setAddHoursChecks([]); setAddDatesOccasion([]);
  };
  const resetAddModal = () => { setAddingTo(null); setAddEleve(""); setAddType("abonne"); setAddJours(JOURS_STAGE.map(() => true)); setAddHeuresDef(null); setAddHoursChecks([]); setAddDatesOccasion([]); setShowNewEleve(false); setNewEleveData({ prenom:"", nom:"", classe:"6ème", forfait:"groupe", nom_parent1:"", tel_parent1:"" }); };
  const addNewEleveAndInscribe = async () => {
    if (!newEleveData.prenom || !newEleveData.nom || !addingTo) return;
    const created = await api.post("eleves", { ...newEleveData, actif: true });
    const newId = Array.isArray(created) ? created[0]?.id : created?.id;
    if (!newId) return;
    const affData = { eleve_id: newId, creneau_id: addingTo.id, type_inscription: addType, actif: true, jours_stage: null };
    const checkedCount = addHoursChecks.filter(Boolean).length;
    if (addHoursChecks.length > 0 && checkedCount < addHoursChecks.length) affData.heures_defaut = checkedCount;
    const datesOcc = addType === "occasionnel" && addDatesOccasion.length > 0 ? addDatesOccasion.join(",") : null;
    const createdAff = await api.post("affectations_creneaux", affData);
    const newAffId = Array.isArray(createdAff) ? createdAff[0]?.id : createdAff?.id;
    if (datesOcc && newAffId) await api.patch("affectations_creneaux", `id=eq.${newAffId}`, { dates_occasion: datesOcc });
    await refresh();
    resetAddModal();
  };

  const stats = useMemo(() => { let t=0,p=0,a=0,pe=0; daySlots.forEach(s => s.students.forEach(st => { t++; if(st.presence){st.presence.statut==="present"?p++:a++;}else pe++; })); return { t,p,a,pe }; }, [daySlots]);

  const moveDate = (dir) => { const d = new Date(selectedDate); d.setDate(d.getDate()+dir); setSelectedDate(d.toISOString().split("T")[0]); };
  const moveWeek = (dir) => { const d = new Date(selectedDate); d.setDate(d.getDate()+dir*7); setSelectedDate(d.toISOString().split("T")[0]); };
  const ctxColor = dateCtx.type==="vacances"?C.orange:dateCtx.type==="samedi_milieu"?C.textDim:C.accent;
  const ctxLabel = dateCtx.type==="vacances"?`🏖️ Vacances ${dateCtx.vacance.label} — Semaine ${dateCtx.semaine}`:dateCtx.type==="samedi_milieu"?"😴 Samedi milieu — pas de cours":"📚 Période scolaire";

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}><span style={{ fontSize:26 }}>📋</span><h2 style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>Planning — Appel</h2></div>
        {/* Toggle Vue */}
        <div style={{ display:"flex", gap:4, background:C.surfaceLight, borderRadius:10, padding:4, border:`1px solid ${C.border}` }}>
          {[["week","📅 Semaine"],["day","📋 Jour"]].map(([k,l]) => (
            <button key={k} onClick={() => setViewMode(k)} style={{ padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", background:viewMode===k?C.accent:"transparent", color:viewMode===k?"#fff":C.textMuted, fontSize:13, fontWeight:700, transition:"all 0.15s" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Barre de navigation */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
        <Btn small onClick={() => viewMode==="week" ? moveWeek(-1) : moveDate(-1)} color={C.textMuted} outline>{viewMode==="week"?"◀◀":"◀"}</Btn>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding:"10px 16px", background:C.surface, border:`2px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:15, fontWeight:600 }} />
        <Btn small onClick={() => viewMode==="week" ? moveWeek(1) : moveDate(1)} color={C.textMuted} outline>{viewMode==="week"?"▶▶":"▶"}</Btn>
        <Btn small onClick={() => setSelectedDate(todayStr())} color={C.accent} outline>Aujourd'hui</Btn>
        {viewMode==="day" && <Badge color={isCoursDay?C.accent:C.textDim}>{dayName}</Badge>}
        {saving && <span style={{ fontSize:13, color:C.warning }}>⏳ Enregistrement...</span>}
      </div>

      {/* Vue Semaine */}
      {viewMode === "week" && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", marginBottom:20 }}>
          <WeekView
            creneaux={creneaux}
            affectations={affectations}
            presences={localPresences}
            baseDate={selectedDate}
            onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }}
            onWeekChange={(date) => setSelectedDate(date)}
          />
        </div>
      )}

      {/* Vue Jour */}
      {viewMode === "day" && <>
        <div style={{ background:ctxColor+"15", border:`2px solid ${ctxColor}44`, borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:14, color:ctxColor, fontWeight:700 }}>{ctxLabel}</div>

        {isCoursDay && daySlots.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <Badge color={C.text}>{stats.t} élèves</Badge><Badge color={C.success}>✓ {stats.p}</Badge><Badge color={C.danger}>✗ {stats.a}</Badge>
            {stats.pe > 0 && <Badge color={C.warning}>⏳ {stats.pe}</Badge>}
          </div>
        )}

      {!isCoursDay ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 50, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 50, marginBottom: 12 }}>😴</div>
          <div style={{ color: C.textMuted, fontSize: 15 }}>Pas de cours le {dayName}{dateCtx.type==="samedi_milieu"?" (milieu vacances)":""}</div>
        </div>
      ) : daySlots.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 50, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 50, marginBottom: 12 }}>{dateCtx.type==="vacances"?"🏕️":"📅"}</div>
          <div style={{ color: C.textMuted, fontSize: 15 }}>Aucun créneau {dateCtx.type==="vacances"?`vacances (${dateCtx.vacance.label} S${dateCtx.semaine})`:"régulier"} pour {dayName}</div>
          <div style={{ color: C.textDim, fontSize: 13, marginTop: 8 }}>Créez-en depuis la page Créneaux</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {daySlots.map(slot => {
            const allDone = slot.students.length > 0 && slot.students.every(st => st.presence);
            const tarif = tarifMode(slot.mode);
            const absJustifies = slot.students.filter(st => st.presence?.statut === "absent_justifie").length;
            const placesProvisoires = absJustifies;
            const placesLibres = slot.capacite - slot.students.filter(st => st.type_inscription !== "occasionnel").length;
            return (
                <div key={slot.id} style={{ background: C.surface, border: `2px solid ${allDone?C.success:C.border}`, borderRadius: 16, padding: 18, borderLeft: `5px solid ${allDone?C.success:dateCtx.type==="vacances"?C.orange:C.accent}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap:"wrap", gap:8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap:"wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: 18, color: C.text }}>{(slot.heure_debut||"").substring(0,5)} — {(slot.heure_fin||"").substring(0,5)}</span>
                      <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||"Groupe"} · {tarif}€/h</Badge>
                      <Badge color={C.textMuted}>{slot.students.length}/{slot.capacite}</Badge>
                      {slot.type_creneau==="stage" && <Badge color={C.orange}>🏖️ Vacances S{slot.semaine_vacances} · {dayName}</Badge>}
                      {placesProvisoires > 0 && <Badge color={C.warning}>💬 {placesProvisoires} place{placesProvisoires>1?"s":""} provisoire{placesProvisoires>1?"s":""}</Badge>}
                      {placesLibres > 0 && slot.students.length < slot.capacite && !placesProvisoires && <Badge color={C.success}>🟢 {placesLibres} place{placesLibres>1?"s":""} libre{placesLibres>1?"s":""}</Badge>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {!allDone && slot.students.length > 0 && <Btn small color={C.success} onClick={() => markAllPresent(slot)} title="Tous présents">✓ Tous</Btn>}
                      {slot.students.length < slot.capacite && <Btn small color={C.purple} outline onClick={() => { setAddingTo(slot); setAddEleve(""); setAddJours(JOURS_STAGE.map(() => true)); }}>+ Élève</Btn>}
                      {allDone && slot.students.length > 0 && (
                        <Btn small color={C.success} onClick={() => setValidatingSlot({ ...slot })} title="Valider la séance et générer la facturation">
                          💶 Valider & Facturer
                        </Btn>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {slot.students.map(st => {
                      const p = st.presence;
                      const isP = p && p.statut === "present";
                      const isAJ = p && p.statut === "absent_justifie";
                      const isANJ = p && p.statut === "absent_non_justifie";
                      const hrs = p ? parseFloat(p.heures||0) : slot.dur;
                      const montant = tarif * hrs;
                      const rowBg = isP ? C.success+"12" : isAJ ? C.warning+"12" : isANJ ? C.danger+"12" : C.surfaceLight;
                      const rowBorder = isP ? C.success+"44" : isAJ ? C.warning+"44" : isANJ ? C.danger+"44" : C.border;
                      return (
                        <div key={st.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: rowBg, border: `2px solid ${rowBorder}` }}>
                          {/* Infos élève */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap:"wrap" }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{st.prenom} {st.nom}</span>
                            {st.jours_stage && st.jours_stage.split(",").length < 5 && <span style={{ fontSize: 10, color: C.orange, fontWeight: 600 }}>{st.jours_stage.split(",").length}j</span>}
                            {st.type_inscription==="occasionnel" && <Badge color={C.warning}>⚡ Occ.{st.dates_occasion ? ` (${st.dates_occasion.split(",").length}×)` : ""}</Badge>}
                            {st.heures_defaut && st.heures_defaut !== slot.dur && <Badge color={C.purple}>{st.heures_defaut}h</Badge>}
                            <span style={{ fontSize: 11, color: C.textDim }}>{st.classe}</span>
                            {/* Arrêt définitif */}
                            {!p && st.type_inscription !== "occasionnel" && (
                              <button onClick={() => setArretModal({ st, slot })} title="Arrêt définitif — libère la place permanently" style={{ background: C.danger+"15", border: `1px solid ${C.danger}33`, color: C.danger, cursor: "pointer", fontSize: 10, padding: "2px 7px", borderRadius: 6, fontWeight: 700 }}>🚪 Arrêt</button>
                            )}
                          </div>
                          {/* Actions / Statut */}
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink:0 }}>
                            {p ? (
                              <>
                                {/* Présent : afficher durée ajustable */}
                                {isP && (
                                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                    <button onClick={() => adjustDuration(p.id, Math.round((hrs-0.5)*2)/2)} style={{ background:C.surfaceLight, border:`1px solid ${C.border}`, color:C.text, cursor:"pointer", width:24, height:24, borderRadius:6, fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                                    <span style={{ fontSize:13, fontWeight:700, color:C.success, minWidth:32, textAlign:"center" }}>{hrs}h</span>
                                    <button onClick={() => adjustDuration(p.id, Math.round((hrs+0.5)*2)/2)} style={{ background:C.surfaceLight, border:`1px solid ${C.border}`, color:C.text, cursor:"pointer", width:24, height:24, borderRadius:6, fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                                    <span style={{ fontSize:12, fontWeight:700, color:C.success, marginLeft:2 }}>{montant.toFixed(0)}€</span>
                                  </div>
                                )}
                                {/* Absent justifié */}
                                {isAJ && (
                                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    <Badge color={C.warning}>🏥 Prévenu</Badge>
                                    <span style={{ fontSize:11, color:C.warning, fontWeight:600 }}>Non facturé</span>
                                    <Badge color={C.blue}>💬 Place provisoire</Badge>
                                  </div>
                                )}
                                {/* Absent non justifié */}
                                {isANJ && (
                                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    <Badge color={C.danger}>❌ Non prévenu</Badge>
                                    <span style={{ fontSize:11, color:C.danger, fontWeight:600 }}>Facturé {(tarif*slot.dur).toFixed(0)}€</span>
                                  </div>
                                )}
                                <button onClick={() => removePresence(p.id)} title="Annuler le statut" style={{ background: C.surfaceLight, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>↩</button>
                              </>
                            ) : (
                              <>
                                <Btn small onClick={() => markPresent(st.id, slot.id, st.heures_defaut || slot.dur)} color={C.success} title="Présent — facturé">✓ Présent</Btn>
                                <Btn small onClick={() => markAbsent(st.id, slot.id, "absent_justifie")} color={C.warning} outline title="Absent prévenu — non facturé, place provisoire">🏥 Prévenu</Btn>
                                <Btn small onClick={() => markAbsent(st.id, slot.id, "absent_non_justifie")} color={C.danger} outline title="Absent non prévenu — facturé quand même">❌ Non prévenu</Btn>
                              </>
                            )}
                          </div>
                        </div>);
                    })}
                  </div>
                  {slot.students.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.textDim, fontSize: 13 }}>Créneau vide — ajoutez des élèves depuis la page Créneaux ou cliquez + Élève</div>}
                </div>
            );
          })}
        </div>
      )}
      </>}

      <Modal open={!!addingTo} onClose={resetAddModal} title={`Ajouter à ${(addingTo?.heure_debut||"").substring(0,5)}-${(addingTo?.heure_fin||"").substring(0,5)}`}>
        {addingTo && (() => {
          const isStageSlot = addingTo.type_creneau === "stage";
          const totalInscrits = affectations.filter(a => a.creneau_id === addingTo.id && a.actif).length;
          const isRegularFull = totalInscrits >= addingTo.capacite && addType === "abonne";
          const dur = slotDur(addingTo);
          const nbHours = Math.floor(dur);
          const startH = parseInt((addingTo.heure_debut||"00:00").split(":")[0]);
          const needsDates = addType === "occasionnel";
          const canSubmit = !isRegularFull && (showNewEleve ? (newEleveData.prenom && newEleveData.nom) : (addEleve && (!needsDates || addDatesOccasion.length > 0)));
          return (<div>
            {isRegularFull && <div style={{ background:C.danger+"15", border:`2px solid ${C.danger}44`, borderRadius:10, padding:"12px 16px", marginBottom:14, textAlign:"center", fontWeight:700, fontSize:14, color:C.danger }}>🚫 Créneau complet pour un abonné ({totalInscrits}/{addingTo.capacite} places) — inscription occasionnelle possible</div>}
            {/* Tabs élève existant / nouvel élève */}
            <div style={{ display:"flex", gap:4, background:C.surfaceLight, borderRadius:10, padding:4, border:`1px solid ${C.border}`, marginBottom:16 }}>
              <button onClick={() => setShowNewEleve(false)} style={{ flex:1, padding:"8px 12px", borderRadius:8, border:"none", cursor:"pointer", background:!showNewEleve?C.accent:"transparent", color:!showNewEleve?"#fff":C.textMuted, fontSize:13, fontWeight:700, transition:"all 0.15s" }}>👤 Élève existant</button>
              <button onClick={() => setShowNewEleve(true)} style={{ flex:1, padding:"8px 12px", borderRadius:8, border:"none", cursor:"pointer", background:showNewEleve?C.accent:"transparent", color:showNewEleve?"#fff":C.textMuted, fontSize:13, fontWeight:700, transition:"all 0.15s" }}>➕ Nouvel élève</button>
            </div>
            {showNewEleve ? (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <div style={{ fontSize:12, color:C.textMuted, marginBottom:4, fontWeight:600 }}>Prénom *</div>
                    <input value={newEleveData.prenom} onChange={e => setNewEleveData(p => ({...p, prenom:e.target.value}))} placeholder="Prénom" style={{ width:"100%", padding:"10px 12px", background:C.surfaceLight, border:`2px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, boxSizing:"border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:C.textMuted, marginBottom:4, fontWeight:600 }}>Nom *</div>
                    <input value={newEleveData.nom} onChange={e => setNewEleveData(p => ({...p, nom:e.target.value}))} placeholder="Nom" style={{ width:"100%", padding:"10px 12px", background:C.surfaceLight, border:`2px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, boxSizing:"border-box" }} />
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
                  <Input label="Classe" value={newEleveData.classe} onChange={v => setNewEleveData(p => ({...p, classe:v}))} options={CLASSES.map(c => [c,c])} />
                  <Input label="Forfait" value={newEleveData.forfait} onChange={v => setNewEleveData(p => ({...p, forfait:v}))} options={Object.entries(FORFAITS).map(([k,f]) => [k, f.l])} />
                </div>
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:12, color:C.textMuted, marginBottom:4, fontWeight:600 }}>Nom parent</div>
                  <input value={newEleveData.nom_parent1} onChange={e => setNewEleveData(p => ({...p, nom_parent1:e.target.value}))} placeholder="Nom du parent" style={{ width:"100%", padding:"10px 12px", background:C.surfaceLight, border:`2px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, boxSizing:"border-box" }} />
                </div>
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:12, color:C.textMuted, marginBottom:4, fontWeight:600 }}>Tél parent</div>
                  <input value={newEleveData.tel_parent1} onChange={e => setNewEleveData(p => ({...p, tel_parent1:e.target.value}))} placeholder="+33600000000" style={{ width:"100%", padding:"10px 12px", background:C.surfaceLight, border:`2px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, boxSizing:"border-box" }} />
                </div>
              </div>
            ) : (
              <Input label="Élève" value={addEleve} onChange={setAddEleve} options={[["","— Choisir —"], ...eleves.filter(e => e.actif).sort((a,b) => a.nom.localeCompare(b.nom)).map(e => [e.id, `${e.prenom} ${e.nom} (${e.classe})`])]} />
            )}
            {isStageSlot ? (<>
              <Input label="Type" value={addType} onChange={v => { setAddType(v); setAddDatesOccasion([]); }} options={[["abonne","🔄 Toute la semaine (abonné)"],["occasionnel","⚡ Jours spécifiques"]]} />
              {addType === "occasionnel" && (() => {
                const vacDates = getVacationWeekDates(addingTo.periode_vacances, addingTo.semaine_vacances || 1);
                if (!vacDates.length) return null;
                return (<div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, color:C.textMuted, marginBottom:8, fontWeight:700 }}>Jours de stage <span style={{ color:C.orange }}>(cocher les dates)</span></div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:4 }}>
                    {vacDates.map(d => {
                      const sel = addDatesOccasion.includes(d);
                      const dn = JOURS_SEMAINE[new Date(d).getDay()];
                      return (<label key={d} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 10px", borderRadius:10, border:`2px solid ${sel?C.orange:C.border}`, background:sel?C.orange+"15":"transparent", cursor:"pointer", minWidth:52 }}>
                        <input type="checkbox" checked={sel} onChange={() => setAddDatesOccasion(prev => sel?prev.filter(x=>x!==d):[...prev,d])} style={{ accentColor:C.orange, width:16, height:16 }} />
                        <span style={{ fontSize:10, fontWeight:700, color:sel?C.orange:C.textMuted }}>{dn.substring(0,3)}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:sel?C.orange:C.text }}>{fmtDateFr(d)}</span>
                      </label>);
                    })}
                  </div>
                  <div style={{ fontSize:11, color:C.textDim }}>{addDatesOccasion.length} jour{addDatesOccasion.length>1?"s":""} sélectionné{addDatesOccasion.length>1?"s":""}</div>
                </div>);
              })()}
              {addType === "abonne" && <div style={{ background:C.orange+"12", border:`1px solid ${C.orange}33`, borderRadius:8, padding:"8px 12px", marginBottom:14, fontSize:12, color:C.orange }}>🏕️ Présent tous les jours de la semaine de stage (Lun → Ven)</div>}
            </>) : (<>
              <Input label="Type" value={addType} onChange={v => { setAddType(v); setAddDatesOccasion([]); }} options={[["abonne","🔄 Abonné"],["occasionnel","⚡ Occasionnel"]]} />
              {addType === "occasionnel" && (() => {
                const nextDates = getNextOccurrences(addingTo.jour, selectedDate, 10);
                if (!nextDates.length) return null;
                const abonnes = affectations.filter(a => a.creneau_id === addingTo.id && a.actif && a.type_inscription !== "occasionnel").length;
                return (<div style={{ marginTop:12 }}>
                  <div style={{ fontSize:12, color:C.textMuted, marginBottom:8, fontWeight:700 }}>Dates de présence <span style={{ color:C.purple }}>(cocher les séances souhaitées)</span></div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:4 }}>
                    {nextDates.map(d => {
                      const sel = addDatesOccasion.includes(d);
                      const occOnDate = affectations.filter(a => a.creneau_id === addingTo.id && a.actif && a.type_inscription === "occasionnel" && a.dates_occasion && a.dates_occasion.split(",").includes(d)).length;
                      const totalOnDate = abonnes + occOnDate + (sel ? 1 : 0);
                      const willFull = totalOnDate >= addingTo.capacite;
                      return (<label key={d} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 10px", borderRadius:10, border:`2px solid ${sel ? C.purple : C.border}`, background: sel ? C.purple+"15" : "transparent", cursor:"pointer", minWidth:58 }}>
                        <input type="checkbox" checked={sel} onChange={() => setAddDatesOccasion(prev => sel ? prev.filter(x => x !== d) : [...prev, d])} style={{ accentColor:C.purple, width:16, height:16 }} />
                        <span style={{ fontSize:12, fontWeight:700, color:sel ? C.purple : C.text }}>{fmtDateFr(d)}</span>
                        {willFull && <span style={{ fontSize:9, color:C.danger, fontWeight:700 }}>Complet</span>}
                      </label>);
                    })}
                  </div>
                  <div style={{ fontSize:11, color:C.textDim, marginTop:4 }}>{addDatesOccasion.length} date{addDatesOccasion.length>1?"s":""} sélectionnée{addDatesOccasion.length>1?"s":""}</div>
                </div>);
              })()}
              {addType === "abonne" && (() => {
                const abonnesCount = affectations.filter(a => a.creneau_id === addingTo.id && a.actif && a.type_inscription !== "occasionnel").length;
                const datesMap = {};
                affectations.filter(a => a.creneau_id === addingTo.id && a.actif && a.type_inscription === "occasionnel" && a.dates_occasion)
                  .forEach(a => a.dates_occasion.split(",").forEach(d => { datesMap[d] = (datesMap[d]||0) + 1; }));
                const conflictDates = Object.entries(datesMap).filter(([,cnt]) => abonnesCount + 1 + cnt > addingTo.capacite).map(([d]) => d).sort();
                return conflictDates.length > 0 ? (
                  <div style={{ background:C.warning+"15", border:`2px solid ${C.warning}44`, borderRadius:10, padding:"10px 14px", marginTop:10, fontSize:12, color:C.warning, fontWeight:700 }}>
                    ⚠️ Ce créneau sera <b>complet</b> les {conflictDates.map(fmtDateFr).join(", ")} à cause d'élèves occasionnels
                  </div>
                ) : null;
              })()}
            </>)}
            {nbHours >= 2 ? (
              <div style={{ marginTop:12, marginBottom:6 }}>
                <div style={{ fontSize:12, color:C.textMuted, marginBottom:8, fontWeight:700 }}>Heures suivies</div>
                <div style={{ display:"flex", gap:8 }}>
                  {Array.from({length:nbHours}, (_,i) => {
                    const checked = addHoursChecks.length > 0 ? addHoursChecks[i] !== false : true;
                    const label = `${startH+i}h–${startH+i+1}h`;
                    return (<label key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 6px", borderRadius:10, border:`2px solid ${checked ? C.accent : C.border}`, background:checked ? C.accent+"15" : "transparent", cursor:"pointer" }}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        const nc = addHoursChecks.length > 0 ? [...addHoursChecks] : Array(nbHours).fill(true);
                        nc[i] = !nc[i];
                        setAddHoursChecks(nc);
                      }} style={{ accentColor:C.accent, width:18, height:18 }} />
                      <span style={{ fontSize:12, fontWeight:700, color:checked ? C.accent : C.textMuted }}>{label}</span>
                    </label>);
                  })}
                </div>
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <Btn onClick={resetAddModal} color={C.textMuted} outline>Annuler</Btn>
              <Btn onClick={showNewEleve ? addNewEleveAndInscribe : addOcc} disabled={!canSubmit}>Ajouter</Btn>
            </div>
          </div>);
        })()}
      </Modal>
      <SlotDetailModal open={!!slotDetail} onClose={() => setSlotDetail(null)} slot={slotDetail} eleves={eleves} affectations={affectations} refresh={() => { refresh(); loadPresences(); }} />

      <ValidationSeanceModal
        open={!!validatingSlot}
        onClose={() => setValidatingSlot(null)}
        slot={validatingSlot}
        dateStr={selectedDate}
        students={validatingSlot ? (daySlots.find(s => s.id === validatingSlot.id)?.students || []) : []}
        suiviMensuel={suiviMensuel}
        refresh={() => { refresh(); loadPresences(); }}
      />

      {/* Modal Arrêt définitif */}
      <Modal open={!!arretModal} onClose={() => setArretModal(null)} title="🚪 Arrêt définitif">
        {arretModal && (
          <div>
            <div style={{ background: C.danger+"10", border: `2px solid ${C.danger}33`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>{arretModal.st.prenom} {arretModal.st.nom}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>Créneau : {arretModal.slot.jour || "Lun→Ven"} {(arretModal.slot.heure_debut||"").substring(0,5)}–{(arretModal.slot.heure_fin||"").substring(0,5)}</div>
            </div>
            <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>
              Confirmer l'arrêt définitif de cet élève dans ce créneau ?
            </div>
            <div style={{ background: C.warning+"15", border: `1px solid ${C.warning}44`, borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 13, color: C.warning, fontWeight: 600 }}>
              ⚠️ La place sera libérée définitivement et disponible pour un autre élève.
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
              <Btn onClick={() => setArretModal(null)} color={C.textMuted} outline>Annuler</Btn>
              <Btn onClick={() => handleArretDefinitif(arretModal.st.id, arretModal.slot.id)} color={C.danger}>🚪 Confirmer l'arrêt</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ═══ ÉLÈVES ═══
const ElevesPage = ({ eleves, creneaux, affectations, suiviMensuel, paiements, presences, refresh, initialAction, initialOpenId }) => {
  const [search, setSearch] = useState(""); const [filterClasse, setFilterClasse] = useState("all"); const [filterStatut, setFilterStatut] = useState("actif");
  const [selected, setSelected] = useState(null); const [editing, setEditing] = useState(null); const [detailOpen, setDetailOpen] = useState(null); const [payOpen, setPayOpen] = useState(false); const [saving, setSaving] = useState(false);
  const [absenceModal, setAbsenceModal] = useState(false);
  const [absForm, setAbsForm] = useState({ date_cours: "", creneau_id: "" });
  const [absSaving, setAbsSaving] = useState(false);
  useEffect(() => { if (initialAction === "new") openNew(); if (initialOpenId) { const el = eleves.find(e => e.id === initialOpenId); if (el) openEdit(el); } }, [initialAction, initialOpenId, eleves]);
  const filtered = useMemo(() => { let l = [...eleves]; if (search) { const q = search.toLowerCase(); l = l.filter(s => `${s.nom} ${s.prenom} ${s.id}`.toLowerCase().includes(q)); } if (filterClasse!=="all") l = l.filter(s => s.classe===filterClasse); if (filterStatut==="actif") l = l.filter(s => s.actif); if (filterStatut==="inactif") l = l.filter(s => !s.actif); return l.sort((a,b) => a.nom.localeCompare(b.nom)); }, [eleves, search, filterClasse, filterStatut]);
  const soldeEleve = useCallback((eid) => { const f = suiviMensuel.filter(s => s.eleve_id===eid).reduce((s,x) => s+parseFloat(x.montant_facture||0),0); const p = paiements.filter(x => x.eleve_id===eid).reduce((s,x) => s+parseFloat(x.montant||0),0); let prov = 0; const ma = getMoisActuel(); if (!suiviMensuel.some(s => s.eleve_id===eid && s.mois===ma)) { presences.filter(x => x.eleve_id===eid && x.statut==="present").forEach(x => { const cr = creneaux.find(c => c.id===x.creneau_id); if (cr) prov += tarifMode(cr.mode)*(parseFloat(x.heures)||slotDur(cr)); }); } return { facture: f, paye: p, solde: p-f, provisoire: prov }; }, [suiviMensuel, paiements, presences, creneaux]);
  const creneauxEleve = useCallback((eid) => affectations.filter(a => a.eleve_id===eid && a.actif).map(a => { const cr = creneaux.find(c => c.id===a.creneau_id); return cr ? { ...cr, type_inscription: a.type_inscription } : null; }).filter(Boolean), [affectations, creneaux]);
  const getDetail = useCallback((eid) => { const d = {}; MOIS_ORDER.forEach(m => { d[m] = { cours: [], paiements: [], facture: 0 }; }); suiviMensuel.filter(s => s.eleve_id===eid).forEach(s => { if(d[s.mois]) d[s.mois].facture = parseFloat(s.montant_facture||0); }); paiements.filter(p => p.eleve_id===eid).forEach(p => { if(p.mois_concerne && d[p.mois_concerne]) d[p.mois_concerne].paiements.push(p); }); presences.filter(p => p.eleve_id===eid).forEach(p => { const dt = new Date(p.date_cours); const mn = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][dt.getMonth()]; if(d[mn]) d[mn].cours.push(p); }); return MOIS_ORDER.map(m => ({ mois: m, ...d[m] })).filter(x => x.facture>0 || x.cours.length>0 || x.paiements.length>0); }, [suiviMensuel, paiements, presences]);
  const saveStudent = async () => { setSaving(true); const { id, created_at, updated_at, ...data } = editing; if (selected) await api.patch("eleves", `id=eq.${selected.id}`, data); else await api.post("eleves", editing); setSaving(false); setEditing(null); setSelected(null); refresh(); };
  const openEdit = (s) => { setSelected(s); setEditing({...s}); }; const openNew = () => { setSelected(null); setEditing({ id:"",nom:"",prenom:"",actif:true,forfait:"groupe",classe:"6ème",cotisation_payee:false,fiche_inscription:false,tel_parent1:"",tel_parent2:"",tel_eleve:"",email:"",adresse:"",nom_parent1:"",nom_parent2:"",date_naissance:null }); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 26 }}>👥</span><h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Élèves</h2><Badge color={C.accent}>{filtered.length}</Badge></div>
        <Btn onClick={openNew} color={C.success}>+ Nouvel élève</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div style={{ position: "relative" }}><span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.4, fontSize: 16 }}>🔍</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ width: "100%", padding: "10px 14px 10px 40px", background: C.surface, border: `2px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, boxSizing: "border-box" }} /></div>
        <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)} style={{ padding: "10px", background: C.surface, border: `2px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14 }}><option value="all">Toutes classes</option>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ padding: "10px", background: C.surface, border: `2px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14 }}><option value="all">Tous</option><option value="actif">Actifs</option><option value="inactif">Inactifs</option></select>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: `2px solid ${C.border}`, background: C.blue+"15" }}>{["","Élève","Classe","Forfait","Solde","~Prov.","Tél","Dossier",""].map((h,i) => <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map(s => { const f = FORFAITS[s.forfait]||{l:s.forfait,c:C.textMuted}; const {solde,facture,provisoire} = soldeEleve(s.id); return (
            <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }} onClick={() => openEdit(s)} onMouseEnter={e => e.currentTarget.style.background=C.surfaceLight} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <td style={{ padding: "10px 14px", width: 30 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: s.actif?C.success:C.danger }} /></td>
              <td style={{ padding: "10px 14px" }}><div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{s.prenom} {s.nom}</div></td>
              <td style={{ padding: "10px 14px" }}><Badge color={C.purple}>{s.classe||"—"}</Badge></td>
              <td style={{ padding: "10px 14px" }}><Badge color={f.c}>{f.l}</Badge></td>
              <td style={{ padding: "10px 14px" }}>{facture>0?<span style={{ fontSize: 13, fontWeight: 700, color: solde>=0?C.success:C.danger }}>{solde>=0?"+":""}{solde.toFixed(0)}€</span>:<span style={{ fontSize: 12, color: C.textDim }}>—</span>}</td>
              <td style={{ padding: "10px 14px" }}>{provisoire>0?<span style={{ fontSize: 12, color: C.warning, fontWeight: 600 }}>~{provisoire.toFixed(0)}€</span>:<span style={{ fontSize: 12, color: C.textDim }}>—</span>}</td>
              <td style={{ padding: "10px 14px", fontSize: 13, color: C.accent }}>{s.tel_parent1||"—"}</td>
              <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 14 }}>{s.cotisation_payee?"✅":"❌"}{s.fiche_inscription?"📋":"⚠️"}</span></td>
              <td style={{ padding: "10px 14px", color: C.textMuted, fontSize: 18 }}>›</td></tr>);})}</tbody></table>
      </div>
      <Modal open={!!editing} onClose={() => { setEditing(null); setSelected(null); }} title={selected?`${selected.prenom} ${selected.nom}`:"Nouvel élève"} wide>
        {editing && (<div>
          {selected && (() => { const {facture,paye,solde,provisoire}=soldeEleve(selected.id); const crs=creneauxEleve(selected.id); return (<div style={{ marginBottom: 20 }}>
            {crs.length>0&&<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>{crs.map(cr => <Badge key={cr.id} color={cr.type_creneau==="stage"?C.orange:C.purple}>📅 {cr.type_creneau==="stage"?"Lun→Ven":cr.jour} {(cr.heure_debut||"").substring(0,5)}-{(cr.heure_fin||"").substring(0,5)}{cr.type_creneau==="stage"?` (Stage S${cr.semaine_vacances})`:""}</Badge>)}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, background: C.surfaceLight, borderRadius: 12, padding: 14 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700 }}>FACTURÉ</div><div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{facture>0?`${facture.toFixed(0)}€`:"—"}</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700 }}>PAYÉ</div><div style={{ fontSize: 20, fontWeight: 800, color: C.success }}>{paye>0?`${paye.toFixed(0)}€`:"—"}</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700 }}>SOLDE</div><div style={{ fontSize: 20, fontWeight: 800, color: facture===0?C.textDim:solde>=0?C.success:C.danger }}>{facture>0?`${solde>=0?"+":""}${solde.toFixed(0)}€`:"—"}</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: C.warning, fontWeight: 700 }}>PROVISOIRE</div><div style={{ fontSize: 20, fontWeight: 800, color: C.warning }}>{provisoire>0?`~${provisoire.toFixed(0)}€`:"—"}</div></div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12 }}><Btn small color={C.accent} onClick={() => setDetailOpen(selected.id)}>📊 Détail</Btn><Btn small color={C.success} onClick={() => setPayOpen(true)}>💳 Règlement</Btn><Btn small color={C.warning} onClick={() => { setAbsForm({ date_cours: "", creneau_id: "" }); setAbsenceModal(true); }}>📅 Absence</Btn></div>
          </div>); })()}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {!selected && <Input label="Identifiant" value={editing.id} onChange={v => setEditing({...editing, id: v})} placeholder="Pre.NOM" />}
            <Input label="Nom" value={editing.nom} onChange={v => setEditing({...editing, nom: v})} />
            <Input label="Prénom" value={editing.prenom} onChange={v => setEditing({...editing, prenom: v})} />
            <Input label="Classe" value={editing.classe||""} onChange={v => setEditing({...editing, classe: v})} options={CLASSES.map(c => [c,c])} />
            <Input label="Forfait" value={editing.forfait} onChange={v => setEditing({...editing, forfait: v})} options={Object.entries(FORFAITS).map(([k,v]) => [k,`${v.l} (${v.t}€/h)`])} />
            <Input label="Date naissance" value={editing.date_naissance||""} onChange={v => setEditing({...editing, date_naissance: v||null})} type="date" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Input label="Parent 1" value={editing.nom_parent1||""} onChange={v => setEditing({...editing, nom_parent1: v})} /><Input label="Parent 2" value={editing.nom_parent2||""} onChange={v => setEditing({...editing, nom_parent2: v})} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}><Input label="Tél parent 1" value={editing.tel_parent1||""} onChange={v => setEditing({...editing, tel_parent1: v})} /><Input label="Tél parent 2" value={editing.tel_parent2||""} onChange={v => setEditing({...editing, tel_parent2: v})} /><Input label="Tél élève" value={editing.tel_eleve||""} onChange={v => setEditing({...editing, tel_eleve: v})} /></div>
          <Input label="Email" value={editing.email||""} onChange={v => setEditing({...editing, email: v})} />
          <Input label="Adresse" value={editing.adresse||""} onChange={v => setEditing({...editing, adresse: v})} />
          <div style={{ display: "flex", gap: 20, marginTop: 10, marginBottom: 18 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, fontSize: 14, cursor: "pointer" }}><input type="checkbox" checked={editing.cotisation_payee} onChange={e => setEditing({...editing, cotisation_payee: e.target.checked})} style={{ width: 18, height: 18, accentColor: C.success }} /> Cotisation</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, fontSize: 14, cursor: "pointer" }}><input type="checkbox" checked={editing.fiche_inscription} onChange={e => setEditing({...editing, fiche_inscription: e.target.checked})} style={{ width: 18, height: 18, accentColor: C.success }} /> Fiche</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, fontSize: 14, cursor: "pointer" }}><input type="checkbox" checked={editing.actif} onChange={e => setEditing({...editing, actif: e.target.checked})} style={{ width: 18, height: 18, accentColor: C.success }} /> Actif</label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>{selected&&<Btn onClick={() => { api.patch("eleves",`id=eq.${selected.id}`,{actif:!selected.actif}); setEditing(null); setSelected(null); refresh(); }} color={selected.actif?C.danger:C.success} outline small>{selected.actif?"Désactiver":"Réactiver"}</Btn>}</div>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={() => { setEditing(null); setSelected(null); }} color={C.textMuted} outline>Annuler</Btn><Btn onClick={saveStudent} disabled={saving||!editing.nom||!editing.prenom}>{saving?"...":"✓ Enregistrer"}</Btn></div>
          </div>
        </div>)}
      </Modal>
      <Modal open={!!detailOpen} onClose={() => setDetailOpen(null)} title="📊 Détail cours & règlements" wide>
        {detailOpen && (() => { const data = getDetail(detailOpen); const el = eleves.find(e => e.id===detailOpen); return (<div><div style={{ fontWeight: 700, color: C.text, marginBottom: 14, fontSize: 16 }}>{el?.prenom} {el?.nom}</div>
          {data.length===0?<div style={{ textAlign: "center", color: C.textDim, padding: 24 }}>Aucune donnée</div>:data.map(d => (<div key={d.mois} style={{ background: C.surfaceLight, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontWeight: 700, color: C.accent, fontSize: 15 }}>{d.mois}</span><div style={{ display: "flex", gap: 10 }}>{d.facture>0&&<Badge color={C.blue}>F: {d.facture.toFixed(0)}€</Badge>}{d.paiements.length>0&&<Badge color={C.success}>P: {d.paiements.reduce((s,p) => s+parseFloat(p.montant),0).toFixed(0)}€</Badge>}</div></div>
            {d.cours.length>0&&<div style={{ fontSize: 12, color: C.textMuted }}>{d.cours.length} cours : {d.cours.map(c => new Date(c.date_cours).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})).join(", ")}</div>}
            {d.paiements.length>0&&<div style={{ fontSize: 12, color: C.success, marginTop: 4, fontWeight: 600 }}>{d.paiements.map(p => `${parseFloat(p.montant).toFixed(0)}€ (${p.mode_paiement})`).join(", ")}</div>}
          </div>))}</div>); })()}
      </Modal>
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} eleves={eleves} preselectedEleve={selected?.id||""} refresh={refresh} />

      {/* Modal Déclarer une absence future */}
      <Modal open={absenceModal} onClose={() => setAbsenceModal(false)} title="📅 Déclarer une absence future">
        {selected && (() => {
          const crsEleve = creneauxEleve(selected.id).filter(cr => cr.type_creneau !== "stage");
          const saveAbs = async () => {
            if (!absForm.date_cours || !absForm.creneau_id) return;
            setAbsSaving(true);
            // Vérifie si une présence existe déjà pour cette date/créneau
            const existing = presences.find(p => p.eleve_id === selected.id && p.date_cours === absForm.date_cours && p.creneau_id === absForm.creneau_id);
            if (existing) {
              await api.patch("presences", `id=eq.${existing.id}`, { statut: "absent_justifie", heures: 0 });
            } else {
              await api.post("presences", { eleve_id: selected.id, date_cours: absForm.date_cours, creneau_id: absForm.creneau_id, statut: "absent_justifie", heures: 0 });
            }
            setAbsSaving(false); setAbsenceModal(false); refresh();
          };
          // Absences futures déjà déclarées pour cet élève
          const futureAbs = presences.filter(p => p.eleve_id === selected.id && p.statut === "absent_justifie" && p.date_cours >= todayStr()).sort((a,b) => a.date_cours.localeCompare(b.date_cours));
          return (
            <div>
              <div style={{ background:C.surfaceLight, borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:13, color:C.textMuted }}>
                Élève : <strong style={{ color:C.text }}>{selected.prenom} {selected.nom}</strong>
              </div>
              <Input label="Date de l'absence" value={absForm.date_cours} onChange={v => setAbsForm(f=>({...f, date_cours:v}))} type="date" />
              <Input label="Créneau" value={absForm.creneau_id} onChange={v => setAbsForm(f=>({...f, creneau_id:v}))}
                options={[["","— Sélectionner un créneau —"], ...crsEleve.map(cr => [cr.id, `${cr.jour} ${(cr.heure_debut||"").substring(0,5)}–${(cr.heure_fin||"").substring(0,5)} (${(FORFAITS[cr.mode]||{}).l||cr.mode})`])]}
              />
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginBottom: futureAbs.length ? 20 : 0 }}>
                <Btn onClick={() => setAbsenceModal(false)} color={C.textMuted} outline>Annuler</Btn>
                <Btn onClick={saveAbs} disabled={absSaving || !absForm.date_cours || !absForm.creneau_id} color={C.warning}>
                  {absSaving ? "..." : "📅 Enregistrer l'absence"}
                </Btn>
              </div>
              {/* Liste des absences futures déjà déclarées */}
              {futureAbs.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", marginBottom:8 }}>Absences prévues ({futureAbs.length})</div>
                  {futureAbs.map(p => {
                    const cr = creneaux.find(c => c.id === p.creneau_id);
                    return (
                      <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:C.warning+"10", borderRadius:8, border:`1px solid ${C.warning}33`, marginBottom:6 }}>
                        <div style={{ fontSize:13, color:C.text }}>
                          <strong>{new Date(p.date_cours).toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"})}</strong>
                          {cr && <span style={{ color:C.textMuted, marginLeft:8 }}>{cr.jour} {(cr.heure_debut||"").substring(0,5)}</span>}
                        </div>
                        <button onClick={async () => { await api.del("presences", `id=eq.${p.id}`); refresh(); }}
                          style={{ background:C.danger+"15", border:"none", color:C.danger, cursor:"pointer", fontSize:11, padding:"3px 8px", borderRadius:6, fontWeight:600 }}>✕ Annuler</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

// ═══ CRÉNEAUX ═══
const CreneauxPage = ({ creneaux, affectations, eleves, refresh }) => {
  const [tab, setTab] = useState("regulier");
  const [editCr, setEditCr] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [slotDetail, setSlotDetail] = useState(null);

  const reguliers = creneaux.filter(cr => (cr.type_creneau||"regulier")==="regulier");
  const stages = creneaux.filter(cr => cr.type_creneau==="stage");

  const daysReg = useMemo(() => [...new Set(reguliers.map(cr => cr.jour))].sort((a,b) => JOURS_ALL.indexOf(a)-JOURS_ALL.indexOf(b)), [reguliers]);
  const groupedReg = useMemo(() => { const g = {}; daysReg.forEach(d => g[d]=[]); reguliers.forEach(cr => { if(g[cr.jour]) { const sts = affectations.filter(a => a.creneau_id===cr.id && a.actif).map(a => { const el = eleves.find(e => e.id===a.eleve_id); return el?{...el,type_inscription:a.type_inscription,affectation_id:a.id}:null; }).filter(Boolean); g[cr.jour].push({...cr,students:sts}); } }); return g; }, [reguliers, affectations, eleves, daysReg]);

  const groupedStage = useMemo(() => { const g = {}; stages.forEach(cr => { const pk = `${cr.periode_vacances}_S${cr.semaine_vacances||1}`; if(!g[pk]) g[pk] = { periode: cr.periode_vacances, semaine: cr.semaine_vacances||1, slots: [] }; const sts = affectations.filter(a => a.creneau_id===cr.id && a.actif).map(a => { const el = eleves.find(e => e.id===a.eleve_id); return el?{...el,type_inscription:a.type_inscription,affectation_id:a.id}:null; }).filter(Boolean); g[pk].slots.push({...cr,students:sts}); }); return g; }, [stages, affectations, eleves]);

  const deleteCreneau = async (crId) => { if(confirm("Supprimer ce créneau ?")) { await api.del("affectations_creneaux",`creneau_id=eq.${crId}`); await api.del("creneaux",`id=eq.${crId}`); refresh(); } };

  const SlotCard = ({ slot }) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `4px solid ${(FORFAITS[slot.mode]||{}).c||C.accent}`, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }} onClick={() => setSlotDetail(slot)}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{(slot.heure_debut||"").substring(0,5)}-{(slot.heure_fin||"").substring(0,5)}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||"Groupe"}</Badge>
          <button onClick={e => { e.stopPropagation(); setEditCr(slot); }} title="Modifier" style={{ background: C.surfaceLight, border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", fontSize: 12, padding: "2px 6px", borderRadius: 4 }}>✏️</button>
          <button onClick={e => { e.stopPropagation(); deleteCreneau(slot.id); }} title="Supprimer" style={{ background: C.danger+"15", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, padding: "2px 6px", borderRadius: 4 }}>🗑️</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>{Array.from({length:slot.capacite}).map((_,j) => <div key={j} style={{ flex: 1, height: 4, borderRadius: 2, background: j<slot.students.length?C.accent:C.surfaceLight }} />)}</div>
      <div style={{ fontSize: 11, color: C.textDim }}>{slot.students.length}/{slot.capacite} — cliquer pour détails</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 26 }}>📅</span><h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Créneaux</h2></div>
        <Btn onClick={() => setNewOpen(true)} color={C.success}>+ Nouveau créneau</Btn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["regulier",`📅 Réguliers (${reguliers.length})`],["stage",`🏕️ Stages (${stages.length})`]].map(([k,l]) => (
          <div key={k} onClick={() => setTab(k)} style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", border: `2px solid ${tab===k?(k==="stage"?C.orange:C.accent):C.border}`, background: tab===k?(k==="stage"?C.orange:C.accent)+"15":"transparent", color: tab===k?C.text:C.textMuted, fontWeight: 700, fontSize: 14 }}>{l}</div>
        ))}
      </div>
      {tab==="regulier" ? (
        daysReg.length===0 ? <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 50, textAlign: "center", color: C.textDim }}>Aucun créneau régulier</div> :
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(daysReg.length,5)}, 1fr)`, gap: 18 }}>
          {daysReg.map(day => (<div key={day}>
            <div style={{ background: C.blue+"15", border: `2px solid ${C.blue}44`, borderRadius: 12, padding: 14, marginBottom: 12, textAlign: "center" }}><span style={{ fontSize: 16, fontWeight: 700, color: C.blue }}>{day}</span></div>
            {(groupedReg[day]||[]).map(slot => <SlotCard key={slot.id} slot={slot} />)}
          </div>))}
        </div>
      ) : (
        Object.keys(groupedStage).length===0 ? <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 50, textAlign: "center" }}><div style={{ fontSize: 50, marginBottom: 12 }}>🏕️</div><div style={{ color: C.textMuted }}>Aucun créneau de stage</div></div> :
        Object.entries(groupedStage).sort(([a],[b]) => a.localeCompare(b)).map(([key, grp]) => {
          const plabel = PERIODES.find(p => p[0]===grp.periode)?.[1]||grp.periode;
          return (<div key={key} style={{ marginBottom: 24 }}>
            <div style={{ background: C.orange+"15", border: `2px solid ${C.orange}44`, borderRadius: 12, padding: "10px 16px", marginBottom: 12, fontWeight: 700, color: C.orange, fontSize: 15 }}>{plabel} — Semaine {grp.semaine}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {grp.slots.map(slot => (
                <div key={slot.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, borderLeft: `4px solid ${C.orange}`, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }} onClick={() => setSlotDetail(slot)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{(slot.heure_debut||"").substring(0,5)}-{(slot.heure_fin||"").substring(0,5)}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge color={C.orange}>Lun→Ven</Badge>
                      <button onClick={e => { e.stopPropagation(); setEditCr(slot); }} style={{ background: C.surfaceLight, border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", fontSize: 12, padding: "2px 6px", borderRadius: 4 }}>✏️</button>
                      <button onClick={e => { e.stopPropagation(); deleteCreneau(slot.id); }} style={{ background: C.danger+"15", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, padding: "2px 6px", borderRadius: 4 }}>🗑️</button>
                    </div>
                  </div>
                  <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||"Groupe"} · {tarifMode(slot.mode)}€/h</Badge>
                  <div style={{ display: "flex", gap: 3, margin: "10px 0 6px" }}>{Array.from({length:slot.capacite}).map((_,j) => <div key={j} style={{ flex: 1, height: 4, borderRadius: 2, background: j<slot.students.length?C.orange:C.surfaceLight }} />)}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{slot.students.length}/{slot.capacite} inscrits — cliquer pour détails</div>
                </div>
              ))}
            </div>
          </div>);
        })
      )}
      <CreneauModal open={newOpen||!!editCr} onClose={() => { setNewOpen(false); setEditCr(null); }} creneau={editCr} creneaux={creneaux} refresh={refresh} />
      <SlotDetailModal open={!!slotDetail} onClose={() => setSlotDetail(null)} slot={slotDetail} eleves={eleves} affectations={affectations} refresh={refresh} />
    </div>
  );
};

// ═══ PAIEMENTS ═══
const PaiementsPage = ({ eleves, paiements, refresh }) => {
  const [payOpen, setPayOpen] = useState(false);
  const sorted = useMemo(() => [...paiements].sort((a,b) => new Date(b.date_paiement)-new Date(a.date_paiement)), [paiements]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 26 }}>💳</span><h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Paiements</h2><Badge color={C.accent}>{paiements.length}</Badge></div>
        <Btn onClick={() => setPayOpen(true)} color={C.success}>+ Nouveau règlement</Btn>
      </div>
      {sorted.length===0 ? <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 50, textAlign: "center" }}><div style={{ fontSize: 50, marginBottom: 12 }}>💰</div><div style={{ color: C.textMuted }}>Aucun paiement</div></div> :
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: `2px solid ${C.border}`, background: C.blue+"15" }}>{["Date","Élève","Montant","Mode","Mois","Note"].map((h,i) => <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>{sorted.map(p => { const el = eleves.find(e => e.id===p.eleve_id); return (<tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: "10px 14px", fontSize: 13, color: C.textMuted }}>{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</td>
              <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: C.text }}>{el?`${el.prenom} ${el.nom}`:p.eleve_id}</td>
              <td style={{ padding: "10px 14px", fontSize: 16, fontWeight: 800, color: C.success }}>{parseFloat(p.montant).toFixed(0)}€</td>
              <td style={{ padding: "10px 14px" }}><Badge color={C.textMuted}>{p.mode_paiement}</Badge></td>
              <td style={{ padding: "10px 14px", fontSize: 13, color: C.textMuted }}>{p.mois_concerne||"—"}</td>
              <td style={{ padding: "10px 14px", fontSize: 13, color: C.textDim }}>{p.commentaire||"—"}</td>
            </tr>); })}</tbody></table>
        </div>}
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} eleves={eleves} preselectedEleve="" refresh={refresh} />
    </div>
  );
};

// ═══ MODAL INSCRIPTION PROSPECT ═══
const InscriptionProspectModal = ({ open, onClose, slot, dateStr, eleves, affectations, refresh }) => {
  const [mode, setMode] = useState("search"); // "search" | "new"
  const [search, setSearch] = useState("");
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [typeInscription, setTypeInscription] = useState("abonne");
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({});
  const [datesOccasion, setDatesOccasion] = useState([]);

  useEffect(() => {
    if (open) {
      setMode("search"); setSearch(""); setSelectedEleve(null);
      setTypeInscription("abonne"); setSaving(false);
      setDatesOccasion(dateStr ? [dateStr] : []);
      setNewForm({ id:"", nom:"", prenom:"", classe:"6ème", forfait: slot?.mode||"groupe", actif:true, cotisation_payee:false, fiche_inscription:false, nom_parent1:"", tel_parent1:"", email:"", adresse:"", tel_parent2:"", tel_eleve:"", date_naissance:null });
    }
  }, [open, slot]);

  // Auto-génère l'ID depuis nom+prénom
  useEffect(() => {
    if (newForm.prenom && newForm.nom) {
      const id = `${newForm.prenom.charAt(0).toUpperCase()}${newForm.prenom.slice(1,3).toLowerCase()}.${newForm.nom.toUpperCase()}`;
      setNewForm(f => ({ ...f, id }));
    }
  }, [newForm.prenom, newForm.nom]);

  if (!slot) return null;
  const alreadyIn = affectations.filter(a => a.creneau_id === slot.id && a.actif).map(a => a.eleve_id);
  const searchResults = eleves
    .filter(e => e.actif && !alreadyIn.includes(e.id) &&
      (search.trim().length === 0 || `${e.prenom} ${e.nom}`.toLowerCase().includes(search.trim().toLowerCase())))
    .sort((a, b) => a.nom.localeCompare(b.nom))
    .slice(0, 10);

  const slotLabel = `${(slot.heure_debut||"").substring(0,5)}–${(slot.heure_fin||"").substring(0,5)} · ${(FORFAITS[slot.mode]||{}).l||slot.mode}`;
  const dateLabel = new Date(dateStr).toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long"});

  const saveInscription = async () => {
    setSaving(true);
    let eleveId = selectedEleve?.id;
    if (mode === "new") {
      if (!newForm.nom || !newForm.prenom || !newForm.id) { setSaving(false); return; }
      const res = await api.post("eleves", { ...newForm, date_naissance: newForm.date_naissance||null });
      eleveId = res?.[0]?.id || newForm.id;
    }
    if (eleveId) {
      const affData = { eleve_id: eleveId, creneau_id: slot.id, type_inscription: typeInscription, actif: true, jours_stage: null };
      const datesOcc = typeInscription === "occasionnel" && datesOccasion.length > 0 ? datesOccasion.join(",") : null;
      const createdAff = await api.post("affectations_creneaux", affData);
      const newAffId = Array.isArray(createdAff) ? createdAff[0]?.id : createdAff?.id;
      if (datesOcc && newAffId) await api.patch("affectations_creneaux", `id=eq.${newAffId}`, { dates_occasion: datesOcc });
    }
    setSaving(false); onClose(); refresh();
  };

  const canSave = mode === "search"
    ? (!!selectedEleve && (typeInscription !== "occasionnel" || datesOccasion.length > 0))
    : !!(newForm.nom && newForm.prenom && newForm.id && (typeInscription !== "occasionnel" || datesOccasion.length > 0));

  return (
    <Modal open={open} onClose={onClose} title={`👤 Inscrire un prospect — ${slotLabel}`} wide>
      <div style={{ background:C.surfaceLight, borderRadius:10, padding:"10px 16px", marginBottom:18, fontSize:13, color:C.textMuted }}>
        📅 {dateLabel} · {slotLabel}
      </div>

      {/* Toggle Élève existant / Nouvel élève */}
      <div style={{ display:"flex", gap:6, marginBottom:20, background:C.surfaceLight, borderRadius:10, padding:4, border:`1px solid ${C.border}` }}>
        {[["search","📋 Liste des élèves"],["new","➕ Nouveau inscrit"]].map(([k,l]) => (
          <button key={k} onClick={() => { setMode(k); setSelectedEleve(null); setSearch(""); }}
            style={{ flex:1, padding:"9px 16px", borderRadius:8, border:"none", cursor:"pointer", background:mode===k?C.pink:"transparent", color:mode===k?"#fff":C.textMuted, fontSize:13, fontWeight:700, transition:"all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* ── Mode RECHERCHE ── */}
      {mode === "search" && (
        <div>
          <div style={{ position:"relative", marginBottom:12 }}>
            <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, opacity:0.5 }}>🔍</span>
            <input
              autoFocus
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedEleve(null); }}
              placeholder="Saisir le nom ou prénom…"
              style={{ width:"100%", padding:"12px 14px 12px 42px", background:C.surface, border:`2px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:15, boxSizing:"border-box" }}
            />
          </div>
          {/* Résultats recherche — toujours visible */}
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:12, maxHeight:320, overflowY:"auto" }}>
            {searchResults.length === 0 ? (
              <div style={{ padding:"20px", textAlign:"center", color:C.textDim, fontSize:13 }}>{search.trim().length > 0 ? `Aucun élève trouvé pour "${search}"` : "Tous les élèves sont déjà inscrits à ce créneau"}</div>
            ) : searchResults.map(el => (
                <div key={el.id}
                  onClick={() => { setSelectedEleve(el); setSearch(`${el.prenom} ${el.nom}`); }}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", cursor:"pointer", borderBottom:`1px solid ${C.border}`, background:selectedEleve?.id===el.id?C.pink+"15":"white", transition:"background 0.1s" }}
                  onMouseEnter={e => { if(selectedEleve?.id!==el.id) e.currentTarget.style.background=C.surfaceLight; }}
                  onMouseLeave={e => { if(selectedEleve?.id!==el.id) e.currentTarget.style.background="white"; }}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:C.pink+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:C.pink }}>
                      {el.prenom.charAt(0)}{el.nom.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{el.prenom} {el.nom}</div>
                      <div style={{ fontSize:12, color:C.textMuted }}>{el.classe} · {(FORFAITS[el.forfait]||{}).l||el.forfait}</div>
                    </div>
                  </div>
                  {selectedEleve?.id === el.id && <span style={{ color:C.success, fontSize:20 }}>✓</span>}
                </div>
              ))}
          </div>
          {selectedEleve && (
            <div style={{ background:C.success+"10", border:`2px solid ${C.success}44`, borderRadius:10, padding:"12px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>✅</span>
              <div><span style={{ fontWeight:700, color:C.text }}>{selectedEleve.prenom} {selectedEleve.nom}</span><span style={{ color:C.textMuted, fontSize:13, marginLeft:8 }}>{selectedEleve.classe}</span></div>
            </div>
          )}
        </div>
      )}

      {/* ── Mode NOUVEL ÉLÈVE ── */}
      {mode === "new" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:4 }}>
            <Input label="Prénom *" value={newForm.prenom||""} onChange={v => setNewForm(f=>({...f,prenom:v}))} placeholder="Prénom" />
            <Input label="Nom *" value={newForm.nom||""} onChange={v => setNewForm(f=>({...f,nom:v}))} placeholder="NOM" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <Input label="Identifiant *" value={newForm.id||""} onChange={v => setNewForm(f=>({...f,id:v}))} placeholder="Pre.NOM" />
            <Input label="Classe" value={newForm.classe||"6ème"} onChange={v => setNewForm(f=>({...f,classe:v}))} options={CLASSES.map(c=>[c,c])} />
            <Input label="Forfait" value={newForm.forfait||"groupe"} onChange={v => setNewForm(f=>({...f,forfait:v}))} options={Object.entries(FORFAITS).map(([k,v])=>[k,`${v.l} (${v.t}€/h)`])} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Parent" value={newForm.nom_parent1||""} onChange={v => setNewForm(f=>({...f,nom_parent1:v}))} placeholder="Nom du parent" />
            <Input label="Téléphone parent" value={newForm.tel_parent1||""} onChange={v => setNewForm(f=>({...f,tel_parent1:v}))} placeholder="06…" />
          </div>
          <Input label="Email" value={newForm.email||""} onChange={v => setNewForm(f=>({...f,email:v}))} placeholder="email@exemple.com" />
          <div style={{ background:C.warning+"12", border:`1px solid ${C.warning}33`, borderRadius:8, padding:"8px 12px", fontSize:12, color:C.warning, fontWeight:600 }}>
            ⚠️ L'élève sera créé et inscrit à ce créneau. Pensez à compléter sa fiche depuis la page Élèves.
          </div>
        </div>
      )}

      {/* ── Type d'inscription ── */}
      <div style={{ marginTop:20, marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:10, textTransform:"uppercase" }}>Type d'inscription</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            ["abonne","🔄 Permanent","Jusqu'à la fin de l'année scolaire",C.accent],
            ["occasionnel","⚡ Occasionnel","Séances ponctuelles (place provisoire)",C.warning]
          ].map(([k,l,sub,col]) => (
            <div key={k} onClick={() => { setTypeInscription(k); if (k === "occasionnel") setDatesOccasion(dateStr ? [dateStr] : []); else setDatesOccasion([]); }}
              style={{ padding:"14px 16px", borderRadius:12, cursor:"pointer", border:`2px solid ${typeInscription===k?col:C.border}`, background:typeInscription===k?col+"12":"transparent", transition:"all 0.15s" }}>
              <div style={{ fontWeight:700, fontSize:14, color:typeInscription===k?col:C.text, marginBottom:4 }}>{l}</div>
              <div style={{ fontSize:12, color:C.textMuted }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sélecteur de dates pour occasionnel ── */}
      {typeInscription === "occasionnel" && (() => {
        const allDates = [dateStr, ...getNextOccurrences(slot.jour, dateStr, 7)];
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: "uppercase" }}>
              Séances sélectionnées <span style={{ color: C.warning, textTransform: "none", fontWeight: 400 }}>(au moins une obligatoire)</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              {allDates.map(d => {
                const sel = datesOccasion.includes(d);
                return (
                  <label key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 10px", borderRadius: 10, border: `2px solid ${sel ? C.warning : C.border}`, background: sel ? C.warning+"15" : "transparent", cursor: "pointer", minWidth: 58 }}>
                    <input type="checkbox" checked={sel} onChange={() => setDatesOccasion(prev => sel ? prev.filter(x => x !== d) : [...prev, d])} style={{ accentColor: C.warning, width: 16, height: 16 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: sel ? C.warning : C.text }}>{fmtDateFr(d)}</span>
                  </label>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: C.textDim }}>{datesOccasion.length} séance{datesOccasion.length > 1 ? "s" : ""} sélectionnée{datesOccasion.length > 1 ? "s" : ""}</div>
          </div>
        );
      })()}

      <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
        <Btn onClick={onClose} color={C.textMuted} outline>Annuler</Btn>
        <Btn onClick={saveInscription} disabled={saving || !canSave} color={C.success}>
          {saving ? "⏳ Enregistrement..." : `✓ Inscrire ${typeInscription==="abonne"?"(permanent)":"(occasionnel)"}`}
        </Btn>
      </div>
    </Modal>
  );
};

// ═══ DISPONIBILITÉS ═══
const DisponibilitesPage = ({ creneaux, affectations, eleves, presences, refresh }) => {
  const [selectedDate, setSelectedDate] = useState(getSmartDay().date);
  const [viewMode, setViewMode] = useState("semaine"); // "jour" | "semaine"
  const [filterMode, setFilterMode] = useState("tous"); // "tous" | "regulier" | "provisoire"
  const [inscriptionSlot, setInscriptionSlot] = useState(null);

  // Calcul des disponibilités pour un créneau à une date donnée
  // RÈGLE : placesLibres = capacité - abonnés (pas les occasionnels)
  // Une place libre est dispo en PERMANENTE et aussi en PROVISOIRE
  // Places provisoires SUPPLÉMENTAIRES = abonnés absents justifiés ce jour
  const getDispoSlot = useCallback((cr, dateStr) => {
    const dow = new Date(dateStr).getDay();
    const dayName = JOURS_SEMAINE[dow];
    const aff = affectations.filter(a => a.creneau_id === cr.id && a.actif);
    // Nb total inscrits (abonnés + occasionnels) pour affichage
    const inscrits = cr.type_creneau === "stage"
      ? aff.filter(a => !a.jours_stage || a.jours_stage.includes(dayName)).length
      : aff.length;
    // Seulement les abonnés comptent pour les places permanentes
    const abonnes = aff.filter(a => a.type_inscription === "abonne");
    const nbAbonnes = cr.type_creneau === "stage"
      ? abonnes.filter(a => !a.jours_stage || a.jours_stage.includes(dayName)).length
      : abonnes.length;
    const placesLibres = Math.max(0, cr.capacite - nbAbonnes); // places permanentes libres
    // Absences justifiées de ce jour = places provisoires SUPPLÉMENTAIRES
    const absJusts = presences.filter(p => p.date_cours === dateStr && p.creneau_id === cr.id && p.statut === "absent_justifie");
    const absJustsEleves = absJusts.map(p => eleves.find(e => e.id === p.eleve_id)).filter(Boolean);
    const placesProvisSupp = absJusts.length; // provisoires en plus des places libres
    const totalProvisoire = placesLibres + placesProvisSupp; // total dispo ce jour en provisoire
    return { inscrits, nbAbonnes, placesLibres, placesProvisSupp, absJustsEleves, totalProvisoire, total: totalProvisoire };
  }, [affectations, presences, eleves]);

  // Slots applicables pour une date
  const getSlotsForDate = useCallback((dateStr) => {
    const ctx = getDateContext(dateStr);
    const dow = new Date(dateStr).getDay();
    const dayName = JOURS_SEMAINE[dow];
    if (ctx.type === "samedi_milieu" || dow === 0) return [];
    let slots = [];
    if (ctx.type === "vacances" && dow >= 1 && dow <= 5) {
      slots = creneaux.filter(cr => cr.type_creneau === "stage" && cr.periode_vacances === ctx.vacance?.id && cr.semaine_vacances === ctx.semaine);
    } else if (ctx.type === "hors_vacances" && dow >= 1 && dow <= 6) {
      slots = creneaux.filter(cr => (cr.type_creneau || "regulier") === "regulier" && cr.jour === dayName);
    }
    return slots.sort((a, b) => (a.heure_debut || "").localeCompare(b.heure_debut || ""));
  }, [creneaux]);

  // Données vue jour
  const jourData = useMemo(() => {
    const slots = getSlotsForDate(selectedDate);
    return slots.map(cr => ({ ...cr, dispo: getDispoSlot(cr, selectedDate) }))
      .filter(cr => {
        if (filterMode === "regulier") return cr.dispo.placesLibres > 0;
        if (filterMode === "provisoire") return cr.dispo.totalProvisoire > 0;
        return cr.dispo.total > 0;
      });
  }, [selectedDate, getSlotsForDate, getDispoSlot, filterMode]);

  // Données vue semaine
  const semaineDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const semaineData = useMemo(() => semaineDates.map(dateStr => {
    const ctx = getDateContext(dateStr);
    const dow = new Date(dateStr).getDay();
    const dayName = JOURS_SEMAINE[dow];
    const slots = getSlotsForDate(dateStr);
    const dispos = slots.map(cr => ({ ...cr, dispo: getDispoSlot(cr, dateStr) }));
    const totalLibres = dispos.reduce((s, cr) => s + cr.dispo.placesLibres, 0);
    const totalProv = dispos.reduce((s, cr) => s + cr.dispo.placesProvisSupp, 0);
    return { dateStr, dayName, dow, ctx, dispos: dispos.filter(cr => cr.dispo.total > 0), totalLibres, totalProv, isToday: dateStr === todayStr() };
  }), [semaineDates, getSlotsForDate, getDispoSlot]);

  const totalJour = jourData.reduce((s, cr) => ({ libres: s.libres + cr.dispo.placesLibres, prov: s.prov + cr.dispo.placesProvisSupp }), { libres: 0, prov: 0 });
  const moveWeek = (dir) => { const d = new Date(selectedDate); d.setDate(d.getDate() + dir * 7); setSelectedDate(d.toISOString().split("T")[0]); };
  const wd0 = new Date(semaineDates[0]); const wd5 = new Date(semaineDates[5]);
  const wLabel = `${wd0.getDate()} ${wd0.toLocaleDateString("fr-FR",{month:"short"})} — ${wd5.getDate()} ${wd5.toLocaleDateString("fr-FR",{month:"short",year:"numeric"})}`;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:26 }}>🟢</span>
            <h2 style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>Disponibilités</h2>
          </div>
          <p style={{ color:C.textMuted, fontSize:13, margin:"6px 0 0 38px" }}>Places disponibles à communiquer aux prospects</p>
        </div>
        {/* Toggle vue */}
        <div style={{ display:"flex", gap:4, background:C.surfaceLight, borderRadius:10, padding:4, border:`1px solid ${C.border}` }}>
          {[["semaine","📅 Semaine"],["jour","📋 Jour"]].map(([k,l]) => (
            <button key={k} onClick={() => setViewMode(k)} style={{ padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", background:viewMode===k?C.accent:"transparent", color:viewMode===k?"#fff":C.textMuted, fontSize:13, fontWeight:700, transition:"all 0.15s" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Navigation + filtres */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:20, flexWrap:"wrap" }}>
        <Btn small onClick={() => viewMode==="semaine" ? moveWeek(-1) : (()=>{ const d=new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split("T")[0]); })()} color={C.textMuted} outline>{viewMode==="semaine"?"◀◀":"◀"}</Btn>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding:"10px 16px", background:C.surface, border:`2px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:15, fontWeight:600 }} />
        <Btn small onClick={() => viewMode==="semaine" ? moveWeek(1) : (()=>{ const d=new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split("T")[0]); })()} color={C.textMuted} outline>{viewMode==="semaine"?"▶▶":"▶"}</Btn>
        <Btn small onClick={() => setSelectedDate(todayStr())} color={C.accent} outline>Aujourd'hui</Btn>
        {viewMode === "jour" && (
          <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
            {[["tous","Tout"],["regulier","🟢 Régulières"],["provisoire","💬 Provisoires"]].map(([k,l]) => (
              <button key={k} onClick={() => setFilterMode(k)} style={{ padding:"7px 14px", borderRadius:8, border:`2px solid ${filterMode===k?C.accent:C.border}`, cursor:"pointer", background:filterMode===k?C.accent+"15":"transparent", color:filterMode===k?C.accent:C.textMuted, fontSize:12, fontWeight:700 }}>{l}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── VUE SEMAINE ── */}
      {viewMode === "semaine" && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <span style={{ fontSize:14, fontWeight:700, color:C.textMuted }}>{wLabel}</span>
          </div>
          {/* Légende */}
          <div style={{ display:"flex", gap:16, marginBottom:16 }}>
            {[[C.success,"🟢 Place régulière libre"],[C.warning,"💬 Place provisoire (absent justifié ce jour)"],[C.textDim,"— Aucune disponibilité"]].map(([col,lbl]) => (
              <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:col }}><div style={{ width:10, height:10, borderRadius:"50%", background:col, flexShrink:0 }} />{lbl}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:10 }}>
            {semaineData.map(day => (
              <div key={day.dateStr}>
                {/* En-tête jour */}
                <div
                  onClick={() => { setSelectedDate(day.dateStr); setViewMode("jour"); }}
                  style={{ padding:"10px 8px", textAlign:"center", borderRadius:10, marginBottom:8, cursor:"pointer",
                    background: day.isToday ? C.accent+"20" : C.surfaceLight,
                    border:`2px solid ${day.isToday ? C.accent : C.border}` }}
                >
                  <div style={{ fontSize:10, fontWeight:700, color:day.isToday?C.accent:C.textMuted, textTransform:"uppercase", letterSpacing:1 }}>{day.dayName.substring(0,3)}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:day.isToday?C.accent:C.text }}>{new Date(day.dateStr).getDate()}</div>
                  {/* Résumé dispo */}
                  {day.ctx.type === "samedi_milieu" ? (
                    <div style={{ fontSize:9, color:C.textDim, marginTop:4 }}>Vacances</div>
                  ) : day.totalLibres + day.totalProv === 0 ? (
                    <div style={{ fontSize:10, color:C.textDim, marginTop:4 }}>Complet</div>
                  ) : (
                    <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:3 }}>
                      {day.totalLibres > 0 && <div style={{ fontSize:11, fontWeight:700, color:C.success, background:C.success+"15", borderRadius:6, padding:"2px 6px" }}>🟢 {day.totalLibres}</div>}
                      {day.totalProv > 0 && <div style={{ fontSize:11, fontWeight:700, color:C.warning, background:C.warning+"15", borderRadius:6, padding:"2px 6px" }}>💬 {day.totalProv}</div>}
                    </div>
                  )}
                </div>
                {/* Détail créneaux */}
                {day.dispos.map(cr => (
                  <div key={cr.id}
                    onClick={() => { setSelectedDate(day.dateStr); setViewMode("jour"); }}
                    style={{ background:C.surface, border:`1px solid ${C.border}`, borderLeft:`4px solid ${cr.dispo.placesLibres>0?C.success:C.warning}`, borderRadius:8, padding:"7px 9px", marginBottom:5, cursor:"pointer", fontSize:12 }}>
                    <div style={{ fontWeight:700, color:C.text }}>{(cr.heure_debut||"").substring(0,5)}–{(cr.heure_fin||"").substring(0,5)}</div>
                    <div style={{ color:(FORFAITS[cr.mode]||{}).c||C.accent, fontWeight:600, fontSize:11 }}>{(FORFAITS[cr.mode]||{}).l||cr.mode}</div>
                    <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
                      {cr.dispo.placesLibres > 0 && <span style={{ fontSize:10, fontWeight:700, color:C.success, background:C.success+"15", borderRadius:4, padding:"1px 5px" }}>🟢 {cr.dispo.placesLibres}</span>}
                      {cr.dispo.placesProvisSupp > 0 && <span style={{ fontSize:10, fontWeight:700, color:C.warning, background:C.warning+"15", borderRadius:4, padding:"1px 5px" }}>💬 {cr.dispo.placesProvisSupp}</span>}
                    </div>
                  </div>
                ))}
                {day.ctx.type !== "samedi_milieu" && day.dispos.length === 0 && day.ctx.type !== "samedi_milieu" && new Date(day.dateStr).getDay() !== 0 && (
                  <div style={{ fontSize:10, color:C.textDim, textAlign:"center", padding:8 }}>—</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VUE JOUR ── */}
      {viewMode === "jour" && (() => {
        const ctx = getDateContext(selectedDate);
        const dow = new Date(selectedDate).getDay();
        const dayName = JOURS_SEMAINE[dow];
        const ctxLabel = ctx.type==="vacances"?`🏕️ Stage ${ctx.vacance.label} — Semaine ${ctx.semaine}`:ctx.type==="samedi_milieu"?"😴 Milieu vacances":"📚 Période scolaire";
        const ctxColor = ctx.type==="vacances"?C.orange:ctx.type==="samedi_milieu"?C.textDim:C.accent;
        return (
          <div>
            {/* Bandeau date */}
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
              <div style={{ background:ctxColor+"15", border:`2px solid ${ctxColor}33`, borderRadius:10, padding:"10px 18px", fontSize:14, color:ctxColor, fontWeight:700 }}>
                {dayName} {new Date(selectedDate).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})} — {ctxLabel}
              </div>
              {/* KPIs */}
              {totalJour.libres > 0 && (
                <div style={{ background:C.success+"15", border:`2px solid ${C.success}44`, borderRadius:10, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:18 }}>🟢</span>
                  <div><div style={{ fontSize:11, color:C.success, fontWeight:700, textTransform:"uppercase" }}>Places régulières libres</div><div style={{ fontSize:22, fontWeight:800, color:C.success }}>{totalJour.libres}</div></div>
                </div>
              )}
              {totalJour.prov > 0 && (
                <div style={{ background:C.warning+"15", border:`2px solid ${C.warning}44`, borderRadius:10, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:18 }}>💬</span>
                  <div><div style={{ fontSize:11, color:C.warning, fontWeight:700, textTransform:"uppercase" }}>Places provisoires libres</div><div style={{ fontSize:22, fontWeight:800, color:C.warning }}>{totalJour.prov}</div></div>
                </div>
              )}
            </div>

            {(ctx.type === "samedi_milieu" || (dow === 0)) ? (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:50, textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>😴</div>
                <div style={{ color:C.textMuted }}>Pas de cours ce jour</div>
              </div>
            ) : jourData.length === 0 ? (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:50, textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                <div style={{ fontWeight:700, color:C.text, fontSize:16, marginBottom:8 }}>Tous les créneaux sont complets</div>
                <div style={{ color:C.textMuted, fontSize:13 }}>Aucune place disponible ce jour pour un nouveau prospect</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {jourData.map(cr => (
                  <div key={cr.id} style={{ background:C.surface, border:`2px solid ${C.border}`, borderRadius:16, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", borderLeft:`5px solid ${cr.dispo.placesLibres>0?C.success:C.warning}` }}>
                    {/* Header créneau */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontWeight:800, fontSize:18, color:C.text }}>{(cr.heure_debut||"").substring(0,5)} — {(cr.heure_fin||"").substring(0,5)}</span>
                        <Badge color={(FORFAITS[cr.mode]||{}).c||C.accent}>{(FORFAITS[cr.mode]||{}).l||cr.mode} · {tarifMode(cr.mode)}€/h</Badge>
                        <Badge color={C.textMuted}>{cr.dispo.inscrits}/{cr.capacite} inscrits</Badge>
                        {cr.type_creneau==="stage" && <Badge color={C.orange}>🏕️ Stage</Badge>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontWeight:700, fontSize:14, color:cr.dispo.total>0?C.success:C.textDim }}>
                          {cr.dispo.total} place{cr.dispo.total>1?"s":""} dispo
                        </span>
                        <Btn small color={C.pink} onClick={() => setInscriptionSlot(cr)}>👤 Inscrire</Btn>
                      </div>
                    </div>

                    {/* Détail disponibilités — nouvelle logique */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {/* Bloc 1 : place permanente libre */}
                      <div style={{ background:cr.dispo.placesLibres>0?C.success+"10":C.surfaceLight, border:`2px solid ${cr.dispo.placesLibres>0?C.success+"44":C.border}`, borderRadius:12, padding:14 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <span style={{ fontSize:18 }}>🟢</span>
                          <div>
                            <div style={{ fontSize:10, fontWeight:700, color:cr.dispo.placesLibres>0?C.success:C.textDim, textTransform:"uppercase" }}>Place{cr.dispo.placesLibres>1?"s":""} permanente{cr.dispo.placesLibres>1?"s":""} libre{cr.dispo.placesLibres>1?"s":""}</div>
                            <div style={{ fontSize:24, fontWeight:800, color:cr.dispo.placesLibres>0?C.success:C.textDim }}>{cr.dispo.placesLibres}</div>
                          </div>
                        </div>
                        {cr.dispo.placesLibres > 0 ? (
                          <div>
                            <div style={{ fontSize:11, color:C.success, marginBottom:4 }}>✓ Inscription permanente possible</div>
                            <div style={{ fontSize:11, color:C.success, opacity:0.8 }}>💬 Aussi disponible en provisoire ce jour</div>
                          </div>
                        ) : (
                          <div style={{ fontSize:11, color:C.textDim }}>Tous les abonnés sont inscrits ({cr.dispo.nbAbonnes}/{cr.capacite})</div>
                        )}
                      </div>

                      {/* Bloc 2 : absences justifiées du jour = places provisoires supplémentaires */}
                      <div style={{ background:cr.dispo.placesProvisSupp>0?C.warning+"10":C.surfaceLight, border:`2px solid ${cr.dispo.placesProvisSupp>0?C.warning+"44":C.border}`, borderRadius:12, padding:14 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <span style={{ fontSize:18 }}>💬</span>
                          <div>
                            <div style={{ fontSize:10, fontWeight:700, color:cr.dispo.placesProvisSupp>0?C.warning:C.textDim, textTransform:"uppercase" }}>Absence{cr.dispo.placesProvisSupp>1?"s":""} justifiée{cr.dispo.placesProvisSupp>1?"s":""} ce jour</div>
                            <div style={{ fontSize:24, fontWeight:800, color:cr.dispo.placesProvisSupp>0?C.warning:C.textDim }}>{cr.dispo.placesProvisSupp}</div>
                          </div>
                        </div>
                        {cr.dispo.placesProvisSupp > 0 ? (
                          <div>
                            <div style={{ fontSize:11, color:C.warning, marginBottom:6 }}>Place{cr.dispo.placesProvisSupp>1?"s":""} provisoire{cr.dispo.placesProvisSupp>1?"s":""} supplémentaire{cr.dispo.placesProvisSupp>1?"s":""} :</div>
                            {cr.dispo.absJustsEleves.map(el => (
                              <div key={el.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", background:C.warning+"15", borderRadius:6, marginTop:3 }}>
                                <span style={{ fontSize:13 }}>👤</span>
                                <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{el.prenom} {el.nom}</span>
                                <Badge color={C.purple}>{el.classe}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize:11, color:C.textDim }}>Aucune absence déclarée pour ce jour</div>
                        )}
                      </div>
                    </div>
                    {/* Total provisoire ce jour */}
                    {cr.dispo.totalProvisoire > 0 && (
                      <div style={{ marginTop:10, background:C.blue+"10", border:`1px solid ${C.blue}33`, borderRadius:8, padding:"8px 14px", fontSize:12, color:C.blue, fontWeight:700 }}>
                        → Total disponible ce jour (provisoire) : {cr.dispo.totalProvisoire} place{cr.dispo.totalProvisoire>1?"s":""}
                        {cr.dispo.placesLibres > 0 && cr.dispo.placesProvisSupp > 0 && <span style={{ fontWeight:400 }}> ({cr.dispo.placesLibres} permanente{cr.dispo.placesLibres>1?"s":""} + {cr.dispo.placesProvisSupp} absence{cr.dispo.placesProvisSupp>1?"s":""})</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal inscription prospect */}
      <InscriptionProspectModal
        open={!!inscriptionSlot}
        onClose={() => setInscriptionSlot(null)}
        slot={inscriptionSlot}
        dateStr={selectedDate}
        eleves={eleves}
        affectations={affectations}
        refresh={refresh}
      />
    </div>
  );
};

// ═══ SMS GROUPÉS ═══
const BREVO_KEY = import.meta.env.VITE_BREVO_KEY || "";
let BREVO_SENDER = _s.nomExpediteurSMS || "BdS Hassan";
const SMS_VARS = [
  ["{prenom_eleve}", "Prénom de l'élève"],
  ["{nom_famille}", "Nom de famille / parent"],
  ["{montant_du}", "Montant dû (solde négatif)"],
  ["{date}", "Date du jour"],
];

const formatPhone = (tel) => {
  if (!tel) return null;
  const clean = tel.replace(/[\s\-\.\/\(\)]/g, "");
  if (clean.startsWith("+")) return clean;
  if (clean.startsWith("0")) return "+33" + clean.slice(1);
  return null;
};

const SMSPage = ({ eleves, suiviMensuel, paiements }) => {
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterGroupe, setFilterGroupe] = useState("tous");
  const [previewIdx, setPreviewIdx] = useState(0);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null); // null | []
  const [step, setStep] = useState("compose"); // "compose" | "preview" | "done"
  const msgRef = useState(null);

  const getSolde = useCallback((eid) => {
    const f = suiviMensuel.filter(s => s.eleve_id === eid).reduce((s, x) => s + parseFloat(x.montant_facture || 0), 0);
    const p = paiements.filter(x => x.eleve_id === eid).reduce((s, x) => s + parseFloat(x.montant || 0), 0);
    return p - f;
  }, [suiviMensuel, paiements]);

  const personalize = useCallback((msg, el) => {
    const solde = getSolde(el.id);
    const montantDu = solde < 0 ? Math.abs(solde).toFixed(0) + "€" : "0€";
    return msg
      .replace(/{prenom_eleve}/g, el.prenom)
      .replace(/{nom_famille}/g, el.nom_parent1 || el.nom)
      .replace(/{montant_du}/g, montantDu)
      .replace(/{date}/g, new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }));
  }, [getSolde]);

  // Élèves actifs avec un numéro valide
  const eligibles = useMemo(() => eleves
    .filter(e => e.actif && formatPhone(e.tel_parent1))
    .filter(e => {
      if (filterGroupe !== "tous") return e.forfait === filterGroupe;
      return true;
    })
    .filter(e => !search || `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nom.localeCompare(b.nom)),
    [eleves, filterGroupe, search]
  );

  const sansPhone = useMemo(() => eleves.filter(e => e.actif && !formatPhone(e.tel_parent1)), [eleves]);
  const selectedList = useMemo(() => [...selected].map(id => eleves.find(e => e.id === id)).filter(Boolean), [selected, eleves]);
  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  const toggleAll = () => {
    if (selected.size === eligibles.length) setSelected(new Set());
    else setSelected(new Set(eligibles.map(e => e.id)));
  };

  const insertVar = (v) => {
    const ta = document.getElementById("sms-textarea");
    if (!ta) { setMessage(m => m + v); return; }
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const newMsg = message.slice(0, start) + v + message.slice(end);
    setMessage(newMsg);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + v.length, start + v.length); }, 0);
  };

  const sendAll = async () => {
    setSending(true);
    const res = [];
    for (const el of selectedList) {
      const phone = formatPhone(el.tel_parent1);
      const content = personalize(message, el);
      try {
        const r = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
          method: "POST",
          headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ sender: BREVO_SENDER, recipient: phone, content, type: "transactional" })
        });
        const data = await r.json();
        res.push({ el, ok: r.ok, info: r.ok ? `Envoyé → ${phone}` : (data?.message || "Erreur API") });
      } catch (err) {
        res.push({ el, ok: false, info: err.message });
      }
    }
    setResults(res);
    setSending(false);
    setStep("done");
  };

  const previewEl = selectedList[previewIdx] || selectedList[0];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26 }}>📱</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>SMS Groupés</h2>
          {selected.size > 0 && <Badge color={C.pink}>{selected.size} destinataire{selected.size > 1 ? "s" : ""}</Badge>}
        </div>
        {/* Étapes */}
        <div style={{ display: "flex", gap: 4, background: C.surfaceLight, borderRadius: 10, padding: 4, border: `1px solid ${C.border}` }}>
          {[["compose", "✏️ Rédiger"], ["preview", "👁️ Aperçu"], ["done", "✅ Résultat"]].map(([k, l]) => (
            <button key={k} onClick={() => step !== "done" && setStep(k)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: step === "done" && k !== "done" ? "default" : "pointer", background: step === k ? C.pink : "transparent", color: step === k ? "#fff" : C.textMuted, fontSize: 12, fontWeight: 700 }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, alignItems: "start" }}>

        {/* ── PANNEAU GAUCHE : destinataires ── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Destinataires</span>
            <button onClick={toggleAll} style={{ fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              {selected.size === eligibles.length ? "Tout décocher" : "Tout cocher"}
            </button>
          </div>

          {/* Recherche + filtre */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
              style={{ width: "100%", padding: "9px 12px 9px 36px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <select value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, marginBottom: 12 }}>
            <option value="tous">Tous les forfaits</option>
            {Object.entries(FORFAITS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
          </select>

          {/* Liste */}
          <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {eligibles.map(el => {
              const isSelected = selected.has(el.id);
              const solde = getSolde(el.id);
              return (
                <div key={el.id} onClick={() => {
                  const ns = new Set(selected);
                  isSelected ? ns.delete(el.id) : ns.add(el.id);
                  setSelected(ns);
                }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", background: isSelected ? C.pink + "12" : "transparent", border: `1px solid ${isSelected ? C.pink + "44" : C.border}`, transition: "all 0.1s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? C.pink : C.border}`, background: isSelected ? C.pink : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isSelected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{el.prenom} {el.nom}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{el.classe} · {formatPhone(el.tel_parent1)}</div>
                  </div>
                  {solde < 0 && <Badge color={C.danger}>{Math.abs(solde).toFixed(0)}€</Badge>}
                </div>
              );
            })}
            {eligibles.length === 0 && <div style={{ color: C.textDim, fontSize: 13, textAlign: "center", padding: 20 }}>Aucun élève trouvé</div>}
          </div>

          {/* Avertissement sans téléphone */}
          {sansPhone.length > 0 && (
            <div style={{ marginTop: 12, background: C.warning + "12", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: C.warning }}>
              ⚠️ {sansPhone.length} élève{sansPhone.length > 1 ? "s" : ""} sans numéro : {sansPhone.slice(0, 3).map(e => e.prenom).join(", ")}{sansPhone.length > 3 ? "…" : ""}
            </div>
          )}
        </div>

        {/* ── PANNEAU DROIT : rédaction / aperçu / résultats ── */}
        <div>

          {/* ÉTAPE RÉDACTION */}
          {step === "compose" && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>✏️ Message</div>

              {/* Boutons variables */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Variables automatiques</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {SMS_VARS.map(([v, l]) => (
                    <button key={v} onClick={() => insertVar(v)} title={l}
                      style={{ padding: "5px 12px", borderRadius: 20, border: `2px solid ${C.pink}44`, background: C.pink + "10", color: C.pink, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{v}</button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                id="sms-textarea"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Bonjour {prenom_eleve}, votre solde BdS est de {montant_du}. Merci. BdS Hassan"
                style={{ width: "100%", minHeight: 120, padding: "12px 14px", background: C.surfaceLight, border: `2px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: charCount > 160 ? C.warning : C.textDim }}>{charCount} caractère{charCount > 1 ? "s" : ""} · {smsCount} SMS{smsCount > 1 ? " (message long)" : ""}</span>
                <span style={{ fontSize: 12, color: C.textMuted }}>Expéditeur : <strong>{BREVO_SENDER}</strong></span>
              </div>

              {/* Aperçu rapide */}
              {previewEl && message && (
                <div style={{ background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 6 }}>APERÇU — {previewEl.prenom} {previewEl.nom}</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{personalize(message, previewEl)}</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Btn onClick={() => setStep("preview")} disabled={!message || selected.size === 0} color={C.pink}>
                  👁️ Aperçu complet ({selected.size})
                </Btn>
              </div>
            </div>
          )}

          {/* ÉTAPE APERÇU */}
          {step === "preview" && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>👁️ Aperçu des messages ({selectedList.length})</div>
                <Btn small onClick={() => setStep("compose")} color={C.textMuted} outline>← Modifier</Btn>
              </div>

              {/* Navigation destinataires */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {selectedList.map((el, i) => (
                  <button key={el.id} onClick={() => setPreviewIdx(i)}
                    style={{ padding: "5px 12px", borderRadius: 20, border: `2px solid ${i === previewIdx ? C.pink : C.border}`, background: i === previewIdx ? C.pink + "15" : "transparent", color: i === previewIdx ? C.pink : C.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {el.prenom}
                  </button>
                ))}
              </div>

              {/* Message personnalisé */}
              {previewEl && (
                <div style={{ background: C.surfaceLight, borderRadius: 12, padding: 16, marginBottom: 16, border: `2px solid ${C.pink}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.text }}>{previewEl.prenom} {previewEl.nom}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{formatPhone(previewEl.tel_parent1)}</div>
                    </div>
                    <Badge color={C.textMuted}>{personalize(message, previewEl).length} car.</Badge>
                  </div>
                  {/* SMS bubble */}
                  <div style={{ background: C.pink, borderRadius: "18px 18px 4px 18px", padding: "12px 16px", maxWidth: "80%", marginLeft: "auto" }}>
                    <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{personalize(message, previewEl)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, textAlign: "right", marginTop: 6 }}>De : {BREVO_SENDER}</div>
                </div>
              )}

              {/* Récap envoi */}
              <div style={{ background: C.pink + "10", border: `2px solid ${C.pink}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.pink, marginBottom: 4 }}>Récapitulatif de l'envoi</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{selectedList.length} destinataire{selectedList.length > 1 ? "s" : ""} · {smsCount} SMS/destinataire · Expéditeur : {BREVO_SENDER}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Btn onClick={() => setStep("compose")} color={C.textMuted} outline>← Modifier</Btn>
                <Btn onClick={sendAll} disabled={sending} color={C.pink}>
                  {sending ? `⏳ Envoi en cours (${results ? results.length : 0}/${selectedList.length})…` : `📱 Envoyer ${selectedList.length} SMS`}
                </Btn>
              </div>
            </div>
          )}

          {/* ÉTAPE RÉSULTATS */}
          {step === "done" && results && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>✅ Résultats de l'envoi</div>

              {/* KPIs résultats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: C.success + "12", border: `2px solid ${C.success}44`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.success }}>{results.filter(r => r.ok).length}</div>
                  <div style={{ fontSize: 12, color: C.success, fontWeight: 700 }}>SMS envoyés ✓</div>
                </div>
                <div style={{ background: results.filter(r => !r.ok).length > 0 ? C.danger + "12" : C.surfaceLight, border: `2px solid ${results.filter(r => !r.ok).length > 0 ? C.danger + "44" : C.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: results.filter(r => !r.ok).length > 0 ? C.danger : C.textDim }}>{results.filter(r => !r.ok).length}</div>
                  <div style={{ fontSize: 12, color: results.filter(r => !r.ok).length > 0 ? C.danger : C.textDim, fontWeight: 700 }}>Échecs</div>
                </div>
              </div>

              {/* Détail par destinataire */}
              <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderRadius: 8, background: r.ok ? C.success + "10" : C.danger + "10", border: `1px solid ${r.ok ? C.success + "33" : C.danger + "33"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{r.ok ? "✅" : "❌"}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{r.el.prenom} {r.el.nom}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{formatPhone(r.el.tel_parent1)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: r.ok ? C.success : C.danger, fontWeight: 600, textAlign: "right", maxWidth: 180 }}>{r.info}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <Btn onClick={() => { setStep("compose"); setResults(null); setSelected(new Set()); setMessage(""); }} color={C.pink}>
                  📱 Nouveau SMS
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══ MODULE 6 : FINANCE ═══
const FinancePage = ({ eleves, suiviMensuel, paiements }) => {
  const [tab, setTab] = useState("mensuel");
  const [moisSelect, setMoisSelect] = useState(getMoisActuel());
  const [expanded, setExpanded] = useState(null);
  const [smsState, setSmsState] = useState({});
  const [smsMsg, setSmsMsg] = useState("Bonjour {nom_famille}, votre solde Bulles de Savoir est de {montant_du}€. Merci de régulariser votre situation. BdS Hassan");
  const [relanceAll, setRelanceAll] = useState(false);

  const familles = useMemo(() => {
    const fam = {};
    eleves.filter(e => e.actif).forEach(el => {
      const fkey = el.nom_parent1?.trim() || `${el.prenom} ${el.nom}`;
      if (!fam[fkey]) fam[fkey] = { key: fkey, label: fkey, tel: el.tel_parent1 || el.tel_parent2 || "", students: [], factureTotal: 0, payeTotal: 0, factureMois: {} };
      fam[fkey].students.push(el);
      suiviMensuel.filter(s => s.eleve_id === el.id).forEach(s => {
        const m = s.mois; const v = parseFloat(s.montant_facture || 0);
        fam[fkey].factureMois[m] = (fam[fkey].factureMois[m] || 0) + v;
        fam[fkey].factureTotal += v;
      });
      fam[fkey].payeTotal += paiements.filter(p => p.eleve_id === el.id).reduce((s, x) => s + parseFloat(x.montant || 0), 0);
    });
    return Object.values(fam).map(f => ({ ...f, solde: f.payeTotal - f.factureTotal })).sort((a, b) => a.label.localeCompare(b.label));
  }, [eleves, suiviMensuel, paiements]);

  const impayes = useMemo(() => familles.filter(f => f.solde < -0.01).sort((a, b) => a.solde - b.solde), [familles]);
  const famMois = useMemo(() => familles.filter(f => (f.factureMois[moisSelect] || 0) > 0), [familles, moisSelect]);
  const totalFactureMois = famMois.reduce((s, f) => s + (f.factureMois[moisSelect] || 0), 0);
  const totalImpayes = impayes.reduce((s, f) => s + f.solde, 0);

  const detailMois = (fam, mois) => fam.students.map(el => {
    const v = suiviMensuel.filter(s => s.eleve_id === el.id && s.mois === mois).reduce((s, x) => s + parseFloat(x.montant_facture || 0), 0);
    return { ...el, facture: v };
  }).filter(el => el.facture > 0);

  const printInvoice = (fam, mois) => {
    const details = detailMois(fam, mois);
    const totalMois = details.reduce((s, el) => s + el.facture, 0);
    const pays = paiements.filter(p => fam.students.some(el => el.id === p.eleve_id)).sort((a, b) => (a.date_paiement || "").localeCompare(b.date_paiement || ""));
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture BdS - ${fam.label} - ${mois}</title><style>
      *{font-family:'Segoe UI',sans-serif;margin:0;padding:0;box-sizing:border-box}body{padding:40px;color:#1a1a2e}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;border-bottom:3px solid #e91e63;padding-bottom:20px}
      .logo{font-size:24px;font-weight:800;color:#e91e63}.logo-sub{font-size:12px;color:#888;margin-top:4px}
      .info{text-align:right;font-size:13px;color:#555}.sec{font-size:13px;font-weight:700;color:#e91e63;text-transform:uppercase;letter-spacing:1px;margin:24px 0 10px}
      table{width:100%;border-collapse:collapse}th{background:#fce4ec;padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#e91e63}
      td{padding:10px 12px;border-bottom:1px solid #f5f5f5;font-size:13px}.r{text-align:right;font-weight:600}
      .tr td{font-weight:800;font-size:14px;background:#fff8f9;border-top:2px solid #e91e63}
      .sb{margin-top:24px;padding:16px 20px;border-radius:12px;display:flex;justify-content:space-between;align-items:center}
      .ok{background:#e8f5e9;color:#2e7d32}.du{background:#fce4ec;color:#c62828}
      .ft{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center}
      @media print{body{padding:20px}}
    </style></head><body>
      <div class="hdr"><div><div class="logo">🎓 ${_s.nomStructure}</div><div class="logo-sub">${[_s.adresse, _s.telephone, _s.email].filter(Boolean).join(" · ") || "Centre de soutien scolaire"}${_s.siret ? `<br>SIRET : ${_s.siret}` : ""}</div></div>
      <div class="info"><strong>Récapitulatif ${mois}</strong><br>Édité le ${new Date().toLocaleDateString("fr-FR")}<br><br><strong>Famille : ${fam.label}</strong></div></div>
      <div class="sec">Séances de ${mois}</div>
      <table><thead><tr><th>Élève</th><th>Forfait</th><th class="r">Montant</th></tr></thead><tbody>
        ${details.map(el => `<tr><td>${el.prenom} ${el.nom}</td><td>${(FORFAITS[el.forfait] || { l: el.forfait || "—" }).l}</td><td class="r">${el.facture.toFixed(2)} €</td></tr>`).join("")}
        <tr class="tr"><td colspan="2">Total facturé ${mois}</td><td class="r">${totalMois.toFixed(2)} €</td></tr>
      </tbody></table>
      <div class="sec">Historique des paiements</div>
      ${pays.length > 0 ? `<table><thead><tr><th>Date</th><th>Mois</th><th>Mode</th><th class="r">Montant</th></tr></thead><tbody>
        ${pays.map(p => `<tr><td>${p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : "—"}</td><td>${p.mois_concerne || "—"}</td><td>${p.mode_paiement || "—"}</td><td class="r">${parseFloat(p.montant).toFixed(2)} €</td></tr>`).join("")}
      </tbody></table>` : `<p style="color:#aaa;font-size:13px">Aucun paiement enregistré.</p>`}
      <div class="sb ${fam.solde >= 0 ? "ok" : "du"}">
        <span style="font-weight:700;font-size:15px">${fam.solde >= 0 ? "✓ Compte à jour" : "⚠ Solde dû"}</span>
        <span style="font-weight:800;font-size:18px">${fam.solde >= 0 ? "+" : ""}${fam.solde.toFixed(2)} €</span>
      </div>
      <div class="ft">${_s.nomStructure} · Document généré automatiquement · ${new Date().toLocaleDateString("fr-FR")}</div>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 500);
  };

  const sendRelanceSMS = async (fam) => {
    const phone = formatPhone(fam.tel);
    if (!phone) { setSmsState(s => ({ ...s, [fam.key]: "no_tel" })); return; }
    setSmsState(s => ({ ...s, [fam.key]: "sending" }));
    const content = smsMsg.replace(/{nom_famille}/g, fam.label).replace(/{montant_du}/g, Math.abs(fam.solde).toFixed(0)).replace(/{date}/g, new Date().toLocaleDateString("fr-FR"));
    try {
      const r = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", { method: "POST", headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ sender: BREVO_SENDER, recipient: phone, content, type: "transactional" }) });
      setSmsState(s => ({ ...s, [fam.key]: r.ok ? "ok" : "err" }));
    } catch { setSmsState(s => ({ ...s, [fam.key]: "err" })); }
  };

  const sendAllRelances = async () => {
    setRelanceAll(true);
    for (const fam of impayes) { if (smsState[fam.key] !== "ok") await sendRelanceSMS(fam); }
    setRelanceAll(false);
  };

  const tabBtn = (active) => ({ padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: active ? 700 : 500, background: active ? C.accent : C.surface, color: active ? "#fff" : C.text, fontSize: 14, transition: "all 0.15s" });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[{ icon: "💶", label: `Facturé ${moisSelect}`, val: `${totalFactureMois.toFixed(0)} €`, c: C.blue },
          { icon: "🏦", label: "Total impayés", val: `${Math.abs(totalImpayes).toFixed(0)} €`, c: impayes.length > 0 ? C.danger : C.success },
          { icon: "👨‍👩‍👧", label: "Familles en retard", val: `${impayes.length}`, c: impayes.length > 0 ? C.warning : C.success }
        ].map(k => (
          <div key={k.label} style={{ background: C.surface, borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${k.c}` }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.c }}>{k.val}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button style={tabBtn(tab === "mensuel")} onClick={() => setTab("mensuel")}>📅 Récap mensuel</button>
        <button style={tabBtn(tab === "impayes")} onClick={() => setTab("impayes")}>⚠️ Impayés ({impayes.length})</button>
      </div>

      {tab === "mensuel" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <span style={{ fontWeight: 600, color: C.textMuted, fontSize: 14 }}>Mois :</span>
            <select value={moisSelect} onChange={e => setMoisSelect(e.target.value)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, fontWeight: 600 }}>
              {MOIS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span style={{ fontSize: 13, color: C.textMuted }}>{famMois.length} famille{famMois.length > 1 ? "s" : ""} · {totalFactureMois.toFixed(0)} € facturés</span>
          </div>
          {famMois.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 14, background: C.surface, borderRadius: 16, border: `1px solid ${C.border}` }}>Aucune séance facturée pour {moisSelect}.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {famMois.map(fam => {
                const isOpen = expanded === fam.key;
                const details = isOpen ? detailMois(fam, moisSelect) : [];
                return (
                  <div key={fam.key} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : fam.key)}>
                      <span style={{ fontSize: 16 }}>{isOpen ? "▼" : "▶"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{fam.label}</div>
                        <div style={{ fontSize: 12, color: C.textMuted }}>{fam.students.length} élève{fam.students.length > 1 ? "s" : ""} · {fam.students.map(e => `${e.prenom} ${e.nom}`).join(", ")}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: C.blue }}>{(fam.factureMois[moisSelect] || 0).toFixed(0)} €</div>
                        <div style={{ fontSize: 12, color: fam.solde >= 0 ? C.success : C.danger, fontWeight: 600 }}>Solde global : {fam.solde >= 0 ? "+" : ""}{fam.solde.toFixed(0)} €</div>
                      </div>
                      <button style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: C.accent + "15", color: C.accent, fontWeight: 700, cursor: "pointer", fontSize: 13, marginLeft: 8 }}
                        onClick={e => { e.stopPropagation(); printInvoice(fam, moisSelect); }}>🖨️ Facture</button>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${C.border}`, background: C.bg, padding: "12px 18px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead><tr style={{ color: C.textMuted, fontSize: 12, fontWeight: 600 }}>
                            <th style={{ textAlign: "left", padding: "6px 10px" }}>Élève</th>
                            <th style={{ textAlign: "left", padding: "6px 10px" }}>Forfait</th>
                            <th style={{ textAlign: "right", padding: "6px 10px" }}>Facturé {moisSelect}</th>
                          </tr></thead>
                          <tbody>
                            {details.map(el => (
                              <tr key={el.id}>
                                <td style={{ padding: "8px 10px", fontWeight: 600, fontSize: 14 }}>{el.prenom} {el.nom}</td>
                                <td style={{ padding: "8px 10px" }}><Badge color={(FORFAITS[el.forfait] || {}).c || C.textMuted}>{(FORFAITS[el.forfait] || { l: el.forfait || "—" }).l}</Badge></td>
                                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: C.blue, fontSize: 14 }}>{el.facture.toFixed(0)} €</td>
                              </tr>
                            ))}
                            <tr style={{ borderTop: `2px solid ${C.border}` }}>
                              <td colSpan={2} style={{ padding: "8px 10px", fontSize: 14, fontWeight: 800 }}>Total</td>
                              <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 15, fontWeight: 800, color: C.accent }}>{(fam.factureMois[moisSelect] || 0).toFixed(0)} €</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "impayes" && (
        <div>
          {impayes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50, color: C.success, fontSize: 16, fontWeight: 700, background: C.success + "10", borderRadius: 16, border: `2px solid ${C.success}33` }}>
              ✅ Aucun impayé — toutes les familles sont à jour !
            </div>
          ) : (
            <>
              <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 18, marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>Message de relance SMS</div>
                <textarea value={smsMsg} onChange={e => setSmsMsg(e.target.value)} rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                  Variables disponibles :{" "}
                  {["{nom_famille}", "{montant_du}", "{date}"].map(v => <code key={v} style={{ background: C.surfaceLight, padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>{v}</code>)}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button disabled={relanceAll} onClick={sendAllRelances}
                    style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.danger, color: "#fff", fontWeight: 700, cursor: relanceAll ? "not-allowed" : "pointer", fontSize: 14, opacity: relanceAll ? 0.6 : 1 }}>
                    {relanceAll ? "⏳ Envoi en cours..." : `📱 Relancer les ${impayes.length} famille${impayes.length > 1 ? "s" : ""} en retard`}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {impayes.map(fam => {
                  const st = smsState[fam.key];
                  const hasPhone = !!formatPhone(fam.tel);
                  return (
                    <div key={fam.key} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{fam.label}</div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{fam.students.length} élève{fam.students.length > 1 ? "s" : ""} · {fam.students.map(e => `${e.prenom} ${e.nom}`).join(", ")}</div>
                        {fam.tel ? <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>📞 {fam.tel}{!hasPhone && <span style={{ color: C.danger }}> (format invalide)</span>}</div>
                          : <div style={{ fontSize: 12, color: C.danger, marginTop: 2 }}>⚠ Aucun téléphone enregistré</div>}
                      </div>
                      <div style={{ textAlign: "right", minWidth: 90 }}>
                        <div style={{ fontSize: 11, color: C.textMuted }}>Facturé</div>
                        <div style={{ fontWeight: 700, color: C.blue }}>{fam.factureTotal.toFixed(0)} €</div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: 90 }}>
                        <div style={{ fontSize: 11, color: C.textMuted }}>Payé</div>
                        <div style={{ fontWeight: 700, color: C.success }}>{fam.payeTotal.toFixed(0)} €</div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: 100 }}>
                        <div style={{ fontSize: 11, color: C.textMuted }}>Solde</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: C.danger }}>{fam.solde.toFixed(0)} €</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 130 }}>
                        <button disabled={!hasPhone || st === "sending" || st === "ok"} onClick={() => sendRelanceSMS(fam)}
                          style={{ padding: "8px 12px", borderRadius: 8, border: "none", fontWeight: 700, cursor: (!hasPhone || st === "ok") ? "not-allowed" : "pointer", fontSize: 12,
                            background: st === "ok" ? C.success : st === "err" ? C.danger : st === "sending" ? C.textMuted : C.warning, color: "#fff", opacity: (!hasPhone || st === "sending") ? 0.6 : 1 }}>
                          {st === "ok" ? "✅ SMS envoyé" : st === "err" ? "❌ Échec" : st === "no_tel" ? "📵 Pas de tél" : st === "sending" ? "⏳..." : "📱 SMS Relance"}
                        </button>
                        <button onClick={() => printInvoice(fam, moisSelect)}
                          style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: C.accent + "15", color: C.accent, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                          🖨️ Facture
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ═══ MODULE 7 : CONGÉS & FERMETURES ═══
const loadFermetures = () => { try { return JSON.parse(localStorage.getItem("bds_fermetures") || "[]"); } catch { return []; } };
const saveFermeturesLS = (list) => localStorage.setItem("bds_fermetures", JSON.stringify(list));
const mkId = () => Math.random().toString(36).slice(2, 10);

const getFamillesConcernees = (ferm, creneaux, affectations, eleves) => {
  if (!ferm.date_debut || !ferm.date_fin) return [];
  const dates = [];
  const d = new Date(ferm.date_debut + "T12:00:00");
  const end = new Date(ferm.date_fin + "T12:00:00");
  while (d <= end) { dates.push(d.toISOString().split("T")[0]); d.setDate(d.getDate() + 1); }
  const crenIds = new Set();
  dates.forEach(ds => {
    const dayName = JOURS_SEMAINE[new Date(ds + "T12:00:00").getDay()];
    creneaux.filter(cr => cr.jour === dayName && (cr.type_creneau || "regulier") === "regulier").forEach(cr => crenIds.add(cr.id));
  });
  const fams = {};
  affectations.filter(a => a.actif && crenIds.has(a.creneau_id)).forEach(aff => {
    const el = eleves.find(e => e.id === aff.eleve_id && e.actif);
    if (!el) return;
    const fkey = el.nom_parent1?.trim() || `${el.prenom} ${el.nom}`;
    if (!fams[fkey]) fams[fkey] = { key: fkey, label: fkey, tel: el.tel_parent1 || el.tel_parent2 || "", elevMap: new Map() };
    fams[fkey].elevMap.set(el.id, el);
  });
  return Object.values(fams).map(f => ({ ...f, eleves: [...f.elevMap.values()] }));
};

const fmtRangeFR = (ferm) => {
  const opts = { day: "2-digit", month: "long" };
  const d1 = new Date(ferm.date_debut + "T12:00:00").toLocaleDateString("fr-FR", opts);
  if (ferm.date_debut === ferm.date_fin) return new Date(ferm.date_debut + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", ...opts });
  const d2 = new Date(ferm.date_fin + "T12:00:00").toLocaleDateString("fr-FR", opts);
  return `du ${d1} au ${d2}`;
};

const AddFermetureModal = ({ onClose, onSave, creneaux, affectations, eleves }) => {
  const [form, setForm] = useState({ titre: "", date_debut: todayStr(), date_fin: todayStr(), note: "" });
  const setF = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const preview = useMemo(() => getFamillesConcernees(form, creneaux, affectations, eleves), [form.date_debut, form.date_fin, creneaux, affectations, eleves]);
  const nbEl = preview.reduce((s, f) => s + f.eleves.length, 0);
  return (
    <Modal open={true} onClose={onClose} title="📆 Nouvelle fermeture">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>Titre *</div>
          <input value={form.titre} onChange={e => setF("titre")(e.target.value)} placeholder="Ex : Pont de l'Ascension, Fermeture exceptionnelle..."
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>Date début</div>
            <input type="date" value={form.date_debut} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, date_debut: v, date_fin: f.date_fin < v ? v : f.date_fin })); }}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>Date fin</div>
            <input type="date" value={form.date_fin} min={form.date_debut} onChange={e => setF("date_fin")(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 14, boxSizing: "border-box" }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>Note interne (optionnel)</div>
          <textarea value={form.note} onChange={e => setF("note")(e.target.value)} rows={2} placeholder="Motif, commentaire..."
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        <div style={{ background: preview.length > 0 ? C.warning + "12" : C.surfaceLight, borderRadius: 10, padding: "12px 16px", border: `1px solid ${preview.length > 0 ? C.warning + "44" : C.border}` }}>
          {preview.length > 0 ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.warning, marginBottom: 8 }}>⚠️ {preview.length} famille{preview.length > 1 ? "s" : ""} concernée{preview.length > 1 ? "s" : ""} · {nbEl} élève{nbEl > 1 ? "s" : ""}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{preview.map(f => <Badge key={f.key} color={C.warning}>{f.label} ({f.eleves.length})</Badge>)}</div>
            </>
          ) : (
            <div style={{ color: C.textMuted, fontSize: 13 }}>Aucun cours régulier sur cette période.</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn onClick={() => onSave(form)} color={C.warning} disabled={!form.titre.trim()}>✓ Enregistrer</Btn>
        </div>
      </div>
    </Modal>
  );
};

const FermetureSMSModal = ({ fermeture, onClose, onSent, creneaux, affectations, eleves }) => {
  const families = useMemo(() => getFamillesConcernees(fermeture, creneaux, affectations, eleves), [fermeture]);
  const defMsg = `Bonjour {nom_famille}, les cours sont annulés ${fmtRangeFR(fermeture)} (${fermeture.titre}). Merci de votre compréhension. ${BREVO_SENDER}`;
  const [msg, setMsg] = useState(defMsg);
  const [selected, setSelected] = useState(() => new Set(families.map(f => f.key)));
  const [smsState, setSmsState] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (k) => setSelected(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const personalize = (fam) => msg
    .replace(/{nom_famille}/g, fam.label)
    .replace(/{titre}/g, fermeture.titre)
    .replace(/{date_debut}/g, new Date(fermeture.date_debut + "T12:00:00").toLocaleDateString("fr-FR"))
    .replace(/{date_fin}/g, new Date(fermeture.date_fin + "T12:00:00").toLocaleDateString("fr-FR"))
    .replace(/{date}/g, new Date().toLocaleDateString("fr-FR"));

  const sendAll = async () => {
    setSending(true);
    for (const fam of families.filter(f => selected.has(f.key))) {
      const phone = formatPhone(fam.tel);
      if (!phone) { setSmsState(s => ({ ...s, [fam.key]: "no_tel" })); continue; }
      setSmsState(s => ({ ...s, [fam.key]: "sending" }));
      try {
        const r = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", { method: "POST", headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ sender: BREVO_SENDER, recipient: phone, content: personalize(fam), type: "transactional" }) });
        setSmsState(s => ({ ...s, [fam.key]: r.ok ? "ok" : "err" }));
      } catch { setSmsState(s => ({ ...s, [fam.key]: "err" })); }
    }
    setSending(false); setDone(true);
  };

  const okCount = Object.values(smsState).filter(v => v === "ok").length;

  if (done) return (
    <Modal open={true} onClose={onSent} title="📱 Résultats">
      <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{okCount} SMS envoyé{okCount > 1 ? "s" : ""} sur {families.filter(f => selected.has(f.key)).length}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", marginBottom: 20 }}>
        {families.filter(f => selected.has(f.key)).map(fam => {
          const st = smsState[fam.key];
          return <div key={fam.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", borderRadius: 7, background: C.surfaceLight, fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>{fam.label}</span>
            <Badge color={st === "ok" ? C.success : st === "no_tel" ? C.textMuted : C.danger}>{st === "ok" ? "✅ Envoyé" : st === "no_tel" ? "📵 Pas de tél" : "❌ Échec"}</Badge>
          </div>;
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}><Btn onClick={onSent} color={C.success}>Fermer & marquer notifié</Btn></div>
    </Modal>
  );

  return (
    <Modal open={true} onClose={onClose} title="📱 Notifier les familles" wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.warning + "12", borderRadius: 10, padding: "10px 16px", border: `1px solid ${C.warning}40` }}>
          <div style={{ fontWeight: 700, color: C.warning }}>{fermeture.titre}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{fmtRangeFR(fermeture)}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>Message</div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            Variables : {["{nom_famille}","{titre}","{date_debut}","{date_fin}"].map(v => <code key={v} style={{ background: C.surfaceLight, padding: "1px 5px", borderRadius: 3, marginRight: 4 }}>{v}</code>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
            Destinataires ({selected.size}/{families.length})
            <button onClick={() => setSelected(new Set(families.map(f => f.key)))} style={{ marginLeft: 8, fontSize: 11, color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Tout sélectionner</button>
          </div>
          {families.length === 0
            ? <div style={{ color: C.textMuted, fontSize: 13, fontStyle: "italic" }}>Aucune famille concernée sur ces dates.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {families.map(fam => (
                  <label key={fam.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: selected.has(fam.key) ? C.accent + "08" : C.surfaceLight, border: `1px solid ${selected.has(fam.key) ? C.accent + "30" : C.border}`, cursor: "pointer" }}>
                    <input type="checkbox" checked={selected.has(fam.key)} onChange={() => toggle(fam.key)} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{fam.label}</span>
                      <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>{fam.eleves.map(e => e.prenom).join(", ")}</span>
                    </div>
                    {!fam.tel
                      ? <span style={{ fontSize: 11, color: C.danger }}>Pas de tél</span>
                      : !formatPhone(fam.tel) && <span style={{ fontSize: 11, color: C.danger }}>Tél invalide</span>}
                  </label>
                ))}
              </div>}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn onClick={onClose}>Annuler</Btn>
          <Btn onClick={sendAll} color={C.warning} disabled={sending || selected.size === 0}>
            {sending ? "⏳ Envoi en cours..." : `📱 Envoyer à ${selected.size} famille${selected.size > 1 ? "s" : ""}`}
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

const FermetureCard = ({ f, creneaux, affectations, eleves, today, onSms, onDelete }) => {
  const families = getFamillesConcernees(f, creneaux, affectations, eleves);
  const nbEl = families.reduce((s, fm) => s + fm.eleves.length, 0);
  const isPast = f.date_fin < today;
  return (
    <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", opacity: isPast ? 0.6 : 1 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: isPast ? C.surfaceLight : C.warning + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        {isPast ? "📁" : "🔒"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{f.titre}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{fmtRangeFR(f)}</div>
        {f.note && <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>📝 {f.note}</div>}
        <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Badge color={families.length > 0 ? C.blue : C.textMuted}>{families.length} famille{families.length !== 1 ? "s" : ""}</Badge>
          <Badge color={nbEl > 0 ? C.purple : C.textMuted}>{nbEl} élève{nbEl !== 1 ? "s" : ""}</Badge>
          {f.smsEnvoye && <Badge color={C.success}>✅ Notifié</Badge>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {!isPast && (
          <button onClick={onSms} disabled={families.length === 0}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: families.length > 0 ? C.warning + "20" : C.surfaceLight, color: families.length > 0 ? C.warning : C.textDim, fontWeight: 700, cursor: families.length > 0 ? "pointer" : "not-allowed", fontSize: 13 }}>
            📱 Notifier
          </button>
        )}
        <button onClick={onDelete}
          style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: C.danger + "10", color: C.danger, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
          🗑
        </button>
      </div>
    </div>
  );
};

const CongesPage = ({ creneaux, affectations, eleves }) => {
  const [fermetures, setFermetures] = useState(loadFermetures);
  const [showAdd, setShowAdd] = useState(false);
  const [smsTarget, setSmsTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const updateList = (list) => { setFermetures(list); saveFermeturesLS(list); };
  const addFermeture = (f) => updateList([...fermetures, { ...f, id: mkId(), created_at: new Date().toISOString(), smsEnvoye: false }].sort((a, b) => a.date_debut.localeCompare(b.date_debut)));
  const markSent = (id) => updateList(fermetures.map(f => f.id === id ? { ...f, smsEnvoye: true } : f));
  const removeFermeture = (id) => { updateList(fermetures.filter(f => f.id !== id)); setDeletingId(null); };

  const today = todayStr();
  const upcoming = fermetures.filter(f => f.date_fin >= today);
  const past = fermetures.filter(f => f.date_fin < today).slice().reverse();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Congés & Fermetures</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{upcoming.length} fermeture{upcoming.length !== 1 ? "s" : ""} à venir</div>
        </div>
        <Btn onClick={() => setShowAdd(true)} color={C.warning}>+ Ajouter une fermeture</Btn>
      </div>

      {upcoming.length === 0
        ? <div style={{ textAlign: "center", padding: 48, color: C.textMuted, fontSize: 14, background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 20 }}>📅 Aucune fermeture prévue — tout est ouvert !</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {upcoming.map(f => <FermetureCard key={f.id} f={f} creneaux={creneaux} affectations={affectations} eleves={eleves} today={today} onSms={() => setSmsTarget(f)} onDelete={() => setDeletingId(f.id)} />)}
          </div>}

      {past.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Historique</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {past.map(f => <FermetureCard key={f.id} f={f} creneaux={creneaux} affectations={affectations} eleves={eleves} today={today} onSms={() => setSmsTarget(f)} onDelete={() => setDeletingId(f.id)} />)}
          </div>
        </>
      )}

      {deletingId && (
        <Modal open={true} onClose={() => setDeletingId(null)} title="Confirmer la suppression">
          <p style={{ marginBottom: 20, color: C.textMuted, fontSize: 14 }}>Supprimer cette fermeture ? Cette action est irréversible.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => removeFermeture(deletingId)} color={C.danger}>Supprimer</Btn>
            <Btn onClick={() => setDeletingId(null)}>Annuler</Btn>
          </div>
        </Modal>
      )}

      {showAdd && <AddFermetureModal onClose={() => setShowAdd(false)} onSave={(f) => { addFermeture(f); setShowAdd(false); }} creneaux={creneaux} affectations={affectations} eleves={eleves} />}
      {smsTarget && <FermetureSMSModal fermeture={smsTarget} onClose={() => setSmsTarget(null)} onSent={() => { markSent(smsTarget.id); setSmsTarget(null); }} creneaux={creneaux} affectations={affectations} eleves={eleves} />}
    </div>
  );
};

// ═══ PAGE PARAMÈTRES ═══
// ParamSection et ParamField définis au niveau module (jamais à l'intérieur d'un composant)
// pour éviter le re-mount à chaque frappe qui fait sauter le curseur.
const ParamSection = ({ title, children }) => (
  <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>{title}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>{children}</div>
  </div>
);

const ParamField = ({ label, value, onChange, type = "text", max, hint }) => (
  <div>
    <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>
      {label}{hint && <span style={{ fontWeight: 400, color: C.textDim }}> ({hint})</span>}
    </div>
    <input type={type} value={value ?? ""} maxLength={max}
      onChange={e => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
  </div>
);

const ParametresPage = () => {
  const { settings, saveSettings } = useSettings();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    saveSettings({ ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <ParamSection title="🏫 Structure">
        <ParamField label="Nom de la structure" value={form.nomStructure} onChange={set("nomStructure")} />
        <ParamField label="Année scolaire" value={form.anneeScolaire} onChange={set("anneeScolaire")} hint="ex: 2025-2026" />
        <ParamField label="Adresse" value={form.adresse} onChange={set("adresse")} />
        <ParamField label="Téléphone" value={form.telephone} onChange={set("telephone")} />
        <ParamField label="Email" value={form.email} onChange={set("email")} />
        <ParamField label="SIRET" value={form.siret} onChange={set("siret")} />
      </ParamSection>

      <ParamSection title="💶 Tarifs (€/heure)">
        <ParamField label="Groupe" value={form.tarifGroupe} onChange={set("tarifGroupe")} type="number" />
        <ParamField label="Réduit (Triple / Double)" value={form.tarifReduit} onChange={set("tarifReduit")} type="number" />
        <ParamField label="Individuel" value={form.tarifIndividuel} onChange={set("tarifIndividuel")} type="number" />
        <ParamField label="Stage" value={form.tarifStage} onChange={set("tarifStage")} type="number" />
        <ParamField label="Cotisation annuelle (€/famille)" value={form.cotisation} onChange={set("cotisation")} type="number" />
      </ParamSection>

      <ParamSection title="🪑 Capacités (places max)">
        <ParamField label="Groupe" value={form.capaciteGroupe} onChange={set("capaciteGroupe")} type="number" hint="défaut 6" />
        <ParamField label="Groupe Réduit" value={form.capaciteReduit} onChange={set("capaciteReduit")} type="number" hint="défaut 3" />
        <ParamField label="Duo" value={form.capaciteDuo} onChange={set("capaciteDuo")} type="number" hint="défaut 2" />
        <ParamField label="Stage" value={form.capaciteStage} onChange={set("capaciteStage")} type="number" hint="défaut 6" />
      </ParamSection>

      <ParamSection title="📱 SMS">
        <ParamField label="Expéditeur SMS" value={form.nomExpediteurSMS} onChange={set("nomExpediteurSMS")} max={11} hint="11 car. max" />
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
          <div style={{ background: C.surfaceLight, borderRadius: 10, padding: "10px 16px", fontSize: 13 }}>
            <span style={{ color: C.textMuted, fontSize: 11 }}>Aperçu :</span><br />
            <strong style={{ color: C.text }}>De : {form.nomExpediteurSMS || "—"}</strong>
            {(form.nomExpediteurSMS?.length || 0) > 11 && <div style={{ color: C.danger, fontSize: 11, marginTop: 4 }}>⚠ Trop long (max 11 caractères)</div>}
          </div>
        </div>
      </ParamSection>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={handleSave} disabled={(form.nomExpediteurSMS?.length || 0) > 11}
          style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          ✓ Enregistrer les paramètres
        </button>
        {saved && <span style={{ color: C.success, fontWeight: 600, fontSize: 14 }}>✅ Sauvegardé !</span>}
      </div>
    </div>
  );
};

// ═══ MAIN ═══
const PAGES = [{key:"dashboard",icon:"🏠",label:"Tableau de bord"},{key:"planning",icon:"📋",label:"Planning / Appel"},{key:"eleves",icon:"👥",label:"Élèves"},{key:"creneaux",icon:"📅",label:"Créneaux"},{key:"paiements",icon:"💳",label:"Paiements"},{key:"disponibilites",icon:"🟢",label:"Disponibilités"},{key:"sms",icon:"📱",label:"SMS Groupés"},{key:"finance",icon:"💶",label:"Finance"},{key:"conges",icon:"📆",label:"Congés / Fermetures"},{key:"parametres",icon:"⚙️",label:"Paramètres"}];

export default function App() {
  const [page, setPage] = useState("dashboard"); const [pageParams, setPageParams] = useState({});
  const [eleves, setEleves] = useState([]); const [creneaux, setCreneaux] = useState([]); const [affectations, setAffectations] = useState([]); const [suiviMensuel, setSuiviMensuel] = useState([]); const [paiements, setPaiements] = useState([]); const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settings, setSettings] = useState(loadSettings);
  const saveSettings = (ns) => { _s = ns; BREVO_SENDER = ns.nomExpediteurSMS || "BdS Hassan"; localStorage.setItem("bds_settings", JSON.stringify(ns)); setSettings(ns); };
  const loadData = useCallback(async () => { try { const [e,c,a,sm,p,pr] = await Promise.all([api.get("eleves"),api.get("creneaux"),api.get("affectations_creneaux"),api.get("suivi_mensuel"),api.get("paiements"),api.get("presences")]); setEleves(e||[]); setCreneaux(c||[]); setAffectations(a||[]); setSuiviMensuel(sm||[]); setPaiements(p||[]); setPresences(pr||[]); setError(null); } catch(err) { setError(err.message); } setLoading(false); }, []);
  useEffect(() => { loadData(); }, [loadData]);
  const nav = (p, params={}) => { setPage(p); setPageParams(params); };
  const renderPage = () => {
    if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, color: C.textMuted, fontSize: 16 }}>⏳ Chargement...</div>;
    if (error) return <div style={{ background: C.danger+"15", borderRadius: 16, padding: 30, textAlign: "center", border: `2px solid ${C.danger}44` }}><div style={{ color: C.danger, marginBottom: 12, fontWeight: 600 }}>{error}</div><Btn onClick={loadData}>Réessayer</Btn></div>;
    switch(page) {
      case "dashboard": return <DashboardPage eleves={eleves} creneaux={creneaux} affectations={affectations} suiviMensuel={suiviMensuel} paiements={paiements} presences={presences} onNavigate={nav} />;
      case "planning": return <PlanningPage creneaux={creneaux} affectations={affectations} eleves={eleves} presences={presences} suiviMensuel={suiviMensuel} refresh={loadData} initialDate={pageParams.date} />;
      case "eleves": return <ElevesPage eleves={eleves} creneaux={creneaux} affectations={affectations} suiviMensuel={suiviMensuel} paiements={paiements} presences={presences} refresh={loadData} initialAction={pageParams.action} initialOpenId={pageParams.openId} />;
      case "creneaux": return <CreneauxPage creneaux={creneaux} affectations={affectations} eleves={eleves} refresh={loadData} />;
      case "paiements": return <PaiementsPage eleves={eleves} paiements={paiements} refresh={loadData} />;
      case "disponibilites": return <DisponibilitesPage creneaux={creneaux} affectations={affectations} eleves={eleves} presences={presences} refresh={loadData} />;
      case "sms": return <SMSPage eleves={eleves} suiviMensuel={suiviMensuel} paiements={paiements} />;
      case "finance": return <FinancePage eleves={eleves} suiviMensuel={suiviMensuel} paiements={paiements} />;
      case "conges": return <CongesPage creneaux={creneaux} affectations={affectations} eleves={eleves} />;
      case "parametres": return <ParametresPage />;
      default: return null;
    }
  };
  return (
    <SettingsCtx.Provider value={{ settings, saveSettings }}>
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'Outfit','Segoe UI',system-ui,sans-serif", color: C.text, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <aside style={{ width: sidebarOpen?260:70, background: `linear-gradient(180deg, ${C.pink} 0%, ${C.sidebarHover} 100%)`, display: "flex", flexDirection: "column", transition: "width 0.3s", flexShrink: 0, overflow: "hidden", boxShadow: "2px 0 10px rgba(0,0,0,0.1)" }}>
        <div style={{ padding: sidebarOpen?"20px":"20px 10px", display: "flex", alignItems: "center", gap: 12, minHeight: 70 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎓</div>
          {sidebarOpen && <div><div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{settings.nomStructure}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: error?"#FF5722":"#4CAF50", marginRight: 6 }} />{error?"Hors ligne":"Connecté"}</div></div>}
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {PAGES.map(p => (<button key={p.key} onClick={() => { setPage(p.key); setPageParams({}); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: sidebarOpen?"12px 16px":"12px 0", borderRadius: 10, border: "none", cursor: "pointer", background: page===p.key?"rgba(255,255,255,0.25)":"transparent", color: "#fff", justifyContent: sidebarOpen?"flex-start":"center", width: "100%", transition: "all 0.15s" }}
            onMouseEnter={e => { if(page!==p.key) e.currentTarget.style.background="rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { if(page!==p.key) e.currentTarget.style.background="transparent"; }}>
            <span style={{ fontSize: 20 }}>{p.icon}</span>{sidebarOpen&&<span style={{ fontSize: 14, fontWeight: page===p.key?700:500 }}>{p.label}</span>}
          </button>))}
        </nav>
        <div style={{ padding: sidebarOpen?"14px 20px":"14px 10px", borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>HB</div>
          {sidebarOpen&&<div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Hassan</div>}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: 12, border: "none", borderTop: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 16 }}>{sidebarOpen?"◀":"▶"}</button>
      </aside>
      <main style={{ flex: 1, overflow: "auto", padding: 28 }}><div style={{ maxWidth: 1150, margin: "0 auto" }}>{renderPage()}</div></main>
    </div>
    </SettingsCtx.Provider>
  );
}
