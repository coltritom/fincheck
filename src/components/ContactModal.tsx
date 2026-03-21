"use client";

import { useState, useEffect, useRef } from "react";
import { C, RUBROS, EMPLEADOS, FACTURACION, MOTIVOS, URGENCIAS } from "@/lib/data";
import type { ScoreResult } from "@/lib/scoring";
import { saveLeadConsultoria } from "@/lib/actions";

interface ContactModalProps {
  show: boolean;
  onClose: () => void;
  prefillName: string;
  prefillEmail: string;
  result: ScoreResult | null;
  diagnosticoId: string | null;
}

interface FormData {
  nombre: string;
  email: string;
  whatsapp: string;
  empresa: string;
  rubro: string;
  empleados: string;
  facturacion: string;
  motivo: string;
  detalle: string;
  urgencia: string;
}

function CheckIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="none" stroke={color || "#fff"} strokeWidth="3" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.mu} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function ContactModal({ show, onClose, prefillName, prefillEmail, result, diagnosticoId }: ContactModalProps) {
  const [f, setF] = useState<FormData>({
    nombre: prefillName, email: prefillEmail, whatsapp: "", empresa: "",
    rubro: "", empleados: "", facturacion: "", motivo: "", detalle: "", urgencia: "",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(function () {
    setF(function (prev) {
      return { ...prev, nombre: prefillName, email: prefillEmail };
    });
    setSent(false);
    setErrs({});
  }, [show, prefillName, prefillEmail]);

  function upd(key: string, val: string) {
    setF(function (prev) { return { ...prev, [key]: val }; });
    setErrs(function (prev) { const n = { ...prev }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!f.nombre.trim()) e.nombre = "Ingresá tu nombre y apellido";
    if (!f.email.trim()) e.email = "Ingresá tu email";
    else if (f.email.indexOf("@") < 1 || f.email.indexOf(".") < 3) e.email = "El formato de email no es válido";
    if (!f.whatsapp.trim()) e.whatsapp = "Ingresá tu WhatsApp";
    else if (f.whatsapp.replace(/\D/g, "").length < 8) e.whatsapp = "Ingresá un número válido";
    if (!f.empresa.trim()) e.empresa = "Ingresá el nombre de tu empresa";
    if (!f.empleados) e.empleados = "Seleccioná una opción";
    if (!f.motivo) e.motivo = "Seleccioná el motivo principal";
    if (!f.detalle.trim()) e.detalle = "Contanos brevemente qué necesitás resolver";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    saveLeadConsultoria(f, result, diagnosticoId).then(function (ok) {
      if (!ok) console.error("Error guardando lead");
    });
    setSent(true);
  }

  if (!show) return null;

  // ── Sent confirmation ──
  if (sent) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }} onClick={onClose}>
        <div style={{ background: C.sf, borderRadius: 20, border: "1px solid " + C.bd, maxWidth: 460, width: "100%", marginTop: 20 }} onClick={function (e) { e.stopPropagation(); }}>
          <div style={{ padding: "40px 28px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: C.cyg, border: "1px solid " + C.cyd, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckIcon size={28} color={C.gn} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: C.ic, margin: "0 0 12px" }}>Gracias</h3>
            <p style={{ fontSize: 14, color: C.mu, margin: "0 0 28px", lineHeight: 1.6 }}>
              Recibimos tu consulta y vamos a contactarte pronto para entender mejor tu caso y contarte cómo podemos ayudarte.
            </p>
            <button onClick={onClose} style={{ background: "linear-gradient(135deg," + C.cy + "," + C.mg + ")", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Helper: text/email/tel field ──
  function renderInput(label: string, key: string, type: string, placeholder: string, required: boolean) {
    const hasErr = errs[key];
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.ml, display: "block", marginBottom: 6 }}>
          {label}{required ? <span style={{ color: C.rd }}> *</span> : null}
        </label>
        <input
          type={type}
          value={f[key as keyof FormData]}
          onChange={function (e) { upd(key, e.target.value); }}
          placeholder={placeholder}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid " + (hasErr ? C.rd : C.bd), fontSize: 14, outline: "none", boxSizing: "border-box" as const, background: C.bg, color: C.ic }}
        />
        {hasErr ? <p style={{ fontSize: 12, color: C.rd, margin: "4px 0 0", fontWeight: 500 }}>{errs[key]}</p> : null}
      </div>
    );
  }

  // ── Helper: select field ──
  function renderSelect(label: string, key: string, options: string[], required: boolean, hint?: string) {
    const hasErr = errs[key];
    const val = f[key as keyof FormData];
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.ml, display: "block", marginBottom: 6 }}>
          {label}{required ? <span style={{ color: C.rd }}> *</span> : null}
        </label>
        {hint ? <p style={{ fontSize: 11, color: C.mu, margin: "-2px 0 6px" }}>{hint}</p> : null}
        <select
          value={val}
          onChange={function (e) { upd(key, e.target.value); }}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 10,
            border: "1.5px solid " + (hasErr ? C.rd : C.bd), fontSize: 14,
            outline: "none", boxSizing: "border-box" as const, background: C.bg,
            color: val ? C.ic : C.mu,
            appearance: "none" as const, WebkitAppearance: "none" as const,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7194' stroke-width='2' stroke-linecap='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
          }}
        >
          <option value="">Seleccioná una opción</option>
          {options.map(function (o, i) { return <option key={i} value={o}>{o}</option>; })}
        </select>
        {hasErr ? <p style={{ fontSize: 12, color: C.rd, margin: "4px 0 0", fontWeight: 500 }}>{errs[key]}</p> : null}
      </div>
    );
  }

  // ── Main modal ──
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }} onClick={onClose}>
      <div style={{ background: C.sf, borderRadius: 20, border: "1px solid " + C.bd, maxWidth: 460, width: "100%", marginTop: 20, marginBottom: 40 }} ref={modalRef} onClick={function (e) { e.stopPropagation(); }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid " + C.bd, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: C.cy, margin: 0 }}>SECRITO Consulting</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.ic, margin: "4px 0 0" }}>Hablemos de tu negocio</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <XIcon />
          </button>
        </div>

        {/* Context */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid " + C.bd, background: C.bg }}>
          <p style={{ fontSize: 13, color: C.ml, margin: 0, lineHeight: 1.6 }}>
            Vimos que tu negocio presenta oportunidades de mejora en su gestión financiera. Si querés, podés dejarnos tus datos y te contactamos para evaluar tu caso y proponerte el próximo paso más adecuado.
          </p>
          {result ? (
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" as const }}>
              <span style={{ display: "inline-block", background: result.co + "20", color: result.co, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 16 }}>
                Score: {result.fin}/100
              </span>
              <span style={{ display: "inline-block", background: result.co + "20", color: result.co, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 16 }}>
                {result.lb}
              </span>
            </div>
          ) : null}
        </div>

        {/* Form */}
        <div style={{ padding: "24px 24px 20px", maxHeight: "55vh", overflowY: "auto" as const }}>
          {renderInput("Nombre y apellido", "nombre", "text", "Ej. Juan Pérez", true)}
          {renderInput("Email", "email", "email", "Ej. juan@empresa.com", true)}
          {renderInput("WhatsApp", "whatsapp", "tel", "Ej. +54 9 11 1234 5678", true)}
          {renderInput("Empresa", "empresa", "text", "Ej. Distribuidora Norte", true)}
          {renderSelect("Rubro", "rubro", RUBROS, false)}
          {renderSelect("Cantidad de empleados", "empleados", EMPLEADOS, true)}
          {renderSelect("Facturación mensual aproximada", "facturacion", FACTURACION, false, "Opcional. Podés elegir un rango aproximado.")}
          {renderSelect("Motivo principal de la consulta", "motivo", MOTIVOS, true)}

          {/* Textarea */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.ml, display: "block", marginBottom: 6 }}>
              Contanos brevemente qué necesitás resolver<span style={{ color: C.rd }}> *</span>
            </label>
            <textarea
              value={f.detalle}
              onChange={function (e) { upd("detalle", e.target.value); }}
              placeholder="Ej. Tenemos ventas, pero siempre llegamos ajustados a fin de mes y no sabemos bien dónde se nos va la caja."
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1.5px solid " + (errs.detalle ? C.rd : C.bd), fontSize: 14,
                outline: "none", boxSizing: "border-box" as const, background: C.bg,
                color: C.ic, resize: "vertical" as const, minHeight: 70, maxHeight: 140,
              }}
            />
            {errs.detalle ? <p style={{ fontSize: 12, color: C.rd, margin: "4px 0 0", fontWeight: 500 }}>{errs.detalle}</p> : null}
          </div>

          {renderSelect("Urgencia", "urgencia", URGENCIAS, false)}
        </div>

        {/* Buttons */}
        <div style={{ padding: "16px 24px 24px", borderTop: "1px solid " + C.bd }}>
          <button onClick={submit} style={{ background: "linear-gradient(135deg," + C.cy + "," + C.mg + ")", color: "#fff", border: "none", borderRadius: 12, padding: "15px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", marginBottom: 10 }}>
            Quiero que me contacten
          </button>
          <button onClick={onClose} style={{ background: "transparent", border: "1.5px solid " + C.bl, color: C.mu, borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}