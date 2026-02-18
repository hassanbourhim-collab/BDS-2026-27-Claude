import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ═══════════════════════════════════════════════════════════════
// 🎓 BULLES DE SAVOIR — Application Live v3d (Stages Lun-Ven)
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

// ═══ CONSTANTS ═══
const C = {
  bg: "#0B0F1A", surface: "#111827", surfaceLight: "#1F2937", border: "#374151",
  accent: "#3B82F6", accentLight: "#60A5FA", accentDark: "#1D4ED8",
  success: "#10B981", warning: "#F59E0B", danger: "#EF4444",
  text: "#F9FAFB", textMuted: "#9CA3AF", textDim: "#6B7280",
  gold: "#F59E0B", purple: "#8B5CF6", pink: "#EC4899", orange: "#F97316",
};
const CLASSES = ["6ème","5ème","4ème","3ème","2nde","1ère","Tle","PostBac"];
const FORFAITS = { groupe: { l: "Groupe", c: C.accent, t: 15 }, individuel: { l: "Individuel", c: C.gold, t: 35 }, Triple: { l: "Triple", c: C.purple, t: 20 }, double: { l: "Double", c: C.pink, t: 25 }, stage: { l: "Stage", c: C.orange, t: 15 } };
const MOIS_LABELS = { "Août":"Août","Septembre":"Sept","Octobre":"Oct","Novembre":"Nov","Décembre":"Déc","Janvier":"Jan","Février":"Fév","Mars":"Mars","Avril":"Avr","Mai":"Mai","Juin":"Juin","Juillet":"Juil" };
const MOIS_ORDER = ["Août","Septembre","Octobre","Novembre","Décembre","Janvier","Février","Mars","Avril","Mai","Juin","Juillet"];
const JOURS_SEMAINE = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const JOURS_ALL = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const PERIODES = [["toussaint","🍂 Toussaint"],["noel","🎄 Noël"],["hiver","❄️ Hiver"],["printemps","🌸 Printemps"]];

// ═══ VACANCES ZONE B 2025-2026 (Lun-Ven uniquement, samedis = hors vacances) ═══
const VACANCES_2526 = [
  { id: "toussaint", label: "🍂 Toussaint", s1d: "2025-10-20", s1f: "2025-10-24", s2d: "2025-10-27", s2f: "2025-10-31", samMilieu: "2025-10-25" },
  { id: "noel",      label: "🎄 Noël",      s1d: "2025-12-22", s1f: "2025-12-26", s2d: "2025-12-29", s2f: "2026-01-02", samMilieu: "2025-12-27" },
  { id: "hiver",     label: "❄️ Hiver",     s1d: "2026-02-16", s1f: "2026-02-20", s2d: "2026-02-23", s2f: "2026-02-27", samMilieu: "2026-02-21" },
  { id: "printemps", label: "🌸 Printemps",  s1d: "2026-04-13", s1f: "2026-04-17", s2d: "2026-04-20", s2f: "2026-04-24", samMilieu: "2026-04-18" },
];

const getDateContext = (dateStr) => {
  const d = new Date(dateStr);
  const dow = d.getDay();
  for (const v of VACANCES_2526) {
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
const tarifMode = (mode) => ({ individuel: 35, Triple: 20, double: 25 }[mode] || 15);
const slotDur = (cr) => { if (!cr.heure_debut || !cr.heure_fin) return 2; const [h1,m1] = cr.heure_debut.split(":").map(Number); const [h2,m2] = cr.heure_fin.split(":").map(Number); return (h2 + (m2||0)/60) - (h1 + (m1||0)/60) || 2; };

// ═══ UI COMPONENTS ═══
const Badge = ({ children, color = C.accent, onClick, title }) => (
  <span onClick={onClick} title={title} style={{ display: "inline-flex", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "22", color, whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default" }}>{children}</span>
);
const KPI = ({ icon, label, value, sub, color = C.accent, onClick }) => (
  <div onClick={onClick} style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceLight})`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 22px", position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default", transition: "all 0.2s" }}
    onMouseEnter={e => { if(onClick) { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-2px)"; } }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
    <div style={{ position: "absolute", top: -10, right: -10, width: 70, height: 70, borderRadius: "50%", background: color + "08" }} />
    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: C.text }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{sub}</div>}
    {onClick && <div style={{ fontSize: 10, color, marginTop: 4 }}>Cliquer pour détails →</div>}
  </div>
);
const Btn = ({ children, onClick, color = C.accent, small, disabled, outline, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{ padding: small ? "5px 12px" : "9px 18px", borderRadius: 8, border: outline ? `1px solid ${color}` : "none", background: outline ? "transparent" : disabled ? C.surfaceLight : color, color: outline ? color : "#fff", fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s" }}>{children}</button>
);
const Input = ({ label, value, onChange, type = "text", options, placeholder }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>{label}</div>}
    {options ? <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, boxSizing: "border-box" }} />}
  </div>
);
const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (<div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, maxWidth: wide ? 800 : 550, width: "100%", maxHeight: "85vh", overflow: "auto", padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
      </div>{children}
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Mode" value={form.mode_paiement} onChange={v => setForm({...form, mode_paiement: v})} options={[["especes","💵 Espèces"],["cheque","📝 Chèque"],["virement","🏦 Virement"],["CB","💳 CB"]]} />
        <Input label="Mois concerné" value={form.mois_concerne} onChange={v => setForm({...form, mois_concerne: v})} options={[["","— Optionnel —"],...MOIS_ORDER.map(m => [m,m])]} />
      </div>
      <Input label="Commentaire" value={form.commentaire} onChange={v => setForm({...form, commentaire: v})} placeholder="Ex: Chèque n°1234" />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <Btn onClick={onClose} color={C.textMuted} outline>Annuler</Btn>
        <Btn onClick={save} disabled={saving || !form.eleve_id || !form.montant} color={C.success}>{saving ? "..." : "Enregistrer"}</Btn>
      </div>
    </Modal>
  );
};

// ═══ CRÉNEAU MODAL (create/edit) ═══
const CreneauModal = ({ open, onClose, creneau, refresh }) => {
  const [form, setForm] = useState({ jour: "Lundi", heure_debut: "16:00", heure_fin: "17:00", mode: "groupe", capacite: 6, type_creneau: "regulier", periode_vacances: null, semaine_vacances: 1 });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (creneau) setForm({ jour: creneau.jour, heure_debut: creneau.heure_debut?.substring(0,5)||"16:00", heure_fin: creneau.heure_fin?.substring(0,5)||"17:00", mode: creneau.mode, capacite: creneau.capacite, type_creneau: creneau.type_creneau || "regulier", periode_vacances: creneau.periode_vacances || "toussaint", semaine_vacances: creneau.semaine_vacances || 1 });
    else setForm({ jour: "Lundi", heure_debut: "16:00", heure_fin: "17:00", mode: "groupe", capacite: 6, type_creneau: "regulier", periode_vacances: "toussaint", semaine_vacances: 1 });
  }, [creneau, open]);
  const save = async () => {
    setSaving(true);
    const data = { ...form, capacite: parseInt(form.capacite), periode_vacances: form.type_creneau === "stage" ? form.periode_vacances : null, semaine_vacances: form.type_creneau === "stage" ? parseInt(form.semaine_vacances) : null, jour: form.type_creneau === "stage" ? "Lundi" : form.jour };
    if (creneau) await api.patch("creneaux", `id=eq.${creneau.id}`, data);
    else await api.post("creneaux", data);
    setSaving(false); onClose(); refresh();
  };
  const isStage = form.type_creneau === "stage";
  return (
    <Modal open={open} onClose={onClose} title={creneau ? "✏️ Modifier créneau" : "➕ Nouveau créneau"}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["regulier","📅 Régulier"],["stage","🏕️ Stage"]].map(([k,l]) => (
          <div key={k} onClick={() => setForm({...form, type_creneau: k})} style={{ flex: 1, padding: 10, borderRadius: 8, textAlign: "center", cursor: "pointer", border: `2px solid ${form.type_creneau===k?(k==="stage"?C.orange:C.accent):C.border}`, background: form.type_creneau===k?(k==="stage"?C.orange:C.accent)+"15":"transparent", color: form.type_creneau===k?C.text:C.textMuted, fontWeight: 600, fontSize: 13 }}>{l}</div>
        ))}
      </div>
      {isStage && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Période" value={form.periode_vacances||"toussaint"} onChange={v => setForm({...form, periode_vacances: v})} options={PERIODES} />
          <Input label="Semaine" value={form.semaine_vacances} onChange={v => setForm({...form, semaine_vacances: v})} options={[["1","Semaine 1"],["2","Semaine 2"]]} />
        </div>
      )}
      {isStage ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Début" value={form.heure_debut} onChange={v => setForm({...form, heure_debut: v})} type="time" />
          <Input label="Fin" value={form.heure_fin} onChange={v => setForm({...form, heure_fin: v})} type="time" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Input label="Jour" value={form.jour} onChange={v => setForm({...form, jour: v})} options={JOURS_ALL.map(j => [j, j])} />
          <Input label="Début" value={form.heure_debut} onChange={v => setForm({...form, heure_debut: v})} type="time" />
          <Input label="Fin" value={form.heure_fin} onChange={v => setForm({...form, heure_fin: v})} type="time" />
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Mode" value={form.mode} onChange={v => setForm({...form, mode: v})} options={Object.entries(FORFAITS).map(([k,v]) => [k, `${v.l} (${v.t}€/h)`])} />
        <Input label="Capacité" value={form.capacite} onChange={v => setForm({...form, capacite: v})} type="number" />
      </div>
      {isStage && <div style={{ background: C.orange+"15", borderRadius: 8, padding: 10, marginTop: 4, fontSize: 11, color: C.orange }}>🏕️ Ce créneau horaire apparaîtra <b>du lundi au vendredi</b> de la semaine {form.semaine_vacances} des vacances {PERIODES.find(p=>p[0]===form.periode_vacances)?.[1]||""}. L'appel se fait jour par jour dans le Planning.</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <Btn onClick={onClose} color={C.textMuted} outline>Annuler</Btn>
        <Btn onClick={save} disabled={saving} color={isStage?C.orange:C.accent}>{saving?"...":creneau?"Modifier":"Créer"}</Btn>
      </div>
    </Modal>
  );
};

// ═══ SLOT DETAIL MODAL (click on any slot to see info + students) ═══
const SlotDetailModal = ({ open, onClose, slot, eleves, affectations, refresh }) => {
  const [addEleve, setAddEleve] = useState("");
  const [addType, setAddType] = useState("abonne");
  if (!open || !slot) return null;
  const students = affectations.filter(a => a.creneau_id === slot.id && a.actif).map(a => { const el = eleves.find(e => e.id === a.eleve_id); return el ? { ...el, affectation_id: a.id, type_inscription: a.type_inscription } : null; }).filter(Boolean);
  const removeStudent = async (affId) => { await api.del("affectations_creneaux", `id=eq.${affId}`); refresh(); };
  const addStudent = async () => {
    if (!addEleve) return;
    await api.post("affectations_creneaux", { eleve_id: addEleve, creneau_id: slot.id, type_inscription: addType, actif: true });
    setAddEleve(""); refresh();
  };
  const isStage = slot.type_creneau === "stage";
  const periodeLabel = isStage ? PERIODES.find(p => p[0] === slot.periode_vacances)?.[1] || "" : "";
  return (
    <Modal open={open} onClose={onClose} title={`${slot.type_creneau==="stage"?"Lun→Ven":slot.jour} ${slot.heure_debut}-${slot.heure_fin}`} wide>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||slot.mode} · {tarifMode(slot.mode)}€/h</Badge>
        <Badge color={C.textMuted}>{students.length}/{slot.capacite} places</Badge>
        {isStage && <Badge color={C.orange}>Stage {periodeLabel} — S{slot.semaine_vacances}</Badge>}
        {!isStage && <Badge color={C.accent}>Régulier</Badge>}
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>ÉLÈVES INSCRITS ({students.length})</div>
        {students.length === 0 ? <div style={{ color: C.textDim, fontSize: 12 }}>Aucun élève inscrit</div> :
          students.map(st => (
            <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 6, background: C.surfaceLight, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{st.prenom} {st.nom}</span>
                <Badge color={C.purple}>{st.classe}</Badge>
                {st.type_inscription === "occasionnel" && <Badge color={C.warning}>Occ.</Badge>}
              </div>
              <button onClick={() => removeStudent(st.affectation_id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, opacity: 0.6 }}>✕ Retirer</button>
            </div>
          ))
        }
      </div>
      {students.length < slot.capacite && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>INSCRIRE UN ÉLÈVE</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, alignItems: "end" }}>
            <Input label="Élève" value={addEleve} onChange={setAddEleve} options={[["","— Choisir —"], ...eleves.filter(e => e.actif && !students.find(s => s.id === e.id)).sort((a,b) => a.nom.localeCompare(b.nom)).map(e => [e.id, `${e.prenom} ${e.nom} (${e.classe})`])]} />
            <Input label="Type" value={addType} onChange={setAddType} options={[["abonne","🔄 Abonné"],["occasionnel","⚡ Occasionnel"]]} />
            <div style={{ marginBottom: 12 }}><Btn onClick={addStudent} disabled={!addEleve} color={C.success} small>+ Inscrire</Btn></div>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ═══ DASHBOARD ═══
const DashboardPage = ({ eleves, creneaux, affectations, suiviMensuel, paiements, presences, onNavigate }) => {
  const [classeOpen, setClasseOpen] = useState(false);
  const [retardsOpen, setRetardsOpen] = useState(false);
  const [incompletOpen, setIncompletOpen] = useState(false);
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
  const incomplets = eleves.filter(e => e.actif && (!e.cotisation_payee || !e.fiche_inscription));
  const pieColors = ["#3B82F6","#8B5CF6","#EC4899","#F59E0B","#10B981","#06B6D4","#F97316","#6366F1"];

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Tableau de bord</h1><p style={{ color: C.textMuted, margin: "4px 0 0", fontSize: 13 }}>Données en direct — {new Date().toLocaleDateString("fr-FR")}</p></div>
        <div style={{ display: "flex", gap: 8 }}><Btn onClick={() => onNavigate("eleves", { action: "new" })} color={C.success} small>+ Nouveau client</Btn><Btn onClick={() => setPayOpen(true)} color={C.accent} small>+ Nouveau règlement</Btn></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KPI icon="👥" label="Élèves actifs" value={actifs} sub={`${eleves.length} au total`} color={C.accent} onClick={() => onNavigate("eleves")} />
        <KPI icon="📅" label="Créneaux" value={creneaux.length} sub={`${creneaux.filter(c=>(c.type_creneau||"regulier")==="regulier").length} rég. / ${creneaux.filter(c=>c.type_creneau==="stage").length} stages`} color={C.purple} onClick={() => onNavigate("creneaux")} />
        <KPI icon="💰" label="CA total" value={totalCA > 0 ? `${totalCA.toFixed(0)}€` : "—"} sub={totalPaye > 0 ? `${totalPaye.toFixed(0)}€ payés` : ""} color={C.success} />
        <KPI icon="🚨" label="Retards" value={retards.length > 0 ? `${Math.abs(totalRetard).toFixed(0)}€` : "—"} sub={retards.length > 0 ? `${retards.length} famille(s)` : "Aucun"} color={C.danger} onClick={retards.length > 0 ? () => setRetardsOpen(true) : null} />
      </div>

      {/* Prochain cours bandeau */}
      <div style={{ background: `linear-gradient(135deg, ${smart.ctx.type==="vacances"?C.orange:C.accent}15, ${C.purple}15)`, border: `1px solid ${smart.ctx.type==="vacances"?C.orange:C.accent}44`, borderRadius: 14, padding: 16, marginBottom: 20, cursor: "pointer" }} onClick={() => onNavigate("planning", { date: smart.date })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 20 }}>📋</span><span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{smart.isToday ? `Aujourd'hui — ${dayName}` : `Prochain cours — ${dayName}`}</span><Badge color={smart.ctx.type==="vacances"?C.orange:C.accent}>{ctxLabel}</Badge></div>
          <span style={{ color: C.accentLight, fontSize: 12 }}>Ouvrir le planning →</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {nextCourseSlots.length > 0 ? nextCourseSlots.map(sl => (
            <div key={sl.id} style={{ background: C.surface, borderRadius: 8, padding: "8px 12px", border: `1px solid ${C.border}`, flex: "1 1 150px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.accentLight }}>{(sl.heure_debut||"").substring(0,5)}-{(sl.heure_fin||"").substring(0,5)}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{sl.students.length}/{sl.capacite} — {sl.mode}</div>
            </div>
          )) : <div style={{ fontSize: 12, color: C.textDim }}>Aucun créneau prévu</div>}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>📊 Occupation créneaux <span style={{ fontSize: 10, color: C.textDim, fontWeight: 400 }}>(cliquez pour détails)</span></h3>
          <ResponsiveContainer width="100%" height={creneauxOccupation.length * 30 + 20}>
            <BarChart data={creneauxOccupation} layout="vertical" onClick={(e) => { if (e?.activePayload?.[0]) { const d = e.activePayload[0].payload; const cr = creneaux.find(c => c.id === d.id); if (cr) setSlotDetail(cr); } }}>
              <XAxis type="number" domain={[0, 6]} tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} />
              <RTooltip contentStyle={{ background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
              <Bar dataKey="occupes" name="Inscrits" fill={C.accent} radius={[0,4,4,0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>💰 CA mensuel</h3>
          {caMensuel.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={caMensuel}>
                <XAxis dataKey="name" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} />
                <RTooltip contentStyle={{ background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} formatter={v => [`${v.toFixed(0)}€`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Facturé" fill={C.accent} radius={[4,4,0,0]} />
                <Bar dataKey="Payé" fill={C.success} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: C.textDim, fontSize: 13 }}>Après la première facturation</div>}
        </div>
      </div>

      {/* Classe */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <div onClick={() => setClasseOpen(!classeOpen)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>🎓 Répartition par classe</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{classeData.map((d, i) => <span key={d.name} style={{ fontSize: 10, color: pieColors[i], fontWeight: 600 }}>{d.name}({d.value})</span>)}<span style={{ color: C.textMuted, fontSize: 14, marginLeft: 6 }}>{classeOpen?"▲":"▼"}</span></div>
        </div>
        {classeOpen && <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={classeData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">{classeData.map((_, i) => <Cell key={i} fill={pieColors[i%pieColors.length]} />)}</Pie></PieChart></ResponsiveContainer>}
      </div>

      {/* Modals */}
      <Modal open={retardsOpen} onClose={() => setRetardsOpen(false)} title={`🚨 Retards — ${Math.abs(totalRetard).toFixed(0)}€`} wide>
        {retards.map(r => (<div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surfaceLight, borderRadius: 8, padding: "10px 14px", marginBottom: 6, borderLeft: `3px solid ${C.danger}` }}>
          <div><span style={{ fontWeight: 700, color: C.text, fontSize: 13, cursor: "pointer" }} onClick={() => { setRetardsOpen(false); onNavigate("eleves", { openId: r.id }); }}>{r.prenom} {r.nom}</span><span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>{r.classe}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ textAlign: "right" }}><div style={{ fontWeight: 800, color: C.danger, fontSize: 15 }}>{r.solde.toFixed(0)}€</div></div><Btn small color={C.success} onClick={() => { setRetardsOpen(false); setPayEleve(r.id); setPayOpen(true); }}>💳</Btn></div>
        </div>))}
      </Modal>
      <Modal open={incompletOpen} onClose={() => setIncompletOpen(false)} title="📋 Dossiers incomplets" wide>
        {incomplets.map(e => (<div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surfaceLight, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
          <span style={{ fontWeight: 700, color: C.text, fontSize: 13, cursor: "pointer" }} onClick={() => { setIncompletOpen(false); onNavigate("eleves", { openId: e.id }); }}>{e.prenom} {e.nom}</span>
          <div style={{ display: "flex", gap: 4 }}>{!e.cotisation_payee && <Badge color={C.danger}>Cotisation ❌</Badge>}{!e.fiche_inscription && <Badge color={C.warning}>Fiche ⚠️</Badge>}</div>
        </div>))}
      </Modal>
      <PaymentModal open={payOpen} onClose={() => { setPayOpen(false); setPayEleve(""); }} eleves={eleves} preselectedEleve={payEleve} refresh={() => onNavigate("dashboard")} />
      <SlotDetailModal open={!!slotDetail} onClose={() => setSlotDetail(null)} slot={slotDetail} eleves={eleves} affectations={affectations} refresh={() => onNavigate("dashboard")} />
    </div>
  );
};

// ═══ PLANNING PRONOTE ═══
const PlanningPage = ({ creneaux, affectations, eleves, presences, refresh, initialDate }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || getSmartDay().date);
  const [localPresences, setLocalPresences] = useState([]);
  const [saving, setSaving] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [addEleve, setAddEleve] = useState("");
  const [addType, setAddType] = useState("occasionnel");

  const dayName = useMemo(() => JOURS_SEMAINE[new Date(selectedDate).getDay()], [selectedDate]);
  const dateCtx = useMemo(() => getDateContext(selectedDate), [selectedDate]);
  const dow = new Date(selectedDate).getDay();

  const isCoursDay = useMemo(() => {
    if (dateCtx.type === "samedi_milieu") return false;
    if (dateCtx.type === "vacances") return dow >= 1 && dow <= 5;
    return dow >= 1 && dow <= 6; // All days possible for hors_vacances
  }, [dateCtx, dow]);

  const loadPresences = useCallback(async () => { const d = await api.get("presences", `date_cours=eq.${selectedDate}`); setLocalPresences(d||[]); }, [selectedDate]);
  useEffect(() => { loadPresences(); }, [loadPresences]);

  const daySlots = useMemo(() => {
    let rel;
    if (dateCtx.type === "vacances") {
      // Stages: show ALL stage créneaux for this period+week on every weekday (ignore jour field)
      rel = creneaux.filter(cr => cr.type_creneau === "stage" && cr.periode_vacances === dateCtx.vacance?.id && (cr.semaine_vacances === dateCtx.semaine || cr.semaine_vacances === null));
    } else {
      rel = creneaux.filter(cr => (cr.type_creneau||"regulier") === "regulier" && cr.jour === dayName);
    }
    return rel.map(cr => {
      const assigned = affectations.filter(a => a.creneau_id === cr.id && a.actif);
      const students = assigned.map(a => { const el = eleves.find(e => e.id === a.eleve_id); const pres = localPresences.find(p => p.eleve_id === a.eleve_id && p.creneau_id === cr.id); return el ? { ...el, type_inscription: a.type_inscription, presence: pres, affectation_id: a.id } : null; }).filter(Boolean);
      return { ...cr, students, dur: slotDur(cr) };
    });
  }, [creneaux, affectations, eleves, dayName, localPresences, dateCtx]);

  const markPresent = async (eid, cid, h) => { setSaving(true); await api.post("presences", { eleve_id: eid, date_cours: selectedDate, creneau_id: cid, statut: "present", heures: h }); await loadPresences(); setSaving(false); };
  const markAbsent = async (eid, cid, m) => { setSaving(true); await api.post("presences", { eleve_id: eid, date_cours: selectedDate, creneau_id: cid, statut: m, heures: 0 }); await loadPresences(); setSaving(false); };
  const removePresence = async (pid) => { await api.del("presences", `id=eq.${pid}`); await loadPresences(); };
  const markAllPresent = async (slot) => { setSaving(true); for (const st of slot.students) { if (!st.presence) await api.post("presences", { eleve_id: st.id, date_cours: selectedDate, creneau_id: slot.id, statut: "present", heures: slot.dur }); } await loadPresences(); setSaving(false); };
  const addOcc = async () => { if (!addEleve || !addingTo) return; await api.post("affectations_creneaux", { eleve_id: addEleve, creneau_id: addingTo.id, type_inscription: addType, actif: true }); setAddingTo(null); setAddEleve(""); refresh(); };

  const stats = useMemo(() => { let t=0,p=0,a=0,pe=0; daySlots.forEach(s => s.students.forEach(st => { t++; if(st.presence){st.presence.statut==="present"?p++:a++;}else pe++; })); return { t,p,a,pe }; }, [daySlots]);

  const moveDate = (dir) => { const d = new Date(selectedDate); d.setDate(d.getDate()+dir); setSelectedDate(d.toISOString().split("T")[0]); };
  const ctxColor = dateCtx.type==="vacances"?C.orange:dateCtx.type==="samedi_milieu"?C.textDim:C.accent;
  const ctxLabel = dateCtx.type==="vacances"?`🏕️ Stage ${dateCtx.vacance.label} — Semaine ${dateCtx.semaine}`:dateCtx.type==="samedi_milieu"?"😴 Samedi milieu — pas de cours":"📚 Période scolaire";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}><span style={{ fontSize: 22 }}>📋</span><h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Planning — Appel</h2></div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <Btn small onClick={() => moveDate(-1)} color={C.textMuted} outline>◀</Btn>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: "9px 14px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14 }} />
        <Btn small onClick={() => moveDate(1)} color={C.textMuted} outline>▶</Btn>
        <Badge color={isCoursDay?C.accent:C.textDim}>{dayName}</Badge>
        {saving && <span style={{ fontSize: 12, color: C.warning }}>⏳</span>}
      </div>
      <div style={{ background: ctxColor+"15", border: `1px solid ${ctxColor}33`, borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 13, color: ctxColor, fontWeight: 600 }}>{ctxLabel}</div>

      {isCoursDay && daySlots.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <Badge color={C.text}>{stats.t} élèves</Badge><Badge color={C.success}>✓ {stats.p}</Badge><Badge color={C.danger}>✗ {stats.a}</Badge>
          {stats.pe > 0 && <Badge color={C.warning}>⏳ {stats.pe}</Badge>}
        </div>
      )}

      {!isCoursDay ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>😴</div>
          <div style={{ color: C.textMuted, fontSize: 14 }}>Pas de cours le {dayName}{dateCtx.type==="samedi_milieu"?" (milieu vacances)":""}</div>
        </div>
      ) : daySlots.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{dateCtx.type==="vacances"?"🏕️":"📅"}</div>
          <div style={{ color: C.textMuted, fontSize: 14 }}>Aucun créneau {dateCtx.type==="vacances"?`de stage (${dateCtx.vacance.label} S${dateCtx.semaine})`:"régulier"} pour {dayName}</div>
          <div style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>Créez-en depuis la page Créneaux</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {daySlots.map(slot => {
            const allDone = slot.students.length > 0 && slot.students.every(st => st.presence);
            const tarif = tarifMode(slot.mode);
            return (
              <div key={slot.id} style={{ background: C.surface, border: `1px solid ${allDone?C.success+"44":C.border}`, borderRadius: 14, padding: 16, borderLeft: `4px solid ${allDone?C.success:dateCtx.type==="vacances"?C.orange:C.accent}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{(slot.heure_debut||"").substring(0,5)} — {(slot.heure_fin||"").substring(0,5)}</span>
                    <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||"Groupe"} · {tarif}€/h</Badge>
                    <Badge color={C.textMuted}>{slot.students.length}/{slot.capacite}</Badge>
                    {slot.type_creneau==="stage" && <Badge color={C.orange}>Stage S{slot.semaine_vacances}</Badge>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!allDone && slot.students.length > 0 && <Btn small color={C.success} onClick={() => markAllPresent(slot)} title="Tous présents">✓ Tous</Btn>}
                    {slot.students.length < slot.capacite && <Btn small color={C.purple} outline onClick={() => { setAddingTo(slot); setAddEleve(""); }}>+ Élève</Btn>}
                    {allDone && slot.students.length > 0 && <Badge color={C.success}>✅ Terminé</Badge>}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  {slot.students.map(st => {
                    const p = st.presence; const isP = p && p.statut==="present"; const isA = p && p.statut!=="present";
                    const ml = p?(p.statut==="present"?"Présent":p.statut==="absent_justifie"?"Abs. justifié":"Abs. non justifié"):"";
                    return (
                      <div key={st.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: isP?C.success+"11":isA?C.danger+"11":C.surfaceLight, border: `1px solid ${isP?C.success+"33":isA?C.danger+"33":"transparent"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{st.prenom} {st.nom}</span>{st.type_inscription==="occasionnel"&&<Badge color={C.warning}>Occ.</Badge>}<span style={{ fontSize: 10, color: C.textDim }}>{st.classe}</span></div>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          {p ? (<><Badge color={isP?C.success:C.danger}>{ml}</Badge>{isP&&<span style={{ fontSize: 10, color: C.success }}>{(tarif*slot.dur).toFixed(0)}€</span>}<button onClick={() => removePresence(p.id)} title="Annuler" style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer" }}>↩</button></>
                          ) : (<><Btn small onClick={() => markPresent(st.id, slot.id, slot.dur)} color={C.success} title="PRÉSENT — facturé">✓</Btn><Btn small onClick={() => markAbsent(st.id, slot.id, "absent_justifie")} color={C.warning} outline title="Absent justifié — non facturé">🏥</Btn><Btn small onClick={() => markAbsent(st.id, slot.id, "absent_non_justifie")} color={C.danger} outline title="Absent non justifié — facturé">❌</Btn></>)}
                        </div>
                      </div>);
                  })}
                </div>
                {slot.students.length === 0 && <div style={{ textAlign: "center", padding: 16, color: C.textDim, fontSize: 12 }}>Créneau vide — ajoutez des élèves depuis la page Créneaux ou cliquez + Élève</div>}
              </div>);
          })}
        </div>
      )}

      <Modal open={!!addingTo} onClose={() => setAddingTo(null)} title={`Ajouter à ${addingTo?.heure_debut}-${addingTo?.heure_fin}`}>
        {addingTo && (<div>
          <Input label="Élève" value={addEleve} onChange={setAddEleve} options={[["","— Choisir —"], ...eleves.filter(e => e.actif).sort((a,b) => a.nom.localeCompare(b.nom)).map(e => [e.id, `${e.prenom} ${e.nom} (${e.classe})`])]} />
          <Input label="Type" value={addType} onChange={setAddType} options={[["abonne","🔄 Abonné"],["occasionnel","⚡ Occasionnel"]]} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}><Btn onClick={() => setAddingTo(null)} color={C.textMuted} outline>Annuler</Btn><Btn onClick={addOcc} disabled={!addEleve}>Ajouter</Btn></div>
        </div>)}
      </Modal>
    </div>
  );
};

// ═══ ÉLÈVES ═══
const ElevesPage = ({ eleves, creneaux, affectations, suiviMensuel, paiements, presences, refresh, initialAction, initialOpenId }) => {
  const [search, setSearch] = useState(""); const [filterClasse, setFilterClasse] = useState("all"); const [filterStatut, setFilterStatut] = useState("actif");
  const [selected, setSelected] = useState(null); const [editing, setEditing] = useState(null); const [detailOpen, setDetailOpen] = useState(null); const [payOpen, setPayOpen] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => { if (initialAction === "new") openNew(); if (initialOpenId) { const el = eleves.find(e => e.id === initialOpenId); if (el) openEdit(el); } }, [initialAction, initialOpenId, eleves]);
  const filtered = useMemo(() => { let l = [...eleves]; if (search) { const q = search.toLowerCase(); l = l.filter(s => `${s.nom} ${s.prenom} ${s.id}`.toLowerCase().includes(q)); } if (filterClasse!=="all") l = l.filter(s => s.classe===filterClasse); if (filterStatut==="actif") l = l.filter(s => s.actif); if (filterStatut==="inactif") l = l.filter(s => !s.actif); return l.sort((a,b) => a.nom.localeCompare(b.nom)); }, [eleves, search, filterClasse, filterStatut]);
  const soldeEleve = useCallback((eid) => { const f = suiviMensuel.filter(s => s.eleve_id===eid).reduce((s,x) => s+parseFloat(x.montant_facture||0),0); const p = paiements.filter(x => x.eleve_id===eid).reduce((s,x) => s+parseFloat(x.montant||0),0); let prov = 0; const ma = getMoisActuel(); if (!suiviMensuel.some(s => s.eleve_id===eid && s.mois===ma)) { presences.filter(x => x.eleve_id===eid && x.statut==="present").forEach(x => { const cr = creneaux.find(c => c.id===x.creneau_id); if (cr) prov += tarifMode(cr.mode)*(parseFloat(x.heures)||slotDur(cr)); }); } return { facture: f, paye: p, solde: p-f, provisoire: prov }; }, [suiviMensuel, paiements, presences, creneaux]);
  const creneauxEleve = useCallback((eid) => affectations.filter(a => a.eleve_id===eid && a.actif).map(a => { const cr = creneaux.find(c => c.id===a.creneau_id); return cr ? { ...cr, type_inscription: a.type_inscription } : null; }).filter(Boolean), [affectations, creneaux]);
  const getDetail = useCallback((eid) => { const d = {}; MOIS_ORDER.forEach(m => { d[m] = { cours: [], paiements: [], facture: 0 }; }); suiviMensuel.filter(s => s.eleve_id===eid).forEach(s => { if(d[s.mois]) d[s.mois].facture = parseFloat(s.montant_facture||0); }); paiements.filter(p => p.eleve_id===eid).forEach(p => { if(p.mois_concerne && d[p.mois_concerne]) d[p.mois_concerne].paiements.push(p); }); presences.filter(p => p.eleve_id===eid).forEach(p => { const dt = new Date(p.date_cours); const mn = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][dt.getMonth()]; if(d[mn]) d[mn].cours.push(p); }); return MOIS_ORDER.map(m => ({ mois: m, ...d[m] })).filter(x => x.facture>0 || x.cours.length>0 || x.paiements.length>0); }, [suiviMensuel, paiements, presences]);
  const saveStudent = async () => { setSaving(true); const { id, created_at, updated_at, ...data } = editing; if (selected) await api.patch("eleves", `id=eq.${selected.id}`, data); else await api.post("eleves", editing); setSaving(false); setEditing(null); setSelected(null); refresh(); };
  const openEdit = (s) => { setSelected(s); setEditing({...s}); }; const openNew = () => { setSelected(null); setEditing({ id:"",nom:"",prenom:"",actif:true,forfait:"groupe",classe:"6ème",cotisation_payee:false,fiche_inscription:false,tel_parent1:"",tel_parent2:"",tel_eleve:"",email:"",adresse:"",nom_parent1:"",nom_parent2:"",date_naissance:null }); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>👥</span><h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Élèves</h2><Badge color={C.accentLight}>{filtered.length}</Badge></div>
        <Btn onClick={openNew} color={C.success}>+ Nouvel élève</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ width: "100%", padding: "9px 12px 9px 36px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, boxSizing: "border-box" }} /></div>
        <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)} style={{ padding: "9px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}><option value="all">Toutes classes</option>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ padding: "9px", background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}><option value="all">Tous</option><option value="actif">Actifs</option><option value="inactif">Inactifs</option></select>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{["","Élève","Classe","Forfait","Solde","~Prov.","Tél","Dossier",""].map((h,i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map(s => { const f = FORFAITS[s.forfait]||{l:s.forfait,c:C.textMuted}; const {solde,facture,provisoire} = soldeEleve(s.id); return (
            <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}11`, cursor: "pointer" }} onClick={() => openEdit(s)} onMouseEnter={e => e.currentTarget.style.background=C.surfaceLight} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <td style={{ padding: "8px 14px", width: 30 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: s.actif?C.success:C.danger }} /></td>
              <td style={{ padding: "8px 14px" }}><div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{s.prenom} {s.nom}</div></td>
              <td style={{ padding: "8px 14px" }}><Badge color={C.purple}>{s.classe||"—"}</Badge></td>
              <td style={{ padding: "8px 14px" }}><Badge color={f.c}>{f.l}</Badge></td>
              <td style={{ padding: "8px 14px" }}>{facture>0?<span style={{ fontSize: 12, fontWeight: 700, color: solde>=0?C.success:C.danger }}>{solde>=0?"+":""}{solde.toFixed(0)}€</span>:<span style={{ fontSize: 11, color: C.textDim }}>—</span>}</td>
              <td style={{ padding: "8px 14px" }}>{provisoire>0?<span style={{ fontSize: 11, color: C.warning }}>~{provisoire.toFixed(0)}€</span>:<span style={{ fontSize: 11, color: C.textDim }}>—</span>}</td>
              <td style={{ padding: "8px 14px", fontSize: 12, color: C.accentLight }}>{s.tel_parent1||"—"}</td>
              <td style={{ padding: "8px 14px" }}><span style={{ fontSize: 13 }}>{s.cotisation_payee?"✅":"❌"}{s.fiche_inscription?"📋":"⚠️"}</span></td>
              <td style={{ padding: "8px 14px", color: C.textDim }}>›</td></tr>);})}</tbody></table>
      </div>
      <Modal open={!!editing} onClose={() => { setEditing(null); setSelected(null); }} title={selected?`${selected.prenom} ${selected.nom}`:"Nouvel élève"} wide>
        {editing && (<div>
          {selected && (() => { const {facture,paye,solde,provisoire}=soldeEleve(selected.id); const crs=creneauxEleve(selected.id); return (<div style={{ marginBottom: 18 }}>
            {crs.length>0&&<div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{crs.map(cr => <Badge key={cr.id} color={cr.type_creneau==="stage"?C.orange:C.purple}>📅 {cr.type_creneau==="stage"?"Lun→Ven":cr.jour} {(cr.heure_debut||"").substring(0,5)}-{(cr.heure_fin||"").substring(0,5)}{cr.type_creneau==="stage"?` (Stage S${cr.semaine_vacances})`:""}</Badge>)}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, background: C.surfaceLight, borderRadius: 10, padding: 12 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>FACTURÉ</div><div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{facture>0?`${facture.toFixed(0)}€`:"—"}</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>PAYÉ</div><div style={{ fontSize: 18, fontWeight: 800, color: C.success }}>{paye>0?`${paye.toFixed(0)}€`:"—"}</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>SOLDE</div><div style={{ fontSize: 18, fontWeight: 800, color: facture===0?C.textDim:solde>=0?C.success:C.danger }}>{facture>0?`${solde>=0?"+":""}${solde.toFixed(0)}€`:"—"}</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.warning, fontWeight: 600 }}>PROVISOIRE</div><div style={{ fontSize: 18, fontWeight: 800, color: C.warning }}>{provisoire>0?`~${provisoire.toFixed(0)}€`:"—"}</div></div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}><Btn small color={C.accent} onClick={() => setDetailOpen(selected.id)}>📊 Détail</Btn><Btn small color={C.success} onClick={() => setPayOpen(true)}>💳 Règlement</Btn></div>
          </div>); })()}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {!selected && <Input label="Identifiant" value={editing.id} onChange={v => setEditing({...editing, id: v})} placeholder="Pre.NOM" />}
            <Input label="Nom" value={editing.nom} onChange={v => setEditing({...editing, nom: v})} />
            <Input label="Prénom" value={editing.prenom} onChange={v => setEditing({...editing, prenom: v})} />
            <Input label="Classe" value={editing.classe||""} onChange={v => setEditing({...editing, classe: v})} options={CLASSES.map(c => [c,c])} />
            <Input label="Forfait" value={editing.forfait} onChange={v => setEditing({...editing, forfait: v})} options={Object.entries(FORFAITS).map(([k,v]) => [k,`${v.l} (${v.t}€/h)`])} />
            <Input label="Date naissance" value={editing.date_naissance||""} onChange={v => setEditing({...editing, date_naissance: v||null})} type="date" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><Input label="Parent 1" value={editing.nom_parent1||""} onChange={v => setEditing({...editing, nom_parent1: v})} /><Input label="Parent 2" value={editing.nom_parent2||""} onChange={v => setEditing({...editing, nom_parent2: v})} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}><Input label="Tél parent 1" value={editing.tel_parent1||""} onChange={v => setEditing({...editing, tel_parent1: v})} /><Input label="Tél parent 2" value={editing.tel_parent2||""} onChange={v => setEditing({...editing, tel_parent2: v})} /><Input label="Tél élève" value={editing.tel_eleve||""} onChange={v => setEditing({...editing, tel_eleve: v})} /></div>
          <Input label="Email" value={editing.email||""} onChange={v => setEditing({...editing, email: v})} />
          <Input label="Adresse" value={editing.adresse||""} onChange={v => setEditing({...editing, adresse: v})} />
          <div style={{ display: "flex", gap: 16, marginTop: 8, marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={editing.cotisation_payee} onChange={e => setEditing({...editing, cotisation_payee: e.target.checked})} /> Cotisation</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={editing.fiche_inscription} onChange={e => setEditing({...editing, fiche_inscription: e.target.checked})} /> Fiche</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={editing.actif} onChange={e => setEditing({...editing, actif: e.target.checked})} /> Actif</label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>{selected&&<Btn onClick={() => { api.patch("eleves",`id=eq.${selected.id}`,{actif:!selected.actif}); setEditing(null); setSelected(null); refresh(); }} color={selected.actif?C.danger:C.success} outline small>{selected.actif?"Désactiver":"Réactiver"}</Btn>}</div>
            <div style={{ display: "flex", gap: 8 }}><Btn onClick={() => { setEditing(null); setSelected(null); }} color={C.textMuted} outline>Annuler</Btn><Btn onClick={saveStudent} disabled={saving||!editing.nom||!editing.prenom}>{saving?"...":"Enregistrer"}</Btn></div>
          </div>
        </div>)}
      </Modal>
      <Modal open={!!detailOpen} onClose={() => setDetailOpen(null)} title="📊 Détail cours & règlements" wide>
        {detailOpen && (() => { const data = getDetail(detailOpen); const el = eleves.find(e => e.id===detailOpen); return (<div><div style={{ fontWeight: 700, color: C.text, marginBottom: 12 }}>{el?.prenom} {el?.nom}</div>
          {data.length===0?<div style={{ textAlign: "center", color: C.textDim, padding: 20 }}>Aucune donnée</div>:data.map(d => (<div key={d.mois} style={{ background: C.surfaceLight, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontWeight: 700, color: C.accentLight, fontSize: 14 }}>{d.mois}</span><div style={{ display: "flex", gap: 10 }}>{d.facture>0&&<Badge color={C.accent}>F: {d.facture.toFixed(0)}€</Badge>}{d.paiements.length>0&&<Badge color={C.success}>P: {d.paiements.reduce((s,p) => s+parseFloat(p.montant),0).toFixed(0)}€</Badge>}</div></div>
            {d.cours.length>0&&<div style={{ fontSize: 11, color: C.textMuted }}>{d.cours.length} cours : {d.cours.map(c => new Date(c.date_cours).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})).join(", ")}</div>}
            {d.paiements.length>0&&<div style={{ fontSize: 11, color: C.success, marginTop: 2 }}>{d.paiements.map(p => `${parseFloat(p.montant).toFixed(0)}€ (${p.mode_paiement})`).join(", ")}</div>}
          </div>))}</div>); })()}
      </Modal>
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} eleves={eleves} preselectedEleve={selected?.id||""} refresh={refresh} />
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

  // Group regulars by day (all days that have slots)
  const daysReg = useMemo(() => [...new Set(reguliers.map(cr => cr.jour))].sort((a,b) => JOURS_ALL.indexOf(a)-JOURS_ALL.indexOf(b)), [reguliers]);
  const groupedReg = useMemo(() => { const g = {}; daysReg.forEach(d => g[d]=[]); reguliers.forEach(cr => { if(g[cr.jour]) { const sts = affectations.filter(a => a.creneau_id===cr.id && a.actif).map(a => { const el = eleves.find(e => e.id===a.eleve_id); return el?{...el,type_inscription:a.type_inscription,affectation_id:a.id}:null; }).filter(Boolean); g[cr.jour].push({...cr,students:sts}); } }); return g; }, [reguliers, affectations, eleves, daysReg]);

  const groupedStage = useMemo(() => { const g = {}; stages.forEach(cr => { const pk = `${cr.periode_vacances}_S${cr.semaine_vacances||1}`; if(!g[pk]) g[pk] = { periode: cr.periode_vacances, semaine: cr.semaine_vacances||1, slots: [] }; const sts = affectations.filter(a => a.creneau_id===cr.id && a.actif).map(a => { const el = eleves.find(e => e.id===a.eleve_id); return el?{...el,type_inscription:a.type_inscription,affectation_id:a.id}:null; }).filter(Boolean); g[pk].slots.push({...cr,students:sts}); }); return g; }, [stages, affectations, eleves]);

  const deleteCreneau = async (crId) => { if(confirm("Supprimer ce créneau ?")) { await api.del("affectations_creneaux",`creneau_id=eq.${crId}`); await api.del("creneaux",`id=eq.${crId}`); refresh(); } };

  const SlotCard = ({ slot }) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8, borderLeft: `3px solid ${(FORFAITS[slot.mode]||{}).c||C.accent}`, cursor: "pointer" }} onClick={() => setSlotDetail(slot)}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{(slot.heure_debut||"").substring(0,5)}-{(slot.heure_fin||"").substring(0,5)}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||"Groupe"}</Badge>
          <button onClick={e => { e.stopPropagation(); setEditCr(slot); }} title="Modifier" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 12 }}>✏️</button>
          <button onClick={e => { e.stopPropagation(); deleteCreneau(slot.id); }} title="Supprimer" style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, opacity: 0.5 }}>🗑️</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>{Array.from({length:slot.capacite}).map((_,j) => <div key={j} style={{ flex: 1, height: 3, borderRadius: 2, background: j<slot.students.length?C.accent:C.surfaceLight }} />)}</div>
      <div style={{ fontSize: 10, color: C.textDim }}>{slot.students.length}/{slot.capacite} — cliquer pour détails</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>📅</span><h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Créneaux</h2></div>
        <Btn onClick={() => setNewOpen(true)} color={C.success}>+ Nouveau créneau</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["regulier",`📅 Réguliers (${reguliers.length})`],["stage",`🏕️ Stages (${stages.length})`]].map(([k,l]) => (
          <div key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: `2px solid ${tab===k?(k==="stage"?C.orange:C.accent):C.border}`, background: tab===k?(k==="stage"?C.orange:C.accent)+"15":"transparent", color: tab===k?C.text:C.textMuted, fontWeight: 600, fontSize: 13 }}>{l}</div>
        ))}
      </div>
      {tab==="regulier" ? (
        daysReg.length===0 ? <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: C.textDim }}>Aucun créneau régulier</div> :
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(daysReg.length,5)}, 1fr)`, gap: 16 }}>
          {daysReg.map(day => (<div key={day}>
            <div style={{ background: `linear-gradient(135deg, ${C.accent}22, ${C.purple}11)`, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10, textAlign: "center" }}><span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{day}</span></div>
            {(groupedReg[day]||[]).map(slot => <SlotCard key={slot.id} slot={slot} />)}
          </div>))}
        </div>
      ) : (
        Object.keys(groupedStage).length===0 ? <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 40, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 10 }}>🏕️</div><div style={{ color: C.textMuted }}>Aucun créneau de stage</div></div> :
        Object.entries(groupedStage).sort(([a],[b]) => a.localeCompare(b)).map(([key, grp]) => {
          const plabel = PERIODES.find(p => p[0]===grp.periode)?.[1]||grp.periode;
          return (<div key={key} style={{ marginBottom: 20 }}>
            <div style={{ background: C.orange+"15", border: `1px solid ${C.orange}33`, borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontWeight: 700, color: C.orange, fontSize: 14 }}>{plabel} — Semaine {grp.semaine}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {grp.slots.map(slot => (
                <div key={slot.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, borderLeft: `3px solid ${C.orange}`, cursor: "pointer" }} onClick={() => setSlotDetail(slot)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{(slot.heure_debut||"").substring(0,5)}-{(slot.heure_fin||"").substring(0,5)}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Badge color={C.orange}>Lun→Ven</Badge>
                      <button onClick={e => { e.stopPropagation(); setEditCr(slot); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 12 }}>✏️</button>
                      <button onClick={e => { e.stopPropagation(); deleteCreneau(slot.id); }} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, opacity: 0.5 }}>🗑️</button>
                    </div>
                  </div>
                  <Badge color={(FORFAITS[slot.mode]||{}).c||C.accent}>{(FORFAITS[slot.mode]||{}).l||"Groupe"} · {tarifMode(slot.mode)}€/h</Badge>
                  <div style={{ display: "flex", gap: 2, margin: "8px 0 4px" }}>{Array.from({length:slot.capacite}).map((_,j) => <div key={j} style={{ flex: 1, height: 3, borderRadius: 2, background: j<slot.students.length?C.orange:C.surfaceLight }} />)}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{slot.students.length}/{slot.capacite} inscrits — cliquer pour détails</div>
                </div>
              ))}
            </div>
          </div>);
        })
      )}
      <CreneauModal open={newOpen||!!editCr} onClose={() => { setNewOpen(false); setEditCr(null); }} creneau={editCr} refresh={refresh} />
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 22 }}>💳</span><h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Paiements</h2><Badge color={C.accentLight}>{paiements.length}</Badge></div>
        <Btn onClick={() => setPayOpen(true)} color={C.success}>+ Nouveau règlement</Btn>
      </div>
      {sorted.length===0 ? <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 40, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 10 }}>💰</div><div style={{ color: C.textMuted }}>Aucun paiement</div></div> :
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{["Date","Élève","Montant","Mode","Mois","Note"].map((h,i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>{sorted.map(p => { const el = eleves.find(e => e.id===p.eleve_id); return (<tr key={p.id} style={{ borderBottom: `1px solid ${C.border}11` }}>
              <td style={{ padding: "8px 14px", fontSize: 12, color: C.textMuted }}>{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</td>
              <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: C.text }}>{el?`${el.prenom} ${el.nom}`:p.eleve_id}</td>
              <td style={{ padding: "8px 14px", fontSize: 14, fontWeight: 800, color: C.success }}>{parseFloat(p.montant).toFixed(0)}€</td>
              <td style={{ padding: "8px 14px" }}><Badge color={C.textMuted}>{p.mode_paiement}</Badge></td>
              <td style={{ padding: "8px 14px", fontSize: 12, color: C.textMuted }}>{p.mois_concerne||"—"}</td>
              <td style={{ padding: "8px 14px", fontSize: 12, color: C.textDim }}>{p.commentaire||"—"}</td>
            </tr>); })}</tbody></table>
        </div>}
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} eleves={eleves} preselectedEleve="" refresh={refresh} />
    </div>
  );
};

// ═══ MAIN ═══
const PAGES = [{key:"dashboard",icon:"🏠",label:"Tableau de bord"},{key:"planning",icon:"📋",label:"Planning / Appel"},{key:"eleves",icon:"👥",label:"Élèves"},{key:"creneaux",icon:"📅",label:"Créneaux"},{key:"paiements",icon:"💳",label:"Paiements"}];

export default function App() {
  const [page, setPage] = useState("dashboard"); const [pageParams, setPageParams] = useState({});
  const [eleves, setEleves] = useState([]); const [creneaux, setCreneaux] = useState([]); const [affectations, setAffectations] = useState([]); const [suiviMensuel, setSuiviMensuel] = useState([]); const [paiements, setPaiements] = useState([]); const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const [sidebarOpen, setSidebarOpen] = useState(true);
  const loadData = useCallback(async () => { try { const [e,c,a,sm,p,pr] = await Promise.all([api.get("eleves"),api.get("creneaux"),api.get("affectations_creneaux"),api.get("suivi_mensuel"),api.get("paiements"),api.get("presences")]); setEleves(e||[]); setCreneaux(c||[]); setAffectations(a||[]); setSuiviMensuel(sm||[]); setPaiements(p||[]); setPresences(pr||[]); setError(null); } catch(err) { setError(err.message); } setLoading(false); }, []);
  useEffect(() => { loadData(); }, [loadData]);
  const nav = (p, params={}) => { setPage(p); setPageParams(params); };
  const renderPage = () => {
    if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: C.textMuted }}>⏳ Chargement...</div>;
    if (error) return <div style={{ background: C.danger+"22", borderRadius: 14, padding: 24, textAlign: "center" }}><div style={{ color: C.danger, marginBottom: 10 }}>{error}</div><Btn onClick={loadData}>Réessayer</Btn></div>;
    switch(page) {
      case "dashboard": return <DashboardPage eleves={eleves} creneaux={creneaux} affectations={affectations} suiviMensuel={suiviMensuel} paiements={paiements} presences={presences} onNavigate={nav} />;
      case "planning": return <PlanningPage creneaux={creneaux} affectations={affectations} eleves={eleves} presences={presences} refresh={loadData} initialDate={pageParams.date} />;
      case "eleves": return <ElevesPage eleves={eleves} creneaux={creneaux} affectations={affectations} suiviMensuel={suiviMensuel} paiements={paiements} presences={presences} refresh={loadData} initialAction={pageParams.action} initialOpenId={pageParams.openId} />;
      case "creneaux": return <CreneauxPage creneaux={creneaux} affectations={affectations} eleves={eleves} refresh={loadData} />;
      case "paiements": return <PaiementsPage eleves={eleves} paiements={paiements} refresh={loadData} />;
      default: return null;
    }
  };
  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'Outfit','Segoe UI',system-ui,sans-serif", color: C.text, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <aside style={{ width: sidebarOpen?240:64, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "width 0.3s", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: sidebarOpen?"16px":"16px 8px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, minHeight: 60 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎓</div>
          {sidebarOpen && <div><div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>Bulles de Savoir</div><div style={{ fontSize: 10, color: C.textMuted }}><span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: error?C.danger:C.success, marginRight: 4 }} />{error?"Hors ligne":"Connecté"}</div></div>}
        </div>
        <nav style={{ flex: 1, padding: "10px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
          {PAGES.map(p => (<button key={p.key} onClick={() => { setPage(p.key); setPageParams({}); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: sidebarOpen?"9px 12px":"9px 0", borderRadius: 8, border: "none", cursor: "pointer", background: page===p.key?C.accent+"22":"transparent", color: page===p.key?C.accentLight:C.textMuted, justifyContent: sidebarOpen?"flex-start":"center", width: "100%" }}><span style={{ fontSize: 16 }}>{p.icon}</span>{sidebarOpen&&<span style={{ fontSize: 13, fontWeight: page===p.key?700:500 }}>{p.label}</span>}</button>))}
        </nav>
        <div style={{ padding: sidebarOpen?"12px 16px":"12px 8px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.success}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>HB</div>
          {sidebarOpen&&<div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>Hassan</div>}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: 10, border: "none", borderTop: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", color: C.textMuted }}>{sidebarOpen?"◀":"▶"}</button>
      </aside>
      <main style={{ flex: 1, overflow: "auto", padding: 24 }}><div style={{ maxWidth: 1100, margin: "0 auto" }}>{renderPage()}</div></main>
    </div>
  );
}
