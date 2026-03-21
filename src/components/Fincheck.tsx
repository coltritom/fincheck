"use client";

import { useState, useEffect, useRef } from "react";
import { C, QUESTIONS, DIMS, ACTION_PLANS, STANDARDS, UPSELL_FEATURES, CHECKOUT_FEATURES } from "@/lib/data";
import { calcScores, getInterpretation, getPriorityAction, getAlertExplanation, getUrgencyLabel } from "@/lib/scoring";
import type { ScoreResult } from "@/lib/scoring";
import { saveDiagnostico, loadDiagnostico } from "@/lib/actions";
import ContactModal from "./ContactModal";
import { sendEmail } from "@/lib/email";

// ═══ SMALL UI COMPONENTS ═══

function GlowOrb({ c, sz, t, le, op }: { c: string; sz: number; t: string; le: string; op?: number }) {
  return <div style={{ position: "absolute", width: sz, height: sz, borderRadius: "50%", background: "radial-gradient(circle," + c + " 0%,transparent 70%)", top: t, left: le, opacity: op || 0.2, filter: "blur(40px)", pointerEvents: "none" as const, zIndex: 0 }} />;
}

function CheckIcon({ sz, c }: { sz?: number; c?: string }) {
  return <svg width={sz || 12} height={sz || 12} viewBox="0 0 24 24" fill="none" stroke={c || "#fff"} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

function ArrowLeft() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>;
}

function WarnIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.rd} strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}

function PulseIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
}

function RadarChart({ dsc, sv, sz }: { dsc: Record<string, number>; sv: boolean; sz?: number }) {
  const size = sz || 260;
  const cx = size / 2, cy = size / 2, rd = size / 2 - 40, n = DIMS.length, step = (2 * Math.PI) / n;
  const pts: Array<{ x: number; y: number; lx: number; ly: number; lb: string; vl: number }> = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step, vl = (dsc[DIMS[i].k] || 0) / 10;
    pts.push({ x: cx + rd * vl * Math.cos(a), y: cy + rd * vl * Math.sin(a), lx: cx + (rd + 24) * Math.cos(a), ly: cy + (rd + 24) * Math.sin(a), lb: DIMS[i].l, vl: dsc[DIMS[i].k] });
  }
  const grids = [0.25, 0.5, 0.75, 1].map(function (lv, li) {
    const gp: string[] = [];
    for (let j = 0; j < n; j++) { const ga = -Math.PI / 2 + j * step; gp.push((cx + rd * lv * Math.cos(ga)) + "," + (cy + rd * lv * Math.sin(ga))); }
    return <polygon key={li} points={gp.join(" ")} fill="none" stroke={C.bd} strokeWidth="1" />;
  });
  const axes = [];
  for (let k = 0; k < n; k++) { const aa = -Math.PI / 2 + k * step; axes.push(<line key={k} x1={cx} y1={cy} x2={cx + rd * Math.cos(aa)} y2={cy + rd * Math.sin(aa)} stroke={C.bd} strokeWidth="1" />); }
  const pp = pts.map(function (pt) { return pt.x + "," + pt.y; }).join(" ");
  const dots: React.ReactElement[] = [];
  for (let m = 0; m < pts.length; m++) {
    const pt = pts[m];
    dots.push(<circle key={"c" + m} cx={pt.x} cy={pt.y} r="4" fill={C.cy} />);
    dots.push(<text key={"t" + m} x={pt.lx} y={pt.ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={C.mu}>{pt.lb}</text>);
    if (sv) dots.push(<text key={"v" + m} x={pt.x} y={pt.y - 13} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ic}>{pt.vl.toFixed(1)}</text>);
  }
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
      <defs>
        <linearGradient id="rf2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.cy} stopOpacity={0.2} /><stop offset="100%" stopColor={C.mg} stopOpacity={0.15} /></linearGradient>
        <linearGradient id="rs2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.cy} /><stop offset="100%" stopColor={C.mg} /></linearGradient>
      </defs>
      {grids}{axes}
      <polygon points={pp} fill="url(#rf2)" stroke="url(#rs2)" strokeWidth="2" />
      {dots}
    </svg>
  );
}

function ScoreGauge({ sc, co, sz }: { sc: number; co: string; sz?: number }) {
  const size = sz || 200, sw = 12, r2 = (size - sw) / 2, ci = 2 * Math.PI * r2, ac = ci * 0.75, of = ac - (ac * Math.min(sc, 100)) / 100;
  const gd = "gg2" + sc;
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ transform: "rotate(135deg)" }}>
      <defs><linearGradient id={gd} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.cy} /><stop offset="100%" stopColor={co} /></linearGradient></defs>
      <circle cx={size / 2} cy={size / 2} r={r2} fill="none" stroke={C.bd} strokeWidth={sw} strokeDasharray={ac + " " + ci} strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r={r2} fill="none" stroke={"url(#" + gd + ")"} strokeWidth={sw} strokeDasharray={ac + " " + ci} strokeDashoffset={of} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
    </svg>
  );
}

function DimBar({ l, v, sh }: { l: string; v: number; sh: boolean }) {
  const pc = (v / 10) * 100;
  let co = C.rd;
  if (v >= 7) co = C.gn; else if (v >= 5) co = C.yw; else if (v >= 3) co = C.or;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: C.wh, fontWeight: 500 }}>{l}</span>
        {sh ? <span style={{ fontSize: 13, fontWeight: 700, color: co }}>{v.toFixed(1)}/10</span> : <span style={{ fontSize: 11, color: C.mu }}>• • •</span>}
      </div>
      <div style={{ height: 6, background: C.bd, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pc + "%", background: sh ? co : C.mu, borderRadius: 3, transition: "width 1s ease-out", opacity: sh ? 1 : 0.4 }} />
      </div>
    </div>
  );
}

// ═══ MAIN APP ═══

export default function Fincheck() {
  const [sc, setSc] = useState(0);
  const [cq, setCq] = useState(0);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [res, setRes] = useState<ScoreResult | null>(null);
  const [nm, setNm] = useState("");
  const [em, setEm] = useState("");
  const [fd, setFd] = useState(true);
  const [modal, setModal] = useState(false);
  const [diagId, setDiagId] = useState<string | null>(null);
  const tr = useRef<HTMLDivElement>(null);

useEffect(function () {
    var params = new URLSearchParams(window.location.search);
    var diagParam = params.get("diag");
    var pagoParam = params.get("pago");
    if (diagParam) {
      loadDiagnostico(diagParam).then(function (data) {
        if (data) {
          setNm(data.nombre);
          setEm(data.email);
          setDiagId(diagParam);
          var rangoColors: Record<string, string> = {
            critico: C.rd, fragil: C.or, inestable: C.yw, ordenado: C.cy, solido: C.gn
          };
          var rangoLabels: Record<string, string> = {
            critico: "Crítico", fragil: "Frágil", inestable: "Inestable pero recuperable", ordenado: "Ordenado con alertas", solido: "Sólido"
          };
          var result = {
            ds: data.scores_dimensiones,
            fin: data.score_final,
            al: data.alertas_criticas || [],
            rg: data.rango,
            co: rangoColors[data.rango] || C.cy,
            lb: rangoLabels[data.rango] || data.rango,
          };
          setRes(result);
          if (pagoParam === "ok" || data.compro_premium) {
            setSc(5);
            if (pagoParam === "ok") {
              sendEmail("resultado_premium", data.email, data.nombre, data.score_final, data.rango, rangoLabels[data.rango] || data.rango, data.alertas_criticas || [], rangoColors[data.rango] || C.cy, data.scores_dimensiones, diagParam || undefined).then(function (ok) {
                console.log("Email premium enviado:", ok);
              });
            }
          } else {
            setSc(3);
          }
        }
      });
    }
  }, []);

  function go(s: number) { setFd(false); setTimeout(function () { setSc(s); setFd(true); }, 200); }
  useEffect(function () { if (tr.current) tr.current.scrollIntoView({ behavior: "smooth" }); }, [sc, cq]);

  function pk(qi: number, oi: number) {
    const n: Record<number, number> = {};
    for (const k in ans) n[Number(k)] = ans[Number(k)];
    n[qi] = oi;
    setAns(n);
    if (qi < QUESTIONS.length - 1) setTimeout(function () { setCq(qi + 1); }, 250);
  }

  const ac = Object.keys(ans).length;
  const done = ac === QUESTIONS.length;

  const wrapStyle: React.CSSProperties = { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, opacity: fd ? 1 : 0, transition: "opacity 0.2s", position: "relative", overflow: "hidden" };
  const cardStyle: React.CSSProperties = { background: C.sf, borderRadius: 16, padding: 24, border: "1px solid " + C.bd, marginBottom: 16 };
  const btnPrimary: React.CSSProperties = { background: "linear-gradient(135deg," + C.cy + "," + C.mg + ")", color: "#fff", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%" };
  const btnGhost: React.CSSProperties = { background: "transparent", border: "1.5px solid " + C.bl, color: C.mu, borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" };

  function renderLogo(text?: string) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={function () { go(0); setCq(0); setAns({}); setRes(null); setDiagId(null); }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg," + C.cy + "," + C.mg + ")", display: "flex", alignItems: "center", justifyContent: "center" }}><PulseIcon /></div>
        <span style={{ fontSize: 15, fontWeight: 800, color: C.ic }}>{text || "Fincheq"}</span>
      </div>
    );
  }

  function renderFooter() {
    return <div style={{ borderTop: "1px solid " + C.bd, padding: "20px 24px", textAlign: "center", position: "relative", zIndex: 1 }}><p style={{ fontSize: 11, color: C.mu, margin: 0 }}>fincheq es una herramienta de <strong style={{ color: C.ic }}>SECRITO Consulting</strong></p></div>;
  }

    function handleSubmitDiagnostico() {
    const r = calcScores(ans);
    setRes(r);
    console.log("Intentando guardar diagnóstico...");
    saveDiagnostico(nm, em, ans, r).then(function (id) {
      console.log("Resultado de guardado:", id);
      if (id) {
        setDiagId(id);
        sendEmail("resultado_gratis", em, nm, r.fin, r.rg, r.lb, r.al, r.co, r.ds, id).then(function (ok) {
          console.log("Email enviado:", ok);
        });
      }
    }).catch(function (err) {
      console.error("Error en saveDiagnostico:", err);
    });
    go(3);
  }

  function handleCheckout() {
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosticoId: diagId, email: em, nombre: nm }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.init_point) {
          window.location.href = data.init_point;
        } else {
          console.error("Error en checkout:", data);
          alert("Hubo un error al procesar el pago. Intentá de nuevo.");
        }
      })
      .catch(function (err) {
        console.error("Error en checkout:", err);
        alert("Hubo un error. Intentá de nuevo.");
      });
  }

  // ════════════════════════════
  // SCREEN 0: LANDING
  // ════════════════════════════
  if (sc === 0) return (
    <div style={wrapStyle} ref={tr}>
      <GlowOrb c={C.cy} sz={300} t="-80px" le="-60px" op={0.15} /><GlowOrb c={C.mg} sz={250} t="200px" le="250px" op={0.12} />
      <div style={{ padding: "16px 24px", borderBottom: "1px solid " + C.bd, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
        {renderLogo()}<span style={{ fontSize: 11, color: C.mu, letterSpacing: "0.05em" }}>DIAGNÓSTICO</span>
      </div>
      <div style={{ padding: "52px 24px 36px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 28 }}><span style={{ display: "inline-block", background: C.cyg, color: C.cy, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>DIAGNÓSTICO GRATUITO</span></div>
        <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.12, color: C.ic, margin: "0 0 18px" }}>¿Tu negocio está sano o estás perdiendo plata <span style={{ background: "linear-gradient(135deg," + C.cy + "," + C.mg + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>sin darte cuenta?</span></h1>
        <p style={{ fontSize: 16, color: C.mu, lineHeight: 1.6, margin: "0 0 36px" }}>Respondé 14 preguntas simples y recibí un diagnóstico financiero con score, alertas y recomendaciones. Gratis, en menos de 5 minutos.</p>
        <button style={btnPrimary} onClick={function () { go(1); }}>Diagnosticá tu negocio gratis →</button>
        <p style={{ fontSize: 12, color: C.mu, textAlign: "center", marginTop: 14 }}>Sin registrarte · Sin datos sensibles · 5 minutos</p>
      </div>
      <div style={{ padding: "0 24px 44px", position: "relative", zIndex: 1 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.cy, margin: "0 0 18px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cómo funciona</p>
          {[{ n: "01", t: "Respondé 14 preguntas", d: "Sobre flujo de caja, rentabilidad, deudas y más." }, { n: "02", t: "Recibí tu score y alertas", d: "Un diagnóstico de 0 a 100 con alertas críticas." }, { n: "03", t: "Sabé qué corregir primero", d: "Recomendaciones concretas para actuar esta semana." }].map(function (s, i) {
            return <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 2 ? 20 : 0 }}><div style={{ minWidth: 38, height: 38, borderRadius: 10, background: C.cyg, border: "1px solid " + C.cyd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: C.cy }}>{s.n}</div><div><p style={{ fontSize: 14, fontWeight: 700, color: C.wh, margin: "0 0 3px" }}>{s.t}</p><p style={{ fontSize: 13, color: C.mu, margin: 0, lineHeight: 1.5 }}>{s.d}</p></div></div>;
          })}
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mg, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Qué vas a descubrir</p>
          {["Qué tan sano está tu flujo de caja", "Si estás perdiendo plata sin saberlo", "Si tu deuda es manejable o peligrosa", "Si tus precios cubren todos tus costos", "Qué deberías corregir primero"].map(function (t, i) {
            return <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><div style={{ minWidth: 20, height: 20, borderRadius: 6, background: C.mgg, border: "1px solid " + C.mgd, display: "flex", alignItems: "center", justifyContent: "center" }}><CheckIcon c={C.mg} sz={11} /></div><span style={{ fontSize: 13, color: C.ml }}>{t}</span></div>;
          })}
        </div>
        <div style={{ background: "linear-gradient(135deg," + C.cyg + "," + C.mgg + ")", borderRadius: 16, padding: 24, border: "1px solid " + C.cyd, marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.ic, margin: "0 0 6px" }}>Un diagnóstico serio, no un quiz de internet</p>
          <p style={{ fontSize: 13, color: C.ml, margin: 0, lineHeight: 1.6 }}>Basado en indicadores financieros reales. Diseñado por consultores especializados en pymes.</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.cy, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Por qué confiar en fincheq</p>
          {["Basado en 7 indicadores financieros reales: liquidez, rentabilidad, cobranzas, endeudamiento, precios, orden y concentración", "Incluye sistema de alertas críticas con penalizaciones para que ningún problema grave quede oculto", "Desarrollado por SECRITO Consulting, consultora especializada en gestión financiera de pymes", "Tus datos son confidenciales y no se comparten con terceros"].map(function (t, i) {
            return <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 3 ? 14 : 0 }}><div style={{ minWidth: 20, height: 20, borderRadius: 6, background: C.cyg, border: "1px solid " + C.cyd, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}><CheckIcon c={C.cy} sz={11} /></div><span style={{ fontSize: 13, color: C.ml, lineHeight: 1.55 }}>{t}</span></div>;
          })}
        </div>
      </div>
      {renderFooter()}
    </div>
  );

  // ════════════════════════════
  // SCREEN 1: QUIZ
  // ════════════════════════════
  if (sc === 1) {
    const q = QUESTIONS[cq], pp = (ac / QUESTIONS.length) * 100;
    return (
      <div style={wrapStyle} ref={tr}>
        <GlowOrb c={C.cy} sz={200} t="-60px" le="300px" op={0.1} />
        <div style={{ padding: "16px 24px", borderBottom: "1px solid " + C.bd, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={function () { go(0); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, color: C.mu, fontSize: 13 }}><ArrowLeft /> Inicio</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ic }}>{cq + 1} <span style={{ color: C.mu, fontWeight: 400 }}>/ {QUESTIONS.length}</span></span>
          </div>
          <div style={{ height: 3, background: C.bd, borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: pp + "%", background: "linear-gradient(90deg," + C.cy + "," + C.mg + ")", borderRadius: 2, transition: "width 0.4s ease" }} /></div>
        </div>
        <div style={{ padding: "32px 24px", position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.cy, textTransform: "uppercase", letterSpacing: "0.08em" }}>{q.dm}</span>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: C.ic, lineHeight: 1.4, margin: "10px 0 28px" }}>{q.q}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.o.map(function (opt, oi) {
              const sel = ans[cq] === oi;
              return <button key={oi} onClick={function () { pk(cq, oi); }} style={{ padding: "16px 18px", borderRadius: 12, border: "1.5px solid " + (sel ? C.cy : C.bd), background: sel ? C.cyg : C.sf, cursor: "pointer", textAlign: "left", fontSize: 14, color: sel ? C.ic : C.ml, fontWeight: sel ? 600 : 400, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12 }}><div style={{ minWidth: 22, height: 22, borderRadius: 7, border: "2px solid " + (sel ? C.cy : C.bl), background: sel ? C.cy : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{sel ? <CheckIcon c="#fff" sz={12} /> : null}</div>{opt}</button>;
            })}
          </div>
          {cq > 0 ? <button onClick={function () { setCq(cq - 1); }} style={{ ...btnGhost, marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><ArrowLeft /> Volver a la pregunta anterior</button> : null}
          {done ? <button style={{ ...btnPrimary, marginTop: 20 }} onClick={function () { go(2); }}>Ver mi resultado →</button> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 7, padding: "16px 24px 32px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {QUESTIONS.map(function (_, i) {
            const aw = ans[i] !== undefined, at = i === cq;
            return <button key={i} onClick={function () { setCq(i); }} style={{ width: at ? 12 : 9, height: at ? 12 : 9, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: at ? "linear-gradient(135deg," + C.cy + "," + C.mg + ")" : aw ? C.cy : C.bl, transition: "all 0.2s", boxShadow: at ? "0 0 8px " + C.cy + "60" : "none", opacity: (aw || at) ? 1 : 0.5 }} title={"P" + (i + 1)} />;
          })}
        </div>
      </div>
    );
  }

  // ════════════════════════════
  // SCREEN 2: LEAD CAPTURE
  // ════════════════════════════
  if (sc === 2) {
    const ok = nm.length > 0 && em.length > 0;
    return (
      <div style={wrapStyle} ref={tr}>
        <GlowOrb c={C.mg} sz={250} t="50px" le="300px" op={0.12} />
        <div style={{ padding: "16px 24px", borderBottom: "1px solid " + C.bd, display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>{renderLogo()}</div>
        <div style={{ padding: "48px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg," + C.cyg + "," + C.mgg + ")", border: "1px solid " + C.cyd, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.cy} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg></div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.ic, margin: "0 0 8px" }}>Tu diagnóstico está listo</h2>
            <p style={{ fontSize: 15, color: C.mu, margin: 0 }}>Ingresá tu nombre y email para ver el resultado.</p>
          </div>
          <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.ml, display: "block", marginBottom: 6 }}>Nombre</label><input value={nm} onChange={function (e) { setNm(e.target.value); }} placeholder="Tu nombre" style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "1.5px solid " + C.bd, fontSize: 15, outline: "none", boxSizing: "border-box", background: C.sf, color: C.ic }} /></div>
          <div style={{ marginBottom: 24 }}><label style={{ fontSize: 12, fontWeight: 600, color: C.ml, display: "block", marginBottom: 6 }}>Email</label><input value={em} onChange={function (e) { setEm(e.target.value); }} placeholder="tu@email.com" type="email" style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "1.5px solid " + C.bd, fontSize: 15, outline: "none", boxSizing: "border-box", background: C.sf, color: C.ic }} /></div>
          <button style={{ ...btnPrimary, opacity: ok ? 1 : 0.4 }} onClick={function () { if (ok) handleSubmitDiagnostico(); }}>Ver mi diagnóstico →</button>
          <p style={{ fontSize: 11, color: C.mu, textAlign: "center", marginTop: 14 }}>Tus datos son confidenciales.</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════
  // SCREEN 3: FREE RESULT
  // ════════════════════════════
  if (sc === 3 && res) {
    const ds = res.ds;
    return (
      <div style={wrapStyle} ref={tr}>
        <ContactModal show={modal} onClose={function () { setModal(false); }} prefillName={nm} prefillEmail={em} result={res} diagnosticoId={diagId} />
        <GlowOrb c={res.co} sz={300} t="-80px" le="100px" op={0.12} />
        <div style={{ padding: "16px 24px", borderBottom: "1px solid " + C.bd, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
          {renderLogo("fincheq")}
          <span style={{ display: "inline-block", background: res.co + "20", color: res.co, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{res.lb}</span>
        </div>
        <div style={{ padding: "32px 24px", position: "relative", zIndex: 1 }}>
          {/* Score gauge */}
          <div style={{ textAlign: "center", marginBottom: 12 }}><div style={{ position: "relative", display: "inline-block" }}><ScoreGauge sc={res.fin} co={res.co} sz={200} /><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-40%)", textAlign: "center" }}><span style={{ fontSize: 48, fontWeight: 800, color: res.co, lineHeight: 1 }}>{res.fin}</span><span style={{ display: "block", fontSize: 14, color: C.mu }}>/100</span></div></div></div>

          <div style={cardStyle}><h3 style={{ fontSize: 16, fontWeight: 700, color: C.ic, margin: "0 0 8px" }}>Tu negocio: {res.lb}</h3><p style={{ fontSize: 14, color: C.mu, margin: 0, lineHeight: 1.65 }}>{getInterpretation(res.rg)}</p></div>

          {res.al.length > 0 ? <div style={{ background: C.rdb, borderRadius: 16, padding: 24, border: "1px solid " + C.rd + "25", marginBottom: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><WarnIcon /><span style={{ fontSize: 13, fontWeight: 700, color: C.rd }}>Alertas críticas</span></div>{res.al.slice(0, 2).map(function (a, i) { return <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < 1 ? 8 : 0 }}><span style={{ fontSize: 13 }}>⚠️</span><p style={{ fontSize: 13, color: C.rd, margin: 0, lineHeight: 1.6 }}>{a}</p></div>; })}{res.al.length > 2 ? <p style={{ fontSize: 11, color: C.rd, margin: "8px 0 0", fontWeight: 600 }}>+{res.al.length - 2} alerta más en el premium</p> : null}</div> : null}

          <div style={cardStyle}><p style={{ fontSize: 11, fontWeight: 700, color: C.cy, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tus 7 dimensiones</p><p style={{ fontSize: 12, color: C.mu, margin: "0 0 12px" }}>Scores detallados en el reporte premium</p><div style={{ display: "flex", justifyContent: "center" }}><RadarChart dsc={ds} sv={false} sz={250} /></div></div>

          <div style={cardStyle}><p style={{ fontSize: 13, fontWeight: 700, color: C.ic, margin: "0 0 14px" }}>Resumen por dimensión</p>{DIMS.map(function (d, i) { return <DimBar key={i} l={d.l} v={ds[d.k]} sh={false} />; })}<div style={{ marginTop: 10, padding: "10px 14px", background: C.cyg, borderRadius: 10, border: "1px solid " + C.cyd }}><p style={{ fontSize: 12, color: C.cy, margin: 0, fontWeight: 600, textAlign: "center" }}>🔒 Desbloqueá los scores en el reporte premium</p></div></div>

          <div style={cardStyle}><p style={{ fontSize: 11, fontWeight: 700, color: C.cy, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tu acción prioritaria esta semana</p><div style={{ padding: "14px 16px", background: C.sl, borderRadius: 10, borderLeft: "3px solid " + C.cy }}><p style={{ fontSize: 14, color: C.ml, margin: 0, lineHeight: 1.65, fontWeight: 500 }}>{getPriorityAction(ds)}</p></div></div>

          <button onClick={function () { window.open("/api/pdf?id=" + diagId + "&tipo=free", "_blank"); }} style={{ ...btnGhost, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Descargar diagnóstico en PDF</button>

          {/* Upsell */}
          <div style={{ background: "linear-gradient(145deg," + C.sf + " 0%,#0A0A18 100%)", borderRadius: 16, padding: 28, border: "1px solid " + C.cyd, marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle at top right," + C.mg + "12,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.mg }}>Reporte Premium</span>
              <h3 style={{ fontSize: 21, fontWeight: 800, margin: "8px 0 16px", lineHeight: 1.25, color: C.ic }}>¿Querés saber exactamente qué hacer y en qué orden?</h3>
              {UPSELL_FEATURES.map(function (t, i) { return <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><CheckIcon c={C.gn} sz={15} /><span style={{ fontSize: 13, color: C.ml }}>{t}</span></div>; })}
              <div style={{ margin: "24px 0 20px", padding: 16, borderRadius: 12, textAlign: "center", background: "linear-gradient(135deg," + C.cyg + "," + C.mgg + ")", border: "1px solid " + C.bl }}><span style={{ fontSize: 34, fontWeight: 800, color: C.ic }}>USD 9<span style={{ fontSize: 22 }}>.99</span></span><span style={{ fontSize: 13, color: C.mu, marginLeft: 8 }}>pago único</span></div>
              <button onClick={function () { go(4); }} style={{ background: "#fff", color: C.bg, border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 800, cursor: "pointer", width: "100%" }}>Quiero mi plan de acción completo</button>
              <p style={{ fontSize: 11, textAlign: "center", color: C.mu, marginTop: 10, marginBottom: 0 }}>Acceso inmediato · Pago seguro con MercadoPago</p>
            </div>
          </div>

          {(res.rg === "critico" || res.rg === "fragil") ? <div style={{ background: C.orb, borderRadius: 16, padding: 24, border: "1px solid " + C.or + "25", marginBottom: 16 }}><p style={{ fontSize: 14, fontWeight: 700, color: C.or, margin: "0 0 6px" }}>¿Tu situación necesita atención profesional?</p><p style={{ fontSize: 13, color: C.mu, margin: "0 0 14px", lineHeight: 1.55 }}>Podemos ayudarte con un análisis sobre tus números reales.</p><button onClick={function () { setModal(true); }} style={{ ...btnGhost, borderColor: C.or + "50", color: C.or, fontSize: 13 }}>Quiero hablar con un especialista →</button></div> : null}
        </div>
        {renderFooter()}
      </div>
    );
  }

  // ════════════════════════════
  // SCREEN 4: CHECKOUT
  // ════════════════════════════
  if (sc === 4) return (
    <div style={wrapStyle} ref={tr}>
      <GlowOrb c={C.cy} sz={200} t="100px" le="350px" op={0.1} />
      <div style={{ padding: "16px 24px", borderBottom: "1px solid " + C.bd, position: "relative", zIndex: 1 }}><button onClick={function () { go(3); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, color: C.mu, fontSize: 13 }}><ArrowLeft /> Volver al resultado</button></div>
      <div style={{ padding: "40px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}><h2 style={{ fontSize: 24, fontWeight: 800, color: C.ic, margin: "0 0 8px" }}>Completá tu compra</h2><p style={{ fontSize: 15, color: C.mu, margin: 0 }}>Reporte Premium — Pago único</p></div>
        <div style={{ background: C.sf, borderRadius: 16, padding: 24, border: "1px solid " + C.cyd }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid " + C.bd }}><div><p style={{ fontSize: 15, fontWeight: 700, color: C.ic, margin: 0 }}>Reporte Premium</p><p style={{ fontSize: 13, color: C.mu, margin: "2px 0 0" }}>fincheq</p></div><span style={{ fontSize: 24, fontWeight: 800, background: "linear-gradient(135deg," + C.cy + "," + C.mg + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>USD 9.99</span></div>
          <div style={{ fontSize: 13, color: C.mu, lineHeight: 1.7, marginBottom: 20 }}>{CHECKOUT_FEATURES.map(function (t, i) { return <p key={i} style={{ margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}><CheckIcon c={C.gn} sz={14} />{t}</p>; })}</div>
          <div style={{ padding: 20, background: C.sl, borderRadius: 12, textAlign: "center", marginBottom: 16, border: "1px solid " + C.bd }}><div style={{ display: "inline-flex", padding: "8px 20px", borderRadius: 8, background: "#009EE3" }}><span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>MercadoPago</span></div><p style={{ fontSize: 12, color: C.mu, margin: "10px 0 0" }}>Tarjeta · Transferencia · Efectivo</p></div>
          <button onClick={function () { handleCheckout(); }} style={btnPrimary}>Pagar USD 9.99 — Acceso inmediato</button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════
  // SCREEN 5: PREMIUM RESULT
  // ════════════════════════════
  if (sc === 5 && res) {
    const dso = DIMS.slice().sort(function (a, b) { return res.ds[a.k] - res.ds[b.k]; });
    return (
      <div style={wrapStyle} ref={tr}>
        <ContactModal show={modal} onClose={function () { setModal(false); }} prefillName={nm} prefillEmail={em} result={res} diagnosticoId={diagId} />
        <GlowOrb c={C.cy} sz={250} t="-50px" le="-40px" op={0.12} /><GlowOrb c={C.mg} sz={200} t="500px" le="300px" op={0.1} />
        <div style={{ padding: "16px 24px", borderBottom: "1px solid " + C.bd, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
          {renderLogo("Reporte Premium")}
          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, color: C.ic, background: "linear-gradient(135deg," + C.cyg + "," + C.mgg + ")", border: "1px solid " + C.cyd }}>★ PREMIUM</span>
        </div>
        <div style={{ padding: "28px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}><div style={{ position: "relative", display: "inline-block" }}><ScoreGauge sc={res.fin} co={res.co} sz={170} /><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-40%)", textAlign: "center" }}><span style={{ fontSize: 40, fontWeight: 800, color: res.co, lineHeight: 1 }}>{res.fin}</span><span style={{ display: "block", fontSize: 12, color: C.mu }}>/100</span></div></div><p style={{ fontSize: 16, fontWeight: 700, color: res.co, margin: "4px 0 0" }}>{res.lb}</p></div>

          <div style={cardStyle}><p style={{ fontSize: 11, fontWeight: 700, color: C.cy, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mapa completo</p><div style={{ display: "flex", justifyContent: "center" }}><RadarChart dsc={res.ds} sv={true} sz={270} /></div></div>

          <div style={cardStyle}><p style={{ fontSize: 13, fontWeight: 700, color: C.ic, margin: "0 0 14px" }}>Scores por dimensión</p>{DIMS.map(function (d, i) { return <DimBar key={i} l={d.l} v={res.ds[d.k]} sh={true} />; })}</div>

          {res.al.length > 0 ? <div style={{ background: C.rdb, borderRadius: 16, padding: 24, border: "1px solid " + C.rd + "25", marginBottom: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><WarnIcon /><span style={{ fontSize: 13, fontWeight: 700, color: C.rd }}>Alertas críticas ({res.al.length})</span></div>{res.al.map(function (a, i) { return <div key={i} style={{ marginBottom: i < res.al.length - 1 ? 12 : 0, padding: "12px 14px", background: C.rd + "08", borderRadius: 10, border: "1px solid " + C.rd + "15" }}><p style={{ fontSize: 13, color: C.rd, margin: 0, lineHeight: 1.6, fontWeight: 600 }}>⚠️ {a}</p><p style={{ fontSize: 12, color: C.mu, margin: "6px 0 0", lineHeight: 1.55 }}>{getAlertExplanation(a)}</p></div>; })}</div> : null}

          <div style={cardStyle}><p style={{ fontSize: 11, fontWeight: 700, color: C.mg, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Orden de prioridad</p>{dso.slice(0, 3).map(function (d, i) { const vl = res.ds[d.k]; const urg = getUrgencyLabel(vl); return <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, padding: "14px 16px", background: C.sl, borderRadius: 12, border: "1px solid " + C.bd }}><div style={{ minWidth: 38, height: 38, borderRadius: 10, background: urg.color + "15", border: "1px solid " + urg.color + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: urg.color }}>#{i + 1}</div><div><p style={{ fontSize: 14, fontWeight: 700, color: C.ic, margin: 0 }}>{d.l}</p><div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}><span style={{ fontSize: 13, fontWeight: 700, color: urg.color }}>{vl.toFixed(1)}/10</span><span style={{ display: "inline-block", background: urg.color + "18", color: urg.color, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{urg.label}</span></div></div></div>; })}</div>

          <div style={cardStyle}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.cy, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Plan de acción</p>
            {ACTION_PLANS.map(function (b, bi) { return <div key={bi} style={{ marginBottom: bi < 2 ? 22 : 0 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: b.color }} /><span style={{ fontSize: 14, fontWeight: 700, color: C.ic }}>Próximos {b.period}</span></div>{b.items.map(function (item, ii) { return <div key={ii} style={{ display: "flex", gap: 10, marginBottom: 8, paddingLeft: 18 }}><div style={{ minWidth: 18, height: 18, borderRadius: 5, border: "1.5px solid " + C.bl, marginTop: 1 }} /><span style={{ fontSize: 13, color: C.ml, lineHeight: 1.55 }}>{item}</span></div>; })}</div>; })}
          </div>

          <div style={cardStyle}><p style={{ fontSize: 11, fontWeight: 700, color: C.cy, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Estándares de referencia</p>{STANDARDS.map(function (st, i) { const ok = res.ds[st.dimKey] >= 7; return <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 2 ? "1px solid " + C.bd : "none" }}><div><p style={{ fontSize: 13, fontWeight: 600, color: C.ic, margin: 0 }}>{st.l}</p><p style={{ fontSize: 11, color: C.mu, margin: "2px 0 0" }}>Buena práctica: {st.s}</p></div><span style={{ fontSize: 11, fontWeight: 700, color: ok ? C.gn : C.or }}>{ok ? "Dentro del rango" : "Por debajo"}</span></div>; })}</div>

          <button onClick={function () { window.open("/api/pdf?id=" + diagId + "&tipo=premium", "_blank"); }} style={{ ...btnPrimary, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Descargar Reporte Premium en PDF</button>

          {/* CTA Consultora — white card */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 24, border: "none", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg," + C.cy + "," + C.mg + ")" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 180, height: 180, background: "radial-gradient(circle at bottom right, #008efe12, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 40, left: -30, width: 120, height: 120, background: "radial-gradient(circle, #fe26fe08, transparent 70%)", pointerEvents: "none" }} />
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#008efe", margin: "0 0 8px", position: "relative", zIndex: 1 }}>Siguiente paso</p>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 10px", lineHeight: 1.3, color: "#0A0A14", position: "relative", zIndex: 1 }}>¿Necesitás acompañamiento?</h3>
            <p style={{ fontSize: 13, color: "#555770", margin: "0 0 20px", lineHeight: 1.55, position: "relative", zIndex: 1 }}>Agendá una llamada gratuita de 15 minutos. Revisamos tu diagnóstico juntos.</p>
            <button onClick={function () { setModal(true); }} style={{ background: "linear-gradient(135deg, #008efe, #fe26fe)", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", position: "relative", zIndex: 1 }}>Quiero hablar con un especialista →</button>
          </div>
        </div>
        {renderFooter()}
      </div>
    );
  }

  return <div style={wrapStyle}><p style={{ color: C.mu, padding: 40, textAlign: "center" }}>Cargando...</p></div>;
}