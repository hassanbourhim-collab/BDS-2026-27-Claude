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
  patch: async (t, filter, d) => { const r = await fetch(`${SB_URL}/rest/v1/${t}?${filter}`, { method: "PATCH", headers: hdrs, body: JSON.stringify(d) }); if (!r.ok) { const txt = await r.text(); console.error("[BDS] PATCH", t, r.status, txt); return null; } return r.json(); },
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

// ═══ HELPER PARTAGÉ : nombre d'inscrits dans un créneau ═══
// Sans dateStr → abonnés actifs seulement (occasionnels ignorés, pas de date de référence)
// Avec dateStr → abonnés actifs + occasionnels dont cette date est dans dates_occasion
const countInscrits = (affectations, creneauId, dateStr = null) =>
  affectations.filter(a => {
    if (a.creneau_id !== creneauId || !a.actif) return false;
    if (a.type_inscription === "occasionnel") {
      if (!dateStr) return false;
      const dates = a.dates_occasion ? a.dates_occasion.split(",").map(d => d.trim()) : [];
      return dates.includes(dateStr);
    }
    return true;
  }).length;

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

// ═══ SLOT DETAIL MODAL (vue rapide — Tableau de bord) ═══
const SlotDetailModal = ({ open, onClose, slot, eleves, affectations }) => {
  if (!open || !slot) return null;
  const today = todayStr();
  const students = affectations
    .filter(a => {
      if (a.creneau_id !== slot.id || !a.actif) return false;
      if (a.type_inscription === "occasionnel") {
        const dates = a.dates_occasion ? a.dates_occasion.split(",").map(d => d.trim()) : [];
        return dates.includes(today);
      }
      return true;
    })
    .map(a => eleves.find(e => e.id === a.eleve_id))
    .filter(Boolean)
    .sort((a, b) => a.nom.localeCompare(b.nom));
  const label = `${slot.jour || "Stage"} ${(slot.heure_debut || "").substring(0, 5)}–${(slot.heure_fin || "").substring(0, 5)}`;
  return (
    <Modal open={open} onClose={onClose} title={`📋 ${label}`}>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, fontWeight: 700 }}>
        {students.length}/{slot.capacite || "?"} inscrits · {FORFAITS[slot.mode]?.l || slot.mode}
      </div>
      {students.length === 0
        ? <div style={{ color: C.textDim, padding: "20px 0", textAlign: "center" }}>Aucun élève inscrit</div>
        : students.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: C.surfaceLight, marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.prenom} {s.nom}</span>
            <Badge color={C.purple}>{s.classe}</Badge>
          </div>
        ))}
    </Modal>
  );
};

// ═══ DASHBOARD ═══
const DashboardPage = ({ eleves, creneaux, affectations, suiviMensuel, paiements, presences, onNavigate, refresh }) => {
  const [classeOpen, setClasseOpen] = useState(false);
  const [retardsOpen, setRetardsOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payEleve, setPayEleve] = useState("");
  const [slotDetail, setSlotDetail] = useState(null);
  // ─── séance du jour ───
  const [selectedCreneauId, setSelectedCreneauId] = useState(null);
  const [localPresencesToday, setLocalPresencesToday] = useState([]);
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const actifs = eleves.filter(e => e.actif).length;
  const smart = getSmartDay();
  const dayName = JOURS_SEMAINE[new Date(smart.date + "T12:00:00").getDay()];

  const classeData = useMemo(() => { const c = {}; eleves.filter(e => e.actif).forEach(e => { if (e.classe) c[e.classe] = (c[e.classe]||0)+1; }); return CLASSES.map(cl => ({ name: cl, value: c[cl]||0 })).filter(d => d.value > 0); }, [eleves]);

  const creneauxOccupation = useMemo(() => creneaux.filter(cr => (cr.type_creneau||"regulier")==="regulier").map(cr => {
    const n = countInscrits(affectations, cr.id);
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

  // ─── logique prochaine séance (au-delà d'aujourd'hui si nécessaire) ───
  const slotDur = (slot) => slot ? Math.max(0.5, (new Date(`2000-01-01T${slot.heure_fin||"00:00"}`) - new Date(`2000-01-01T${slot.heure_debut||"00:00"}`)) / 3600000) : 1;
  const dateToday = todayStr();
  const nowHHMM = new Date().toTimeString().substring(0, 5);

  // Cherche la prochaine séance sur les 14 prochains jours
  const findNextSession = useMemo(() => {
    for (let i = 0; i < 14; i++) {
      const d = new Date(dateToday + "T12:00:00");
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dow = d.getDay();
      const dn = JOURS_SEMAINE[dow];
      const ctx = getDateContext(dateStr);
      if (ctx.type === "samedi_milieu" || dow === 0) continue;
      let slots = ctx.type === "vacances"
        ? creneaux.filter(cr => cr.type_creneau === "stage" && cr.periode_vacances === ctx.vacance?.id && cr.semaine_vacances === ctx.semaine)
        : creneaux.filter(cr => (cr.type_creneau||"regulier") === "regulier" && cr.jour === dn);
      slots = slots.sort((a,b) => (a.heure_debut||"").localeCompare(b.heure_debut||""));
      if (slots.length === 0) continue;
      if (i === 0) {
        // Aujourd'hui : en cours en priorité, sinon prochain
        const inProgress = slots.find(cr => (cr.heure_debut||"") <= nowHHMM && nowHHMM <= (cr.heure_fin||""));
        if (inProgress) return { slots, date: dateStr, autoId: inProgress.id };
        const upcoming = slots.filter(cr => (cr.heure_debut||"") > nowHHMM);
        if (upcoming.length > 0) return { slots, date: dateStr, autoId: upcoming[0].id };
      } else {
        // Jour futur : premier créneau du jour
        return { slots, date: dateStr, autoId: slots[0].id };
      }
    }
    return { slots: [], date: dateToday, autoId: null };
  }, [creneaux, dateToday, nowHHMM]);

  const sessionSlots = findNextSession.slots;
  const sessionDate  = findNextSession.date;
  const effectiveCreneauId = selectedCreneauId || findNextSession.autoId;
  const selectedCreneau = sessionSlots.find(cr => String(cr.id) === String(effectiveCreneauId)) || null;
  const isEnCours = !!(selectedCreneau && sessionDate === dateToday
    && (selectedCreneau.heure_debut||"") <= nowHHMM && nowHHMM <= (selectedCreneau.heure_fin||""));

  const retardIds = useMemo(() => new Set(retards.map(r => String(r.id))), [retards]);

  const slotStudents = useMemo(() => {
    if (!selectedCreneau) return [];
    return affectations.filter(a => {
      if (a.creneau_id !== selectedCreneau.id || !a.actif) return false;
      if (a.type_inscription === "occasionnel") {
        const dates = a.dates_occasion ? a.dates_occasion.split(",").map(d => d.trim()) : [];
        return dates.includes(sessionDate);
      }
      return true;
    }).map(a => {
      const el = eleves.find(e => e.id === a.eleve_id);
      if (!el) return null;
      const pres = localPresencesToday.find(p => p.eleve_id === a.eleve_id && p.creneau_id === selectedCreneau.id && p.date_cours === sessionDate);
      return { ...el, type_inscription: a.type_inscription, affectation_id: a.id, presence: pres || null };
    }).filter(Boolean).sort((a,b) => a.nom.localeCompare(b.nom));
  }, [selectedCreneau, affectations, eleves, localPresencesToday, sessionDate]);

  const slotEffCount = slotStudents.filter(s => s.presence?.statut !== "absent_justifie" && s.presence?.statut !== "absent_non_justifie").length;

  const reloadPresencesToday = useCallback(async () => {
    const d = await api.get("presences", `date_cours=eq.${sessionDate}`);
    setLocalPresencesToday(d || []);
  }, [sessionDate]);

  useEffect(() => { reloadPresencesToday(); }, [reloadPresencesToday]);

  const setPresenceStatut = async (st, statut) => {
    if (!selectedCreneau) return;
    const heures = statut === "present" ? slotDur(selectedCreneau) : 0;
    if (st.presence) {
      await api.patch("presences", `id=eq.${st.presence.id}`, { statut, heures });
    } else {
      await api.post("presences", { eleve_id: st.id, creneau_id: selectedCreneau.id, date_cours: sessionDate, statut, heures });
    }
    await reloadPresencesToday();
  };

  const saveNote = async () => {
    if (!noteModal) return;
    setNoteSaving(true);
    await api.patch("eleves", `id=eq.${noteModal.id}`, { note_ped: noteText });
    setNoteSaving(false);
    setNoteModal(null);
    if (refresh) refresh();
  };

  const nextCourseSlots = useMemo(() => {
    const ctx = smart.ctx;
    const rel = ctx.type === "vacances"
      ? creneaux.filter(cr => cr.type_creneau === "stage" && cr.periode_vacances === ctx.vacance?.id && cr.semaine_vacances === ctx.semaine)
      : creneaux.filter(cr => (cr.type_creneau||"regulier") === "regulier" && cr.jour === dayName);
    return rel.map(cr => { const sts = affectations.filter(a => { if (a.creneau_id !== cr.id || !a.actif) return false; if (a.type_inscription === "occasionnel") { const dates = a.dates_occasion ? a.dates_occasion.split(",").map(d => d.trim()) : []; return dates.includes(smart.date); } return true; }).map(a => eleves.find(e => e.id === a.eleve_id)).filter(Boolean); return { ...cr, students: sts }; });
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

      {/* ── SÉANCE DU JOUR ── */}
      <div style={{ background: C.surface, border: `2px solid ${isEnCours ? C.success : C.accent}44`, borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{isEnCours ? "🟢" : "📋"}</span>
            <span style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{isEnCours ? "Séance en cours" : "Prochaine séance"}</span>
            {selectedCreneau && <Badge color={isEnCours ? C.success : C.accent}>{new Date(sessionDate + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {(selectedCreneau.heure_debut||"").substring(0,5)}–{(selectedCreneau.heure_fin||"").substring(0,5)}</Badge>}
            {selectedCreneau && <Badge color={C.textMuted}>{FORFAITS[selectedCreneau.mode]?.l || selectedCreneau.mode}</Badge>}
            {selectedCreneau && <Badge color={C.blue}>{slotEffCount}/{selectedCreneau.capacite||"?"}</Badge>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {sessionSlots.length > 1 && (
              <select value={effectiveCreneauId||""} onChange={e => setSelectedCreneauId(e.target.value || null)}
                style={{ padding: "6px 12px", background: C.surface, border: `2px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontWeight: 600 }}>
                {sessionSlots.map(cr => <option key={cr.id} value={cr.id}>{(cr.heure_debut||"").substring(0,5)}–{(cr.heure_fin||"").substring(0,5)} · {FORFAITS[cr.mode]?.l||cr.mode}</option>)}
              </select>
            )}
            <span style={{ color: C.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }} onClick={() => onNavigate("planning", { date: sessionDate, slotId: effectiveCreneauId })}>Planning →</span>
          </div>
        </div>

        {/* Contenu */}
        {sessionSlots.length === 0 ? (
          <div style={{ textAlign: "center", color: C.textDim, padding: "20px 0", fontSize: 14 }}>Aucune séance à venir</div>
        ) : !selectedCreneau ? null : slotStudents.length === 0 ? (
          <div style={{ textAlign: "center", color: C.textDim, padding: "16px 0", fontSize: 13 }}>Aucun élève inscrit pour cette séance</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {slotStudents.map(st => {
              const isAJ = st.presence?.statut === "absent_justifie";
              const isPresent = st.presence?.statut === "present";
              const isANJ = st.presence?.statut === "absent_non_justifie";
              const hasRetard = retardIds.has(String(st.id));
              const hasNote = !!st.note_ped;
              return (
                <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: isAJ ? C.warning+"10" : C.surfaceLight, border: `1px solid ${isAJ ? C.warning+"55" : C.border}`, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{st.prenom} {st.nom}</span>
                    <Badge color={st.type_inscription === "occasionnel" ? C.warning : C.blue}>{st.type_inscription === "occasionnel" ? "⚡ Occ." : "🔄 Abo."}</Badge>
                    {hasRetard && <Badge color={C.danger}>💰 Retard</Badge>}
                    {hasNote && <Badge color={C.purple} title={st.note_ped}>🧠</Badge>}
                    {isAJ && <Badge color={C.warning}>❌ Abs. prévu</Badge>}
                    {!st.presence && <Badge color={C.textDim}>⬜ Non marqué</Badge>}
                    {isPresent && <Badge color={C.success}>✓ Présent</Badge>}
                    {isANJ && <Badge color={C.danger}>✗ Absent</Badge>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => setPresenceStatut(st, "present")} style={{ padding: "5px 10px", borderRadius: 6, border: `2px solid ${isPresent ? C.success : C.border}`, background: isPresent ? C.success+"20" : "transparent", color: isPresent ? C.success : C.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✓</button>
                    <button onClick={() => setPresenceStatut(st, "absent_non_justifie")} style={{ padding: "5px 10px", borderRadius: 6, border: `2px solid ${isANJ ? C.danger : C.border}`, background: isANJ ? C.danger+"20" : "transparent", color: isANJ ? C.danger : C.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✗</button>
                    <button onClick={() => setPresenceStatut(st, "absent_justifie")} style={{ padding: "5px 10px", borderRadius: 6, border: `2px solid ${isAJ ? C.warning : C.border}`, background: isAJ ? C.warning+"20" : "transparent", color: isAJ ? C.warning : C.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>📅</button>
                    <button onClick={() => { setNoteModal(st); setNoteText(st.note_ped || ""); }} style={{ padding: "5px 10px", borderRadius: 6, border: `2px solid ${C.border}`, background: "transparent", color: hasNote ? C.purple : C.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>🧠</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title={`🧠 Note — ${noteModal?.prenom||""} ${noteModal?.nom||""}`}>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} placeholder="Remarque pédagogique..."
          style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `2px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <Btn outline color={C.textMuted} onClick={() => setNoteModal(null)}>Annuler</Btn>
          <Btn color={C.purple} onClick={saveNote} disabled={noteSaving}>{noteSaving ? "..." : "✓ Enregistrer"}</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ═══ PLANNING / APPEL ═══
const PlanningPage = ({ creneaux, affectations, eleves, presences: initialPresences, refresh, initialDate, initialSlotId }) => {
  const [weekStart, setWeekStart] = useState(() => getWeekDates(initialDate || getSmartDay().date)[0]);
  const [selectedSlot, setSelectedSlot] = useState(null); // { slot, dateStr }
  const [localPresences, setLocalPresences] = useState(initialPresences || []);
  const [addEleve, setAddEleve] = useState("");
  const [addType, setAddType] = useState("abonne");
  const [saving, setSaving] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const weekNum = getWeekNumber(weekStart);

  const loadWeekPresences = useCallback(async () => {
    const d = await api.get("presences", `date_cours=gte.${weekDates[0]}&date_cours=lte.${weekDates[weekDates.length - 1]}`);
    setLocalPresences(d || []);
  }, [weekDates]);

  useEffect(() => { loadWeekPresences(); }, [loadWeekPresences]);

  // Sélection automatique du créneau si transmis depuis le tableau de bord
  useEffect(() => {
    if (initialSlotId && initialDate) {
      const slots = getCreneauxForDate(initialDate);
      const slot = slots.find(s => s.id === initialSlotId || String(s.id) === String(initialSlotId));
      if (slot) setSelectedSlot({ slot, dateStr: initialDate });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = (dir) => {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().split("T")[0]);
    setSelectedSlot(null);
  };

  const getCreneauxForDate = useCallback((dateStr) => {
    const ctx = getDateContext(dateStr);
    const dow = new Date(dateStr + "T12:00:00").getDay();
    const dayName = JOURS_SEMAINE[dow];
    let slots;
    if (ctx.type === "vacances") {
      slots = creneaux.filter(cr =>
        cr.type_creneau === "stage" &&
        cr.periode_vacances === ctx.vacance?.id &&
        (cr.semaine_vacances === ctx.semaine || cr.semaine_vacances === null)
      );
    } else {
      slots = creneaux.filter(cr =>
        (cr.type_creneau || "regulier") === "regulier" && cr.jour === dayName
      );
    }
    return slots.map(cr => {
      const aff = affectations.filter(a => a.creneau_id === cr.id && a.actif);
      const students = aff.map(a => {
        if (a.type_inscription === "occasionnel") {
          if (!a.dates_occasion || !a.dates_occasion.split(",").map(d => d.trim()).includes(dateStr)) return null;
        }
        const el = eleves.find(e => e.id === a.eleve_id);
        if (!el) return null;
        const pres = localPresences.find(p => p.eleve_id === a.eleve_id && p.creneau_id === cr.id && p.date_cours === dateStr);
        return { ...el, type_inscription: a.type_inscription, affectation_id: a.id, dates_occasion: a.dates_occasion, presence: pres || null };
      }).filter(Boolean);
      const effCount = students.filter(s => s.presence?.statut !== "absent_justifie" && s.presence?.statut !== "absent_non_justifie").length;
      const pct = cr.capacite ? effCount / cr.capacite : 0;
      return { ...cr, students, effCount, pct };
    }).sort((a, b) => (a.heure_debut || "").localeCompare(b.heure_debut || ""));
  }, [creneaux, affectations, eleves, localPresences]);

  const reloadDate = async (dateStr) => {
    const d = await api.get("presences", `date_cours=eq.${dateStr}`);
    setLocalPresences(prev => [...prev.filter(p => p.date_cours !== dateStr), ...(d || [])]);
  };

  const currentData = useMemo(() => {
    if (!selectedSlot) return null;
    const slots = getCreneauxForDate(selectedSlot.dateStr);
    return slots.find(s => s.id === selectedSlot.slot.id) || null;
  }, [selectedSlot, getCreneauxForDate]);

  const availableEleves = useMemo(() => {
    if (!selectedSlot) return [];
    const assignedIds = affectations.filter(a => a.creneau_id === selectedSlot.slot.id && a.actif).map(a => a.eleve_id);
    return eleves.filter(e => e.actif && !assignedIds.includes(e.id));
  }, [selectedSlot, affectations, eleves]);

  const inscribe = async () => {
    if (!addEleve || !selectedSlot || saving) return;
    setSaving(true);
    const { slot, dateStr } = selectedSlot;
    const eleveId = addEleve; // pas de Number() — l'ID est déjà au bon type depuis Supabase
    console.log("[inscribe] addEleve:", addEleve, "→ eleveId:", eleveId, "type:", typeof eleveId);
    console.log("[inscribe] creneau_id:", slot.id, "addType:", addType, "dateStr:", dateStr);
    try {
      const reactivated = await api.patch("affectations_creneaux",
        `eleve_id=eq.${eleveId}&creneau_id=eq.${slot.id}&actif=eq.false`,
        { actif: true, type_inscription: addType });
      console.log("[inscribe] patch réactivation:", reactivated);
      if (!reactivated || reactivated.length === 0) {
        const created = await api.post("affectations_creneaux", { eleve_id: eleveId, creneau_id: slot.id, type_inscription: addType, actif: true });
        console.log("[inscribe] post création:", created);
        if (!created) { console.error("[inscribe] échec création — inscription annulée"); return; }
      }
      if (addType === "occasionnel") {
        const patched = await api.patch("affectations_creneaux",
          `eleve_id=eq.${eleveId}&creneau_id=eq.${slot.id}&actif=eq.true`,
          { dates_occasion: dateStr });
        console.log("[inscribe] patch dates_occasion:", patched);
      }
      setAddEleve("");
      setAddType("abonne");
      console.log("[inscribe] refresh...");
      await refresh();
      console.log("[inscribe] ✓ terminé");
    } finally {
      setSaving(false);
    }
  };

  const togglePresence = async (st, dateStr) => {
    if (st.presence) {
      const newStatut = st.presence.statut === "present" ? "absent_non_justifie" : "present";
      await api.patch("presences", `id=eq.${st.presence.id}`, { statut: newStatut, heures: newStatut === "present" ? slotDur(currentData) : 0 });
    } else {
      await api.post("presences", { eleve_id: st.id, creneau_id: selectedSlot.slot.id, date_cours: dateStr, statut: "present", heures: slotDur(currentData) });
    }
    await reloadDate(dateStr);
  };

  const markAbsentJustifie = async (st, dateStr) => {
    if (st.presence) {
      await api.patch("presences", `id=eq.${st.presence.id}`, { statut: "absent_justifie", heures: 0 });
    } else {
      await api.post("presences", { eleve_id: st.id, creneau_id: selectedSlot.slot.id, date_cours: dateStr, statut: "absent_justifie", heures: 0 });
    }
    await reloadDate(dateStr);
  };

  const markAllPresent = async (dateStr) => {
    if (!currentData) return;
    for (const st of currentData.students) {
      if (!st.presence) {
        await api.post("presences", { eleve_id: st.id, creneau_id: selectedSlot.slot.id, date_cours: dateStr, statut: "present", heures: slotDur(currentData) });
      }
    }
    await reloadDate(dateStr);
  };

  const retirer = async (st, dateStr) => {
    if (!window.confirm(`Retirer ${st.prenom} ${st.nom} de ce créneau ?`)) return;
    if (st.type_inscription === "occasionnel" && st.dates_occasion) {
      const newDates = st.dates_occasion.split(",").map(d => d.trim()).filter(d => d !== dateStr);
      if (newDates.length > 0) {
        await api.patch("affectations_creneaux", `id=eq.${st.affectation_id}`, { dates_occasion: newDates.join(",") });
      } else {
        await api.patch("affectations_creneaux", `id=eq.${st.affectation_id}`, { actif: false });
      }
    } else {
      await api.patch("affectations_creneaux", `id=eq.${st.affectation_id}`, { actif: false });
    }
    await refresh();
  };

  const today = todayStr();

  return (
    <div>
      {/* Header nav semaine */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Planning / Appel</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Btn onClick={() => navigate(-1)} color={C.accent} outline>← Sem. préc.</Btn>
          <div style={{ textAlign: "center", minWidth: 150 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>S{weekNum}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{fmtDateFr(weekDates[0])} – {fmtDateFr(weekDates[weekDates.length - 1])}</div>
          </div>
          <Btn onClick={() => navigate(1)} color={C.accent} outline>Sem. suiv. →</Btn>
          <Btn onClick={() => { setWeekStart(getWeekDates(today)[0]); setSelectedSlot(null); }} color={C.pink} small>Aujourd'hui</Btn>
        </div>
      </div>

      {/* Grille semaine */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
        {weekDates.map(dateStr => {
          const dow = new Date(dateStr + "T12:00:00").getDay();
          const isToday = dateStr === today;
          const slots = getCreneauxForDate(dateStr);
          const ctx = getDateContext(dateStr);
          return (
            <div key={dateStr}>
              <div style={{ background: isToday ? C.accent : C.surfaceLight, color: isToday ? "#fff" : C.text, borderRadius: 10, padding: "8px 10px", marginBottom: 8, textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>{JOURS_SEMAINE[dow].substring(0, 3)}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDateFr(dateStr)}</div>
                {ctx.type === "vacances" && <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>🏕️ Vacances</div>}
              </div>
              {slots.length === 0
                ? <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: "8px 0" }}>—</div>
                : slots.map(slot => {
                    const col = slot.pct >= 1 ? C.danger : slot.pct >= 0.7 ? C.warning : C.success;
                    const isSelected = selectedSlot?.slot.id === slot.id && selectedSlot?.dateStr === dateStr;
                    return (
                      <div key={slot.id}
                        onClick={() => { setSelectedSlot({ slot, dateStr }); setAddEleve(""); setAddType("abonne"); }}
                        style={{ background: isSelected ? col + "22" : C.surface, border: `2px solid ${col}${isSelected ? "" : "77"}`, borderRadius: 8, padding: "8px 10px", marginBottom: 6, cursor: "pointer", transition: "all 0.15s" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{(slot.heure_debut || "").substring(0, 5)}–{(slot.heure_fin || "").substring(0, 5)}</div>
                        <div style={{ fontSize: 11, color: col, fontWeight: 600, marginTop: 2 }}>{slot.effCount}/{slot.capacite || "?"}</div>
                        {slot.students.some(s => s.presence?.statut === "present" || s.presence?.statut === "absent_non_justifie") && <div style={{ fontSize: 10, color: C.success, marginTop: 1 }}>✓ appel</div>}
                      </div>
                    );
                  })}
            </div>
          );
        })}
      </div>

      {/* Panel détail créneau */}
      {selectedSlot && currentData && (() => {
        const { dateStr } = selectedSlot;
        const slot = currentData;
        const isFull = slot.capacite != null && slot.effCount >= slot.capacite;
        return (
          <div style={{ background: C.surface, border: `2px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>
                  {slot.jour || "Stage"} · {(slot.heure_debut || "").substring(0, 5)}–{(slot.heure_fin || "").substring(0, 5)}
                </h2>
                <div style={{ fontSize: 13, color: C.textMuted }}>
                  {new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  {" · "}{slot.effCount}/{slot.capacite || "?"} place(s) · <span style={{ color: FORFAITS[slot.mode]?.c || C.blue }}>{FORFAITS[slot.mode]?.l || slot.mode}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {slot.students.length > 0 && <Btn small color={C.success} outline onClick={() => markAllPresent(dateStr)}>✓ Tout présent</Btn>}
                <Btn small outline color={C.textMuted} onClick={() => setSelectedSlot(null)}>✕ Fermer</Btn>
              </div>
            </div>

            {/* Liste élèves */}
            <div style={{ marginBottom: 20 }}>
              {slot.students.length === 0
                ? <div style={{ color: C.textDim, textAlign: "center", padding: "20px 0", background: C.surfaceLight, borderRadius: 10 }}>Aucun élève inscrit pour cette séance</div>
                : slot.students.map(st => {
                    const isAJ = st.presence?.statut === "absent_justifie";
                    const isPresent = st.presence?.statut === "present";
                    const isANJ = st.presence?.statut === "absent_non_justifie";
                    const presColor = isPresent ? C.success : isANJ ? C.danger : C.textDim;
                    const presLabel = isPresent ? "✓ Présent" : isANJ ? "✗ Absent" : "⬜ Appel ?";
                    return (
                      <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, marginBottom: 6, background: isAJ ? C.warning + "10" : C.surfaceLight, border: `1px solid ${isAJ ? C.warning + "55" : C.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{st.prenom} {st.nom}</span>
                          <Badge color={C.purple}>{st.classe}</Badge>
                          {st.type_inscription === "occasionnel" && <Badge color={C.warning}>⚡ Occ.</Badge>}
                          {isAJ && <Badge color={C.warning}>📅 Absent ce jour</Badge>}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {isAJ
                            ? <Btn small outline color={C.accent} onClick={() => togglePresence(st, dateStr)}>↩ Présent</Btn>
                            : (<>
                                <button onClick={() => togglePresence(st, dateStr)} style={{ padding: "4px 10px", borderRadius: 6, border: `2px solid ${presColor}`, background: presColor + "15", color: presColor, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{presLabel}</button>
                                <Btn small outline color={C.warning} title="Absent ce jour — libère la place" onClick={() => markAbsentJustifie(st, dateStr)}>📅</Btn>
                              </>)}
                          <Btn small outline color={C.danger} title="Retirer définitivement" onClick={() => retirer(st, dateStr)}>🚪</Btn>
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* Section inscription */}
            <div style={{ borderTop: `2px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Inscrire un élève</div>
              {isFull
                ? <div style={{ background: C.danger + "15", border: `2px solid ${C.danger}44`, borderRadius: 10, padding: "14px 18px", textAlign: "center", fontWeight: 700, color: C.danger }}>🚫 Créneau complet — {slot.effCount}/{slot.capacite} places occupées</div>
                : availableEleves.length === 0
                  ? <div style={{ color: C.textDim, textAlign: "center", fontSize: 13, padding: "8px 0" }}>Tous les élèves actifs sont déjà inscrits dans ce créneau.</div>
                  : (<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
                      <Input label="Élève" value={addEleve} onChange={setAddEleve}
                        options={[["", "— Choisir —"], ...availableEleves.sort((a, b) => a.nom.localeCompare(b.nom)).map(e => [e.id, `${e.prenom} ${e.nom} (${e.classe})`])]} />
                      <Input label="Type" value={addType} onChange={setAddType}
                        options={[["abonne", "🔄 Abonné (toutes les semaines)"], ["occasionnel", "⚡ Occasionnel (ce jour seulement)"]]} />
                      <div style={{ marginBottom: 14 }}>
                        <Btn onClick={inscribe} disabled={!addEleve || saving} color={C.success}>
                          {saving ? "⏳ ..." : "+ Inscrire"}
                        </Btn>
                      </div>
                    </div>)}
            </div>
          </div>
        );
      })()}
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
const CreneauxPage = ({ creneaux, affectations, refresh }) => {
  const [modal, setModal] = useState(false);
  const [editCr, setEditCr] = useState(null);
  const [form, setForm] = useState({ type: "groupe", jour: "Lundi", heure_debut: "16:00", heure_fin: "17:00", capacite: 6, tarif: 15, periode_vacances: "toussaint", semaine_vacances: 1 });
  const [saving, setSaving] = useState(false);
  const [conflictMsg, setConflictMsg] = useState("");

  const openNew = () => {
    setEditCr(null);
    setForm({ type: "groupe", jour: "Lundi", heure_debut: "16:00", heure_fin: "17:00", capacite: 6, tarif: 15, periode_vacances: "toussaint", semaine_vacances: 1 });
    setConflictMsg("");
    setModal(true);
  };

  const openEdit = (cr) => {
    setEditCr(cr);
    setForm({
      type: cr.type_creneau === "stage" ? "stage" : (cr.mode || "groupe"),
      jour: cr.jour || "Lundi",
      heure_debut: (cr.heure_debut || "16:00").substring(0, 5),
      heure_fin: (cr.heure_fin || "17:00").substring(0, 5),
      capacite: cr.capacite || 6,
      tarif: cr.tarif || 15,
      periode_vacances: cr.periode_vacances || "toussaint",
      semaine_vacances: cr.semaine_vacances || 1,
    });
    setConflictMsg("");
    setModal(true);
  };

  const toMin = t => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };

  const save = async () => {
    setConflictMsg("");
    const s = toMin(form.heure_debut);
    const e = toMin(form.heure_fin);
    if (e <= s) { setConflictMsg("L'heure de fin doit être après l'heure de début."); return; }
    const isStage = form.type === "stage";
    const others = creneaux.filter(cr => {
      if (editCr && cr.id === editCr.id) return false;
      if (isStage) return cr.type_creneau === "stage" && cr.periode_vacances === form.periode_vacances && Number(cr.semaine_vacances || 1) === Number(form.semaine_vacances);
      return (cr.type_creneau || "regulier") === "regulier" && cr.jour === form.jour;
    });
    const clash = others.find(cr => toMin(cr.heure_debut) < e && s < toMin(cr.heure_fin));
    if (clash) { setConflictMsg(`⚠️ Conflit avec ${(clash.heure_debut || "").substring(0, 5)}–${(clash.heure_fin || "").substring(0, 5)}`); return; }
    setSaving(true);
    const data = {
      type_creneau: isStage ? "stage" : "regulier",
      mode: isStage ? "stage" : form.type,
      jour: isStage ? "Lundi" : form.jour,
      heure_debut: form.heure_debut,
      heure_fin: form.heure_fin,
      capacite: Number(form.capacite),
      tarif: form.tarif ? Number(form.tarif) : null,
      periode_vacances: isStage ? form.periode_vacances : null,
      semaine_vacances: isStage ? Number(form.semaine_vacances) : null,
    };
    if (editCr) await api.patch("creneaux", `id=eq.${editCr.id}`, data);
    else await api.post("creneaux", data);
    setSaving(false);
    setModal(false);
    refresh();
  };

  const deleteCreneau = async (cr) => {
    const n = countInscrits(affectations, cr.id);
    if (n > 0 && !window.confirm(`Ce créneau a ${n} élève(s) inscrit(s). Supprimer quand même ?`)) return;
    await api.del("creneaux", `id=eq.${cr.id}`);
    refresh();
  };

  const regulier = creneaux
    .filter(cr => (cr.type_creneau || "regulier") === "regulier")
    .sort((a, b) => JOURS_ALL.indexOf(a.jour) - JOURS_ALL.indexOf(b.jour) || (a.heure_debut || "").localeCompare(b.heure_debut || ""));
  const stages = creneaux
    .filter(cr => cr.type_creneau === "stage")
    .sort((a, b) => (a.periode_vacances || "").localeCompare(b.periode_vacances || "") || (a.heure_debut || "").localeCompare(b.heure_debut || ""));

  const isStageForm = form.type === "stage";

  const SlotCard = ({ cr }) => {
    const n = countInscrits(affectations, cr.id);
    const pct = cr.capacite ? n / cr.capacite : 0;
    const col = pct >= 1 ? C.danger : pct >= 0.7 ? C.warning : C.success;
    return (
      <div style={{ background: C.surfaceLight, borderRadius: 12, padding: 16, border: `2px solid ${col}33` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            {cr.type_creneau === "stage"
              ? <div style={{ fontWeight: 700, fontSize: 14, color: C.orange }}>{ALL_VACANCES.find(v => v.id === cr.periode_vacances)?.label || cr.periode_vacances} — S{cr.semaine_vacances}</div>
              : <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{cr.jour}</div>}
            <div style={{ fontSize: 13, color: C.textMuted }}>{(cr.heure_debut || "").substring(0, 5)} – {(cr.heure_fin || "").substring(0, 5)}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn small outline color={C.accent} onClick={() => openEdit(cr)}>✏️</Btn>
            <Btn small outline color={C.danger} onClick={() => deleteCreneau(cr)}>🗑️</Btn>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge color={FORFAITS[cr.mode]?.c || C.blue}>{FORFAITS[cr.mode]?.l || cr.mode}</Badge>
          <Badge color={col}>{n}/{cr.capacite || "?"} places</Badge>
          {cr.tarif && <Badge color={C.gold}>{cr.tarif}€/h</Badge>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Créneaux</h1>
        <Btn onClick={openNew} color={C.accent}>+ Nouveau créneau</Btn>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>📅 Créneaux réguliers ({regulier.length})</h2>
        {regulier.length === 0
          ? <div style={{ color: C.textDim, textAlign: "center", padding: 24 }}>Aucun créneau régulier — cliquez "+ Nouveau créneau"</div>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
              {regulier.map(cr => <SlotCard key={cr.id} cr={cr} />)}
            </div>}
      </div>

      {stages.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>🏕️ Stages vacances ({stages.length})</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {stages.map(cr => <SlotCard key={cr.id} cr={cr} />)}
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editCr ? "✏️ Modifier le créneau" : "➕ Nouveau créneau"}>
        <Input label="Type de créneau" value={form.type} onChange={v => setForm({ ...form, type: v })}
          options={[["groupe", "🏫 Groupe (régulier)"], ["individuel", "👤 Individuel (régulier)"], ["stage", "🏕️ Stage vacances"]]} />
        {!isStageForm && (
          <Input label="Jour de la semaine" value={form.jour} onChange={v => setForm({ ...form, jour: v })} options={JOURS_ALL.map(j => [j, j])} />
        )}
        {isStageForm && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Période de vacances" value={form.periode_vacances || "toussaint"} onChange={v => setForm({ ...form, periode_vacances: v })} options={PERIODES} />
            <Input label="Semaine" value={form.semaine_vacances} onChange={v => setForm({ ...form, semaine_vacances: v })} options={[["1", "Semaine 1"], ["2", "Semaine 2"]]} />
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Heure de début" value={form.heure_debut} onChange={v => setForm({ ...form, heure_debut: v })} type="time" />
          <Input label="Heure de fin" value={form.heure_fin} onChange={v => setForm({ ...form, heure_fin: v })} type="time" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Capacité (nb places)" value={form.capacite} onChange={v => setForm({ ...form, capacite: v })} type="number" />
          <Input label="Tarif (€/h)" value={form.tarif} onChange={v => setForm({ ...form, tarif: v })} type="number" />
        </div>
        {isStageForm && (
          <div style={{ background: C.orange + "15", borderRadius: 8, padding: 10, fontSize: 12, color: C.orange, marginBottom: 4 }}>
            🏕️ Affiché du lun. au ven. — semaine {form.semaine_vacances} des {ALL_VACANCES.find(v => v.id === form.periode_vacances)?.label || "vacances"}.
          </div>
        )}
        {conflictMsg && (
          <div style={{ background: C.danger + "15", border: `2px solid ${C.danger}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.danger, marginBottom: 4 }}>{conflictMsg}</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Btn outline color={C.textMuted} onClick={() => setModal(false)}>Annuler</Btn>
          <Btn onClick={save} disabled={saving} color={isStageForm ? C.orange : C.accent}>
            {saving ? "..." : editCr ? "Modifier" : "Créer"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
};
// ═══ DISPONIBILITÉS ═══
const DisponibilitesPage = ({ creneaux, affectations, eleves, presences, refresh }) => {
  const [selectedDate, setSelectedDate] = useState(getSmartDay().date);
  const [viewMode, setViewMode] = useState("semaine"); // "jour" | "semaine"
  const [filterMode, setFilterMode] = useState("tous"); // "tous" | "regulier" | "occasionnel"

  // Calcul des disponibilités pour un créneau à une date donnée
  // placesLibres       = capacité - abonnés          (pour inscription régulière)
  // placesOccasionnelles = capacité - abonnés - occasionnels de ce jour (pour cours ponctuel)
  const getDispoSlot = useCallback((cr, dateStr) => {
    const dow = new Date(dateStr + "T12:00:00").getDay();
    const dayName = JOURS_SEMAINE[dow];
    const aff = affectations.filter(a => a.creneau_id === cr.id && a.actif
      && !(a.date_debut && a.date_debut > dateStr)
      && !(a.date_fin && a.date_fin < dateStr));
    const abonnes = aff.filter(a => a.type_inscription === "abonne");
    const nbAbonnes = cr.type_creneau === "stage"
      ? abonnes.filter(a => !a.jours_stage || a.jours_stage.includes(dayName)).length
      : abonnes.length;
    const nbOccasionnelsCeJour = aff.filter(a => {
      if (a.type_inscription !== "occasionnel") return false;
      const dates = a.dates_occasion ? a.dates_occasion.split(",").map(d => d.trim()) : [];
      return dates.includes(dateStr);
    }).length;
    const inscrits = nbAbonnes + nbOccasionnelsCeJour;
    const placesLibres = Math.max(0, cr.capacite - nbAbonnes);
    const placesOccasionnelles = Math.max(0, cr.capacite - inscrits);
    const total = placesLibres;
    return { inscrits, nbAbonnes, nbOccasionnelsCeJour, placesLibres, placesOccasionnelles, total };
  }, [affectations]);

  // Slots applicables pour une date
  const getSlotsForDate = useCallback((dateStr) => {
    const ctx = getDateContext(dateStr);
    const dow = new Date(dateStr + "T12:00:00").getDay();
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
        if (filterMode === "occasionnel") return cr.dispo.placesOccasionnelles > 0;
        return true; // "tous" = tous les créneaux du jour
      });
  }, [selectedDate, getSlotsForDate, getDispoSlot, filterMode]);

  // Données vue semaine
  const semaineDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const semaineData = useMemo(() => semaineDates.map(dateStr => {
    const ctx = getDateContext(dateStr);
    const dow = new Date(dateStr + "T12:00:00").getDay();
    const dayName = JOURS_SEMAINE[dow];
    const slots = getSlotsForDate(dateStr);
    const dispos = slots.map(cr => ({ ...cr, dispo: getDispoSlot(cr, dateStr) }));
    const totalLibres = dispos.reduce((s, cr) => s + cr.dispo.placesLibres, 0);
    const totalOcc = dispos.reduce((s, cr) => s + cr.dispo.placesOccasionnelles, 0);
    return { dateStr, dayName, dow, ctx, dispos: dispos.filter(cr => cr.dispo.total > 0), totalLibres, totalOcc, isToday: dateStr === todayStr() };
  }), [semaineDates, getSlotsForDate, getDispoSlot]);

  const totalJour = jourData.reduce((s, cr) => ({ libres: s.libres + cr.dispo.placesLibres, prov: s.prov + cr.dispo.placesOccasionnelles }), { libres: 0, prov: 0 });
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
            {[["tous","Tout"],["regulier","🟢 Régulières"],["occasionnel","⚡ Occasionnels"]].map(([k,l]) => (
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
            {[[C.success,"🟢 Place régulière libre"],[C.warning,"⚡ Place occasionnelle libre"],[C.textDim,"— Aucune disponibilité"]].map(([col,lbl]) => (
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
                  ) : day.totalLibres + day.totalOcc === 0 ? (
                    <div style={{ fontSize:10, color:C.textDim, marginTop:4 }}>Complet</div>
                  ) : (
                    <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:3 }}>
                      {day.totalLibres > 0 && <div style={{ fontSize:11, fontWeight:700, color:C.success, background:C.success+"15", borderRadius:6, padding:"2px 6px" }}>🟢 {day.totalLibres}</div>}
                      {day.totalOcc > 0 && <div style={{ fontSize:11, fontWeight:700, color:C.warning, background:C.warning+"15", borderRadius:6, padding:"2px 6px" }}>⚡ {day.totalOcc}</div>}
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
                      {cr.dispo.placesOccasionnelles > 0 && <span style={{ fontSize:10, fontWeight:700, color:C.warning, background:C.warning+"15", borderRadius:4, padding:"1px 5px" }}>⚡ {cr.dispo.placesOccasionnelles}</span>}
                    </div>
                  </div>
                ))}
                {day.ctx.type !== "samedi_milieu" && day.dispos.length === 0 && day.ctx.type !== "samedi_milieu" && new Date(day.dateStr + "T12:00:00").getDay() !== 0 && (
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
        const dow = new Date(selectedDate + "T12:00:00").getDay();
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
                  <span style={{ fontSize:18 }}>⚡</span>
                  <div><div style={{ fontSize:11, color:C.warning, fontWeight:700, textTransform:"uppercase" }}>Places occasionnelles libres</div><div style={{ fontSize:22, fontWeight:800, color:C.warning }}>{totalJour.prov}</div></div>
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
                      </div>
                    </div>

                    {/* Places permanentes libres */}
                    <div style={{ background:cr.dispo.placesLibres>0?C.success+"10":C.surfaceLight, border:`2px solid ${cr.dispo.placesLibres>0?C.success+"44":C.border}`, borderRadius:12, padding:14 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:22 }}>{cr.dispo.placesLibres>0?"🟢":"⛔"}</span>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:cr.dispo.placesLibres>0?C.success:C.textDim, textTransform:"uppercase" }}>Place{cr.dispo.placesLibres!==1?"s":""} permanente{cr.dispo.placesLibres!==1?"s":""} libre{cr.dispo.placesLibres!==1?"s":""}</div>
                          <div style={{ fontSize:28, fontWeight:800, color:cr.dispo.placesLibres>0?C.success:C.textDim }}>{cr.dispo.placesLibres}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:cr.dispo.placesLibres>0?C.success:C.textDim }}>
                        {cr.dispo.placesLibres>0 ? `✓ Inscription abonné possible — ${cr.dispo.nbAbonnes}/${cr.capacite} places occupées` : `Complet — ${cr.dispo.nbAbonnes}/${cr.capacite} abonnés`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

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
      {sorted.length === 0
        ? <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 50, textAlign: "center" }}><div style={{ fontSize: 50, marginBottom: 12 }}>💰</div><div style={{ color: C.textMuted }}>Aucun paiement</div></div>
        : <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: `2px solid ${C.border}`, background: C.blue+"15" }}>{["Date","Élève","Montant","Mode","Mois","Note"].map((h,i) => <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>{sorted.map(p => { const el = eleves.find(e => e.id===p.eleve_id); return (
                <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.textMuted }}>{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</td>
                  <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: C.text }}>{el ? `${el.prenom} ${el.nom}` : p.eleve_id}</td>
                  <td style={{ padding: "10px 14px", fontSize: 16, fontWeight: 800, color: C.success }}>{parseFloat(p.montant).toFixed(0)}€</td>
                  <td style={{ padding: "10px 14px" }}><Badge color={C.textMuted}>{p.mode_paiement}</Badge></td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.textMuted }}>{p.mois_concerne||"—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.textDim }}>{p.commentaire||"—"}</td>
                </tr>
              ); })}</tbody>
            </table>
          </div>}
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} eleves={eleves} preselectedEleve="" refresh={refresh} />
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
      case "dashboard": return <DashboardPage eleves={eleves} creneaux={creneaux} affectations={affectations} suiviMensuel={suiviMensuel} paiements={paiements} presences={presences} onNavigate={nav} refresh={loadData} />;
      case "planning": return <PlanningPage creneaux={creneaux} affectations={affectations} eleves={eleves} presences={presences} suiviMensuel={suiviMensuel} refresh={loadData} initialDate={pageParams.date} initialSlotId={pageParams.slotId} />;
      case "eleves": return <ElevesPage eleves={eleves} creneaux={creneaux} affectations={affectations} suiviMensuel={suiviMensuel} paiements={paiements} presences={presences} refresh={loadData} initialAction={pageParams.action} initialOpenId={pageParams.openId} />;
      case "creneaux": return <CreneauxPage creneaux={creneaux} affectations={affectations} refresh={loadData} />;
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
