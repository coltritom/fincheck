import { C, QUESTIONS, DIMS } from "./data";

export interface ScoreResult {
  ds: Record<string, number>;
  fin: number;
  al: string[];
  rg: string;
  co: string;
  lb: string;
}

export function calcScores(answers: Record<number, number>): ScoreResult {
  // Calculate dimension scores
  const ds: Record<string, number> = {};
  for (let i = 0; i < DIMS.length; i++) {
    const d = DIMS[i];
    let total = 0;
    for (let j = 0; j < d.qi.length; j++) {
      const idx = d.qi[j];
      total += answers[idx] !== undefined ? QUESTIONS[idx].s[answers[idx]] : 5;
    }
    ds[d.k] = total / d.qi.length;
  }

  // Calculate base weighted score
  let base = 0;
  for (let i = 0; i < DIMS.length; i++) {
    base += ds[DIMS[i].k] * DIMS[i].w * 10;
  }

  // Apply penalties
  let pen = 0;
  const al: string[] = [];

  if (answers[13] === 3) {
    pen -= 10;
    al.push("Tu negocio no tiene reservas para operar ni una semana sin ventas.");
  }
  if (answers[12] === 3) {
    pen -= 10;
    al.push("Tenés atrasos frecuentes en obligaciones críticas.");
  }
  if (answers[12] === 2) {
    pen -= 5;
    al.push("Tuviste atrasos en obligaciones críticas varias veces.");
  }
  if (answers[11] === 3) {
    pen -= 5;
    al.push("Más del 50% de tus ingresos depende de un solo cliente.");
  }

  let fin = Math.max(0, Math.round(base + pen));

  // Apply vetos (ceiling rules)
  if (ds["Flujo de caja"] <= 3 && fin > 54) fin = 54;
  if (answers[6] === 4 && fin > 69) fin = 69;
  if (answers[0] === 3 && answers[7] === 3 && fin > 54) fin = 54;

  // Fill alerts if needed
  if (al.length === 0 && ds["Flujo de caja"] < 5)
    al.push("Tu flujo de caja muestra debilidad.");
  if (al.length < 2 && ds["Rentabilidad"] < 4)
    al.push("Tu rentabilidad real es baja o inexistente.");
  if (al.length < 2 && ds["Endeudamiento"] < 4)
    al.push("Tu endeudamiento es preocupante.");

  // Determine range
  let rg: string, co: string, lb: string;
  if (fin <= 34) { rg = "critico"; co = C.rd; lb = "Crítico"; }
  else if (fin <= 54) { rg = "fragil"; co = C.or; lb = "Frágil"; }
  else if (fin <= 69) { rg = "inestable"; co = C.yw; lb = "Inestable pero recuperable"; }
  else if (fin <= 84) { rg = "ordenado"; co = C.cy; lb = "Ordenado con alertas"; }
  else { rg = "solido"; co = C.gn; lb = "Sólido"; }

  return { ds, fin, al: al.slice(0, 3), rg, co, lb };
}

// Helper functions for results
export function getInterpretation(rg: string): string {
  if (rg === "critico") return "Tu negocio tiene problemas severos que ponen en riesgo su continuidad. Necesitás actuar esta semana.";
  if (rg === "fragil") return "Tu negocio opera con fragilidad. Cualquier imprevisto puede disparar una crisis.";
  if (rg === "inestable") return "Tu negocio funciona pero tiene vulnerabilidades. Con ajustes concretos podés mejorar en 30-90 días.";
  if (rg === "ordenado") return "Tu negocio tiene una base sólida con áreas de optimización.";
  return "Tu negocio demuestra salud financiera robusta. El foco: escalar y proteger.";
}

export function getPriorityAction(ds: Record<string, number>): string {
  if (ds["Flujo de caja"] <= 4) return "Listá todos los pagos de los próximos 30 días, clasificalos por urgencia, e identificá cuáles podés negociar o postergar.";
  if (ds["Rentabilidad"] <= 4) return "Calculá cuánto te queda después de pagar todo. Si es cero o negativo, revisá tus 3 mayores gastos.";
  if (ds["Cobranzas"] <= 4) return "Hacé una lista de todas las facturas vencidas y contactá a cada deudor esta semana.";
  return "Revisá si tu excedente está trabajando y si tus precios reflejan el valor real.";
}

export function getAlertExplanation(text: string): string {
  if (text.indexOf("semana") >= 0) return "Cualquier imprevisto puede obligarte a cerrar. Prioridad #1.";
  if (text.indexOf("frecuentes") >= 0) return "Los atrasos deterioran tu credibilidad y generan multas.";
  if (text.indexOf("50%") >= 0) return "Si ese cliente se va, tu operación se desestabiliza.";
  if (text.indexOf("flujo") >= 0 || text.indexOf("debilidad") >= 0) return "Un déficit de caja requiere intervención en cobranzas y gastos.";
  if (text.indexOf("baja") >= 0) return "Sin rentabilidad real, el negocio consume capital sin retorno.";
  return "Un endeudamiento excesivo reduce tu capacidad de reacción.";
}

export function getUrgencyLabel(val: number): { label: string; color: string } {
  if (val < 3) return { label: "Urgente", color: C.rd };
  if (val < 5) return { label: "Importante", color: C.or };
  if (val < 7) return { label: "Atender", color: C.yw };
  return { label: "Optimizar", color: C.gn };
}
