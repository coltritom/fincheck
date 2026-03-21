import { jsPDF } from "jspdf";

interface PdfData {
  nombre: string;
  score: number;
  rango: string;
  label: string;
  alertas: string[];
  dimScores: Record<string, number> | null;
}

const DIMS_INFO = [
  { k: "Flujo de caja", l: "Flujo de caja", w: "25%", why: "Causa #1 de cierre de pymes. Sin efectivo, el negocio se frena." },
  { k: "Rentabilidad", l: "Rentabilidad", w: "15%", why: "Si después de pagar todo no queda nada, el negocio no es sostenible." },
  { k: "Cobranzas", l: "Cobranzas", w: "15%", why: "Vender y no cobrar es regalar tu trabajo." },
  { k: "Endeudamiento", l: "Endeudamiento", w: "15%", why: "Si las cuotas consumen demasiado, perdés capacidad de reacción." },
  { k: "Precios", l: "Precios y costos", w: "10%", why: "Sin conocer tus costos reales, no podés saber si tu precio es correcto." },
  { k: "Orden", l: "Orden administrativo", w: "10%", why: "Sin registros ni separación de finanzas, toda decisión es a ciegas." },
  { k: "Concentración", l: "Concentración de clientes", w: "10%", why: "Depender de un solo cliente es un riesgo que no controlás." },
];

const ACTIONS_7 = [
  "Listar pagos pendientes de los próximos 30 días por urgencia",
  "Contactar deudores con facturas vencidas",
  "Calcular costo real de los 3 productos principales",
];
const ACTIONS_30 = [
  "Armar flujo de caja proyectado semanal para 4 semanas",
  "Implementar política de cobranza con recordatorios",
  "Evaluar refinanciamiento si deuda supera 25%",
];
const ACTIONS_90 = [
  "Revisión semanal de flujo de caja (viernes)",
  "Diversificar cartera de clientes",
  "Construir colchón de al menos 1 mes de costos fijos",
];

const STANDARDS = [
  { l: "Cuotas de deuda", s: "< 20% de facturación", dk: "Endeudamiento" },
  { l: "Cobranza en plazo", s: "> 90% en tiempo", dk: "Cobranzas" },
  { l: "Reserva de emergencia", s: "2-3 meses de costos fijos", dk: "Flujo de caja" },
];

function getRangoColor(rango: string): [number, number, number] {
  if (rango === "critico") return [255, 77, 106];
  if (rango === "fragil") return [255, 159, 67];
  if (rango === "inestable") return [251, 191, 36];
  if (rango === "ordenado") return [0, 142, 254];
  return [52, 211, 153];
}

function getDimStatus(val: number): string {
  if (val >= 7) return "Bien";
  if (val >= 5) return "Mejorable";
  if (val >= 3) return "Bajo";
  return "Crítico";
}

function getDimStatusColor(val: number): [number, number, number] {
  if (val >= 7) return [52, 211, 153];
  if (val >= 5) return [251, 191, 36];
  if (val >= 3) return [255, 159, 67];
  return [255, 77, 106];
}

function getInterpretation(rango: string): string {
  if (rango === "critico") return "Tu negocio tiene problemas severos que ponen en riesgo su continuidad. Necesitás actuar esta semana.";
  if (rango === "fragil") return "Tu negocio opera con fragilidad. Cualquier imprevisto puede disparar una crisis. Hay correcciones urgentes.";
  if (rango === "inestable") return "Tu negocio funciona pero tiene vulnerabilidades. Con ajustes concretos podés mejorar en 30-90 días.";
  if (rango === "ordenado") return "Tu negocio tiene una base sólida con áreas de optimización. No hay urgencias, pero sí oportunidades.";
  return "Tu negocio demuestra salud financiera robusta. El foco: escalar y proteger.";
}

function getPriorityAction(ds: Record<string, number> | null): string {
  if (!ds) return "";
  if (ds["Flujo de caja"] <= 4) return "Listá todos los pagos de los próximos 30 días, clasificalos por urgencia, e identificá cuáles podés negociar.";
  if (ds["Rentabilidad"] <= 4) return "Calculá cuánto te queda después de pagar todo. Si es cero o negativo, revisá tus 3 mayores gastos.";
  if (ds["Cobranzas"] <= 4) return "Hacé una lista de todas las facturas vencidas y contactá a cada deudor esta semana.";
  return "Revisá si tu excedente está trabajando y si tus precios reflejan el valor real.";
}

function addHeader(doc: jsPDF, nombre: string, isPremium: boolean): number {
  var y = 20;
  
  // Top gradient bar
  doc.setFillColor(0, 142, 254);
  doc.rect(0, 0, 210, 4, "F");
  doc.setFillColor(254, 38, 254);
  doc.rect(140, 0, 70, 4, "F");
  
  // Logo text
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 142, 254);
  doc.text("Fincheq", 20, y);
  
  if (isPremium) {
    doc.setFontSize(10);
    doc.setTextColor(254, 38, 254);
    doc.text("REPORTE PREMIUM", 62, y);
  }
  
  // Subtitle
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 140);
  doc.text("Diagnóstico financiero para pymes — SECRITO Consulting", 20, y);
  
  // Name
  y += 6;
  doc.setTextColor(120, 120, 140);
  doc.text("Preparado para: " + nombre, 20, y);
  
  // Date
  var date = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text("Fecha: " + date, 120, y);
  
  // Separator
  y += 6;
  doc.setDrawColor(40, 40, 60);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  
  return y + 8;
}

function addScoreSection(doc: jsPDF, y: number, score: number, label: string, rango: string): number {
  var rc = getRangoColor(rango);
  
  // Score box
  doc.setFillColor(12, 12, 20);
  doc.roundedRect(20, y, 170, 40, 4, 4, "F");
  
  // Score number
  doc.setFontSize(42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(rc[0], rc[1], rc[2]);
  doc.text(String(score), 105, y + 22, { align: "center" });
  
  // /100
  doc.setFontSize(14);
  doc.setTextColor(120, 120, 140);
  doc.text("/100", 105, y + 30, { align: "center" });
  
  // Label badge
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(rc[0], rc[1], rc[2]);
  doc.text(label, 105, y + 38, { align: "center" });
  
  return y + 48;
}

function addInterpretation(doc: jsPDF, y: number, rango: string): number {
  var interp = getInterpretation(rango);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 55);
  doc.text("Interpretación", 20, y);
  y += 7;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 100);
  var lines = doc.splitTextToSize(interp, 170);
  doc.text(lines, 20, y);
  y += lines.length * 5 + 6;
  
  return y;
}

function addAlerts(doc: jsPDF, y: number, alertas: string[]): number {
  if (alertas.length === 0) return y;
  
  doc.setFillColor(255, 77, 106, 15);
  var boxH = 10 + alertas.length * 12;
  doc.setFillColor(40, 15, 20);
  doc.roundedRect(20, y, 170, boxH, 3, 3, "F");
  
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 77, 106);
  doc.text("Alertas críticas detectadas", 25, y);
  y += 8;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (var i = 0; i < alertas.length; i++) {
    doc.text("•  " + alertas[i], 25, y);
    y += alertas.length > 2 ? 6 : 7;
  }
  
  return y + 6;
}

function addDimensionsFree(doc: jsPDF, y: number, dimScores: Record<string, number> | null): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 142, 254);
  doc.text("Tus 7 dimensiones financieras", 20, y);
  y += 8;
  
  for (var i = 0; i < DIMS_INFO.length; i++) {
    var d = DIMS_INFO[i];
    var val = dimScores ? (dimScores[d.k] || 0) : 0;
    var status = dimScores ? getDimStatus(val) : "—";
    var sc = dimScores ? getDimStatusColor(val) : [120, 120, 140] as [number, number, number];
    
    // Dim name
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 55);
    doc.text(d.l, 20, y);
    
    // Status
    doc.setFont("helvetica", "bold");
    doc.setTextColor(sc[0], sc[1], sc[2]);
    doc.text(status, 190, y, { align: "right" });
    
    // Why
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 140);
    doc.text(d.why, 20, y);
    
    y += 7;
    if (i < DIMS_INFO.length - 1) {
      doc.setDrawColor(220, 220, 230);
      doc.setLineWidth(0.2);
      doc.line(20, y - 2, 190, y - 2);
    }
  }
  
  y += 2;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 140);
  doc.text("Los scores numéricos exactos están disponibles en el Reporte Premium.", 105, y, { align: "center" });
  
  return y + 8;
}

function addDimensionsPremium(doc: jsPDF, y: number, dimScores: Record<string, number>): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 142, 254);
  doc.text("Scores por dimensión", 20, y);
  y += 8;
  
  // Header row
  doc.setFillColor(240, 240, 245);
  doc.rect(20, y - 4, 170, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 100);
  doc.text("Dimensión", 22, y);
  doc.text("Peso", 110, y);
  doc.text("Score", 135, y);
  doc.text("Estado", 160, y);
  y += 7;
  
  for (var i = 0; i < DIMS_INFO.length; i++) {
    var d = DIMS_INFO[i];
    var val = dimScores[d.k] || 0;
    var status = getDimStatus(val);
    var sc = getDimStatusColor(val);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 55);
    doc.text(d.l, 22, y);
    
    doc.setTextColor(120, 120, 140);
    doc.text(d.w, 110, y);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 55);
    doc.text(val.toFixed(1) + "/10", 135, y);
    
    doc.setTextColor(sc[0], sc[1], sc[2]);
    doc.text(status, 160, y);
    
    y += 6;
    if (i < DIMS_INFO.length - 1) {
      doc.setDrawColor(230, 230, 235);
      doc.setLineWidth(0.15);
      doc.line(22, y - 2, 188, y - 2);
    }
  }
  
  return y + 4;
}

function addPriorityRanking(doc: jsPDF, y: number, dimScores: Record<string, number>): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(254, 38, 254);
  doc.text("Orden de prioridad", 20, y);
  y += 8;
  
  var sorted = DIMS_INFO.slice().sort(function (a, b) {
    return (dimScores[a.k] || 0) - (dimScores[b.k] || 0);
  });
  
  for (var i = 0; i < 3; i++) {
    var d = sorted[i];
    var val = dimScores[d.k] || 0;
    var sc = getDimStatusColor(val);
    var urgency = val < 3 ? "URGENTE" : val < 5 ? "IMPORTANTE" : val < 7 ? "ATENDER" : "OPTIMIZAR";
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(sc[0], sc[1], sc[2]);
    doc.text("#" + (i + 1), 20, y);
    
    doc.setTextColor(40, 40, 55);
    doc.text(d.l, 30, y);
    
    doc.setFontSize(9);
    doc.setTextColor(sc[0], sc[1], sc[2]);
    doc.text(val.toFixed(1) + "/10 — " + urgency, 100, y);
    
    y += 7;
  }
  
  return y + 4;
}

function addActionPlan(doc: jsPDF, y: number): number {
  if (y > 230) { doc.addPage(); y = 20; }
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 142, 254);
  doc.text("Plan de acción", 20, y);
  y += 10;
  
  // 7 days
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 77, 106);
  doc.text("Próximos 7 días", 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 100);
  for (var i = 0; i < ACTIONS_7.length; i++) {
    doc.text("☐  " + ACTIONS_7[i], 24, y);
    y += 5.5;
  }
  y += 4;
  
  // 30 days
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 159, 67);
  doc.text("Próximos 30 días", 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 100);
  for (var j = 0; j < ACTIONS_30.length; j++) {
    doc.text("☐  " + ACTIONS_30[j], 24, y);
    y += 5.5;
  }
  y += 4;
  
  // 90 days
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 211, 153);
  doc.text("Próximos 90 días", 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 100);
  for (var k = 0; k < ACTIONS_90.length; k++) {
    doc.text("☐  " + ACTIONS_90[k], 24, y);
    y += 5.5;
  }
  
  return y + 6;
}

function addStandards(doc: jsPDF, y: number, dimScores: Record<string, number>): number {
  if (y > 240) { doc.addPage(); y = 20; }
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 142, 254);
  doc.text("Estándares de referencia", 20, y);
  y += 8;
  
  for (var i = 0; i < STANDARDS.length; i++) {
    var st = STANDARDS[i];
    var ok = (dimScores[st.dk] || 0) >= 7;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 55);
    doc.text(st.l, 22, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 140);
    doc.text("Buena práctica: " + st.s, 22, y + 5);
    
    doc.setFont("helvetica", "bold");
    if (ok) {
      doc.setTextColor(52, 211, 153);
      doc.text("Dentro del rango", 160, y, { align: "right" });
    } else {
      doc.setTextColor(255, 159, 67);
      doc.text("Por debajo", 160, y, { align: "right" });
    }
    
    y += 12;
  }
  
  return y + 2;
}

function addPriorityActionSection(doc: jsPDF, y: number, dimScores: Record<string, number> | null): number {
  var action = getPriorityAction(dimScores);
  if (!action) return y;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 142, 254);
  doc.text("Tu acción prioritaria esta semana", 20, y);
  y += 7;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 100);
  var lines = doc.splitTextToSize(action, 170);
  doc.text(lines, 20, y);
  y += lines.length * 5 + 6;
  
  return y;
}

function addFooter(doc: jsPDF) {
  var pageCount = doc.getNumberOfPages();
  for (var p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 165);
    doc.text("Fincheq — SECRITO Consulting — fincheq.pro", 105, 287, { align: "center" });
    doc.text("Página " + p + " de " + pageCount, 190, 287, { align: "right" });
  }
}

function addUpsellBlock(doc: jsPDF, y: number): number {
  if (y > 240) { doc.addPage(); y = 20; }
  
  doc.setFillColor(12, 12, 20);
  doc.roundedRect(20, y, 170, 35, 3, 3, "F");
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(254, 38, 254);
  doc.text("REPORTE PREMIUM — USD 9.99", 105, y, { align: "center" });
  
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 140);
  doc.text("Scores exactos • Prioridades • Plan 7/30/90 • Checklist • Plantillas", 105, y, { align: "center" });
  
  y += 7;
  doc.setTextColor(0, 142, 254);
  doc.text("Accedé desde fincheq.pro", 105, y, { align: "center" });
  
  return y + 15;
}

function addConsultoriaBlock(doc: jsPDF, y: number): number {
  if (y > 250) { doc.addPage(); y = 20; }
  
  doc.setDrawColor(0, 142, 254);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 55);
  doc.text("¿Necesitás acompañamiento profesional?", 20, y);
  y += 6;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 140);
  doc.text("Agendá una llamada gratuita de 15 minutos con SECRITO Consulting.", 20, y);
  y += 5;
  doc.text("Contacto: fincheq.pro", 20, y);
  
  return y + 8;
}

// ═══ PUBLIC FUNCTIONS ═══

export function generateFreePdf(data: PdfData): ArrayBuffer {
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  var y = addHeader(doc, data.nombre, false);
  y = addScoreSection(doc, y, data.score, data.label, data.rango);
  y = addInterpretation(doc, y, data.rango);
  y = addAlerts(doc, y, data.alertas);
  y = addDimensionsFree(doc, y, data.dimScores);
  y = addPriorityActionSection(doc, y, data.dimScores);
  y = addUpsellBlock(doc, y);
  y = addConsultoriaBlock(doc, y);
  addFooter(doc);
  
  return doc.output("arraybuffer");
}

export function generatePremiumPdf(data: PdfData): ArrayBuffer {
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  var y = addHeader(doc, data.nombre, true);
  y = addScoreSection(doc, y, data.score, data.label, data.rango);
  y = addInterpretation(doc, y, data.rango);
  y = addAlerts(doc, y, data.alertas);
  
  if (data.dimScores) {
    y = addDimensionsPremium(doc, y, data.dimScores);
    y = addPriorityRanking(doc, y, data.dimScores);
  }
  
  y = addActionPlan(doc, y);
  
  if (data.dimScores) {
    y = addStandards(doc, y, data.dimScores);
  }
  
  y = addConsultoriaBlock(doc, y);
  addFooter(doc);
  
  return doc.output("arraybuffer");
}