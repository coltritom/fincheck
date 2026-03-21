import { jsPDF } from "jspdf";

interface PdfData {
  nombre: string;
  score: number;
  rango: string;
  label: string;
  alertas: string[];
  dimScores: Record<string, number> | null;
}

var DIMS_INFO = [
  { k: "Flujo de caja", l: "Flujo de caja", w: "25%", why: "Causa #1 de cierre de pymes. Sin efectivo para operar, el negocio se frena sin importar cuánto vendas." },
  { k: "Rentabilidad", l: "Rentabilidad", w: "15%", why: "Facturar no es ganar. Si después de pagar todo (incluido tu sueldo) no queda nada, no es sostenible." },
  { k: "Cobranzas", l: "Cobranzas", w: "15%", why: "Vender y no cobrar es regalar tu trabajo. La plata que te deben es plata que no podés usar." },
  { k: "Endeudamiento", l: "Endeudamiento", w: "15%", why: "La deuda no es mala, pero si las cuotas consumen demasiado de lo que facturás, perdés margen de maniobra." },
  { k: "Precios", l: "Precios y costos", w: "10%", why: "Si no sabés cuánto te cuesta lo que vendés, no podés saber si tu precio es correcto." },
  { k: "Orden", l: "Orden administrativo", w: "10%", why: "Sin registros ni separación de finanzas personales y del negocio, toda decisión es a ciegas." },
  { k: "Concentración", l: "Concentración de clientes", w: "10%", why: "Si un solo cliente representa la mayoría de tus ingresos, tu negocio depende de una decisión que no controlás." },
];

var ACTIONS_7 = [
  "Listar pagos pendientes de los próximos 30 días por urgencia",
  "Contactar deudores con facturas vencidas",
  "Calcular costo real de los 3 productos principales",
];
var ACTIONS_30 = [
  "Armar flujo de caja proyectado semanal para 4 semanas",
  "Implementar política de cobranza con recordatorios",
  "Evaluar refinanciamiento si deuda supera 25%",
];
var ACTIONS_90 = [
  "Revisión semanal de flujo de caja (viernes)",
  "Diversificar cartera de clientes",
  "Construir colchón de al menos 1 mes de costos fijos",
];

var STANDARDS = [
  { l: "Cuotas de deuda", s: "< 20% de facturación", dk: "Endeudamiento" },
  { l: "Cobranza en plazo", s: "> 90% en tiempo", dk: "Cobranzas" },
  { l: "Reserva de emergencia", s: "2-3 meses de costos fijos", dk: "Flujo de caja" },
];

function getRangoColor(rango: string): [number, number, number] {
  if (rango === "critico") return [220, 40, 60];
  if (rango === "fragil") return [210, 130, 20];
  if (rango === "inestable") return [190, 150, 10];
  if (rango === "ordenado") return [0, 120, 220];
  return [20, 160, 110];
}

function getLightBg(rango: string): [number, number, number] {
  if (rango === "critico") return [255, 235, 238];
  if (rango === "fragil") return [255, 243, 224];
  if (rango === "inestable") return [255, 249, 220];
  if (rango === "ordenado") return [227, 242, 253];
  return [225, 245, 235];
}

function getDimStatus(val: number): string {
  if (val >= 7) return "Bien";
  if (val >= 5) return "Mejorable";
  if (val >= 3) return "Bajo";
  return "Crítico";
}

function getDimStatusColor(val: number): [number, number, number] {
  if (val >= 7) return [20, 160, 110];
  if (val >= 5) return [190, 150, 10];
  if (val >= 3) return [210, 130, 20];
  return [220, 40, 60];
}

function getInterpretation(rango: string): string {
  if (rango === "critico") return "Tu negocio tiene problemas severos que ponen en riesgo su continuidad. Necesitás actuar esta semana, no este mes.";
  if (rango === "fragil") return "Tu negocio opera con fragilidad financiera. Cualquier imprevisto puede disparar una crisis. Hay correcciones urgentes que hacer.";
  if (rango === "inestable") return "Tu negocio funciona pero tiene vulnerabilidades que necesitan atención. Con ajustes concretos podés mejorar significativamente en 30-90 días.";
  if (rango === "ordenado") return "Tu negocio tiene una base financiera sólida con áreas de optimización. No hay urgencias, pero sí oportunidades importantes de mejora.";
  return "Tu negocio demuestra salud financiera robusta. Tenés control, margen y gestión activa. El foco debería estar en escalar y proteger lo construido.";
}

function getPriorityAction(ds: Record<string, number> | null): string {
  if (!ds) return "";
  if (ds["Flujo de caja"] <= 4) return "Listá todos los pagos de los próximos 30 días, clasificalos por urgencia, e identificá cuáles podés negociar o postergar.";
  if (ds["Rentabilidad"] <= 4) return "Calculá cuánto te queda después de pagar todo (incluido tu sueldo). Si es cero o negativo, revisá tus 3 mayores gastos.";
  if (ds["Cobranzas"] <= 4) return "Hacé una lista de todas las facturas vencidas y contactá a cada deudor esta semana.";
  return "Revisá si tu excedente está trabajando para vos y si tus precios reflejan el valor real que entregás.";
}

function checkPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 270) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ═══ HEADER ═══

function addHeader(doc: jsPDF, nombre: string, isPremium: boolean): number {
  // Top accent bar
  doc.setFillColor(0, 142, 254);
  doc.rect(0, 0, 140, 2.5, "F");
  doc.setFillColor(254, 38, 254);
  doc.rect(140, 0, 70, 2.5, "F");

  var y = 14;

  // Logo square with pulse
  doc.setFillColor(0, 100, 220);
  doc.roundedRect(20, y - 2, 12, 12, 2.5, 2.5, "F");
  doc.setFillColor(160, 40, 220);
  doc.roundedRect(26, y - 2, 6, 12, 0, 2.5, "F");

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.line(22, y + 4.5, 24.5, y + 4.5);
  doc.line(24.5, y + 4.5, 26, y + 1);
  doc.line(26, y + 1, 28, y + 9);
  doc.line(28, y + 9, 29.5, y + 4.5);
  doc.line(29.5, y + 4.5, 31, y + 4.5);

  // "fincheq" in dark readable color
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 220);
  doc.text("fincheq", 36, y + 8);

  if (isPremium) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(254, 38, 254);
    doc.text("REPORTE PREMIUM", 76, y + 8);
  }

  y += 16;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 150);
  doc.text("Diagnóstico financiero para pymes — SECRITO Consulting", 20, y);

  y += 5;
  doc.text("Preparado para: " + nombre, 20, y);
  var date = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text("Fecha: " + date, 140, y);

  y += 4;
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);

  return y + 8;
}

// ═══ SCORE ═══

function addScoreSection(doc: jsPDF, y: number, score: number, label: string, rango: string): number {
  var rc = getRangoColor(rango);
  var bg = getLightBg(rango);
  var interp = getInterpretation(rango);

  // Background box
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.roundedRect(20, y, 170, 52, 4, 4, "F");
  doc.setDrawColor(rc[0], rc[1], rc[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, y, 170, 52, 4, 4, "S");

  // Label pill
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  var labelText = label.toUpperCase();
  var labelW = doc.getTextWidth(labelText) + 28;
  doc.setFillColor(rc[0], rc[1], rc[2]);
  doc.roundedRect(105 - labelW / 2, y + 6, labelW, 14, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(labelText, 105, y + 15, { align: "center" });

  // Score number + /100
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(rc[0], rc[1], rc[2]);
  var scoreStr = String(score);
  var scoreW = doc.getTextWidth(scoreStr);
  var sx = 105 - (scoreW + 16) / 2;
  doc.text(scoreStr, sx, y + 42);

  doc.setFontSize(16);
  doc.setTextColor(130, 130, 150);
  doc.text("/100", sx + scoreW + 3, y + 42);

  y += 60;

  // Interpretation below the box
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 100);
  var interpLines = doc.splitTextToSize(interp, 170);
  doc.text(interpLines, 20, y);
  y += interpLines.length * 5 + 8;

  return y;
}

// ═══ ALERTS ═══

function addAlerts(doc: jsPDF, y: number, alertas: string[]): number {
  if (alertas.length === 0) return y;

  y = checkPage(doc, y, 30);

  // Red left border + light red background
  var boxH = 10;
  var alertLines: string[][] = [];
  var tempDoc = new jsPDF();
  tempDoc.setFontSize(9);
  for (var a = 0; a < alertas.length; a++) {
    var lines = tempDoc.splitTextToSize(alertas[a], 155);
    alertLines.push(lines);
    boxH += lines.length * 4.5 + 3;
  }

  doc.setFillColor(255, 240, 242);
  doc.roundedRect(20, y, 170, boxH, 3, 3, "F");
  doc.setFillColor(220, 40, 60);
  doc.rect(20, y, 3, boxH, "F");

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 30, 50);
  doc.text("Alertas críticas detectadas", 28, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 50, 70);
  for (var i = 0; i < alertLines.length; i++) {
    doc.text("•", 28, y);
    doc.text(alertLines[i], 34, y);
    y += alertLines[i].length * 4.5 + 3;
  }

  return y + 4;
}

// ═══ DIMENSIONS (FREE) ═══

function addDimensionsFree(doc: jsPDF, y: number, dimScores: Record<string, number> | null): number {
  y = checkPage(doc, y, 40);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 220);
  doc.text("Tus 7 dimensiones financieras", 20, y);
  y += 8;

  for (var i = 0; i < DIMS_INFO.length; i++) {
    y = checkPage(doc, y, 18);

    var d = DIMS_INFO[i];
    var val = dimScores ? (dimScores[d.k] || 0) : 0;
    var status = dimScores ? getDimStatus(val) : "—";
    var sc = dimScores ? getDimStatusColor(val) : [130, 130, 150] as [number, number, number];

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(247, 247, 252);
      doc.rect(20, y - 4, 170, 17, "F");
    }

    // Name
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 65);
    doc.text(d.l, 24, y);

    // Status pill
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    var stW = doc.getTextWidth(status) + 10;
    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.roundedRect(188 - stW, y - 3, stW, 6.5, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(status, 188 - stW / 2, y + 1, { align: "center" });

    // Description
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 150);
    var whyLines = doc.splitTextToSize(d.why, 160);
    doc.text(whyLines, 24, y);
    y += whyLines.length * 3.8 + 5;
  }

  y += 2;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 165);
  doc.text("Los scores numéricos exactos están disponibles en el Reporte Premium.", 105, y, { align: "center" });

  return y + 8;
}

// ═══ DIMENSIONS (PREMIUM) ═══

function addDimensionsPremium(doc: jsPDF, y: number, dimScores: Record<string, number>): number {
  y = checkPage(doc, y, 70);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 220);
  doc.text("Scores por dimensión", 20, y);
  y += 8;

  // Table header
  doc.setFillColor(235, 235, 245);
  doc.rect(20, y - 4, 170, 7, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 120);
  doc.text("Dimensión", 24, y);
  doc.text("Peso", 115, y);
  doc.text("Score", 138, y);
  doc.text("Estado", 165, y);
  y += 7;

  for (var i = 0; i < DIMS_INFO.length; i++) {
    var d = DIMS_INFO[i];
    var val = dimScores[d.k] || 0;
    var status = getDimStatus(val);
    var sc = getDimStatusColor(val);

    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 253);
      doc.rect(20, y - 3.5, 170, 7, "F");
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 65);
    doc.text(d.l, 24, y);

    doc.setTextColor(130, 130, 150);
    doc.text(d.w, 115, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 65);
    doc.text(val.toFixed(1) + "/10", 138, y);

    doc.setTextColor(sc[0], sc[1], sc[2]);
    doc.text(status, 165, y);

    y += 7;
  }

  return y + 4;
}

// ═══ PRIORITY RANKING ═══

function addPriorityRanking(doc: jsPDF, y: number, dimScores: Record<string, number>): number {
  y = checkPage(doc, y, 40);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 30, 220);
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

    // Number circle
    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.circle(26, y - 1.5, 4, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(String(i + 1), 26, y, { align: "center" });

    // Name and urgency
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 65);
    doc.text(d.l, 34, y);

    doc.setFontSize(9);
    doc.setTextColor(sc[0], sc[1], sc[2]);
    doc.text(val.toFixed(1) + "/10  —  " + urgency, 100, y);

    y += 9;
  }

  return y + 2;
}

// ═══ ACTION PLAN ═══

function addActionPlan(doc: jsPDF, y: number): number {
  y = checkPage(doc, y, 50);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 220);
  doc.text("Plan de acción", 20, y);
  y += 10;

  var sections = [
    { title: "Próximos 7 días", color: [220, 40, 60] as [number, number, number], items: ACTIONS_7 },
    { title: "Próximos 30 días", color: [210, 130, 20] as [number, number, number], items: ACTIONS_30 },
    { title: "Próximos 90 días", color: [20, 160, 110] as [number, number, number], items: ACTIONS_90 },
  ];

  for (var s = 0; s < sections.length; s++) {
    y = checkPage(doc, y, 25);
    var sec = sections[s];

    // Colored dot + title
    doc.setFillColor(sec.color[0], sec.color[1], sec.color[2]);
    doc.circle(24, y - 1.5, 2.5, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(sec.color[0], sec.color[1], sec.color[2]);
    doc.text(sec.title, 30, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 100);
    for (var j = 0; j < sec.items.length; j++) {
      y = checkPage(doc, y, 8);
      doc.rect(28, y - 3, 4, 4);
      var itemLines = doc.splitTextToSize(sec.items[j], 148);
      doc.text(itemLines, 36, y);
      y += itemLines.length * 4.5 + 2;
    }
    y += 4;
  }

  return y;
}

// ═══ STANDARDS ═══

function addStandards(doc: jsPDF, y: number, dimScores: Record<string, number>): number {
  y = checkPage(doc, y, 40);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 220);
  doc.text("Estándares de referencia", 20, y);
  y += 8;

  for (var i = 0; i < STANDARDS.length; i++) {
    var st = STANDARDS[i];
    var ok = (dimScores[st.dk] || 0) >= 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 65);
    doc.text(st.l, 24, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 150);
    doc.text("Buena práctica: " + st.s, 24, y + 5);

    doc.setFont("helvetica", "bold");
    if (ok) {
      doc.setTextColor(20, 160, 110);
      doc.text("Dentro del rango", 188, y, { align: "right" });
    } else {
      doc.setTextColor(210, 130, 20);
      doc.text("Por debajo", 188, y, { align: "right" });
    }

    y += 13;
  }

  return y;
}

// ═══ PRIORITY ACTION ═══

function addPriorityActionSection(doc: jsPDF, y: number, dimScores: Record<string, number> | null): number {
  var action = getPriorityAction(dimScores);
  if (!action) return y;

  y = checkPage(doc, y, 30);

  // Blue left border box
  doc.setFillColor(240, 246, 255);
  var actionLines = doc.splitTextToSize(action, 155);
  var boxH = actionLines.length * 4.5 + 16;
  doc.roundedRect(20, y, 170, boxH, 3, 3, "F");
  doc.setFillColor(0, 100, 220);
  doc.rect(20, y, 3, boxH, "F");

  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 220);
  doc.text("TU ACCIÓN PRIORITARIA ESTA SEMANA", 28, y);

  y += 7;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 80);
  doc.text(actionLines, 28, y);
  y += actionLines.length * 4.5 + 6;

  return y;
}

// ═══ UPSELL ═══

function addUpsellBlock(doc: jsPDF, y: number): number {
  y = checkPage(doc, y, 30);

  doc.setFillColor(240, 240, 248);
  doc.roundedRect(20, y, 170, 28, 3, 3, "F");
  doc.setDrawColor(0, 100, 220);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, y, 170, 28, 3, 3, "S");

  y += 9;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 30, 220);
  doc.text("REPORTE PREMIUM — USD 9.99", 105, y, { align: "center" });

  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 120);
  doc.text("Scores exactos  •  Prioridades  •  Plan 7/30/90  •  Checklist  •  Plantillas", 105, y, { align: "center" });

  y += 6;
  doc.setTextColor(0, 100, 220);
  doc.text("Accedé desde fincheq.pro", 105, y, { align: "center" });

  return y + 10;
}

// ═══ CONSULTORIA ═══

function addConsultoriaBlock(doc: jsPDF, y: number): number {
  y = checkPage(doc, y, 22);

  doc.setDrawColor(0, 100, 220);
  doc.setLineWidth(0.4);
  doc.line(20, y, 190, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 65);
  doc.text("¿Necesitás acompañamiento profesional?", 20, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 150);
  doc.text("Agendá una llamada gratuita de 15 minutos con SECRITO Consulting — fincheq.pro", 20, y);

  return y + 8;
}

// ═══ FOOTER ═══

function addFooter(doc: jsPDF) {
  var pageCount = doc.getNumberOfPages();
  for (var p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 170, 185);
    doc.text("Fincheq — SECRITO Consulting — fincheq.pro", 105, 288, { align: "center" });
    doc.text("Página " + p + " de " + pageCount, 188, 288, { align: "right" });
  }
}

// ═══ PUBLIC: FREE PDF ═══

export function generateFreePdf(data: PdfData): ArrayBuffer {
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  var y = addHeader(doc, data.nombre, false);
  y = addScoreSection(doc, y, data.score, data.label, data.rango);
  y = addAlerts(doc, y, data.alertas);
  y = addDimensionsFree(doc, y, data.dimScores);
  y = addPriorityActionSection(doc, y, data.dimScores);
  y = addUpsellBlock(doc, y);
  y = addConsultoriaBlock(doc, y);
  addFooter(doc);

  return doc.output("arraybuffer");
}

// ═══ PUBLIC: PREMIUM PDF ═══

export function generatePremiumPdf(data: PdfData): ArrayBuffer {
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  var y = addHeader(doc, data.nombre, true);
  y = addScoreSection(doc, y, data.score, data.label, data.rango);
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