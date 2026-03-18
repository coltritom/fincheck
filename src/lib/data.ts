// ═══ COLORS ═══
export const C = {
  bg: "#050509",
  sf: "#0C0C14",
  sl: "#12121E",
  bd: "#1A1A2E",
  bl: "#252540",
  mg: "#fe26fe",
  mgd: "#fe26fe40",
  mgg: "#fe26fe20",
  cy: "#008efe",
  cyd: "#008efe40",
  cyg: "#008efe20",
  ic: "#cbfaff",
  wh: "#E8EAF0",
  mu: "#6B7194",
  ml: "#8890B0",
  rd: "#FF4D6A",
  rdb: "#FF4D6A15",
  or: "#FF9F43",
  orb: "#FF9F4315",
  yw: "#FBBF24",
  gn: "#34D399",
};

// ═══ QUESTIONS ═══
export interface Question {
  dm: string;
  q: string;
  o: string[];
  s: number[];
}

export const QUESTIONS: Question[] = [
  {
    dm: "Flujo de caja",
    q: "En los últimos 3 meses, ¿cuántas veces no te alcanzó el efectivo para cubrir un pago en fecha?",
    o: ["Ninguna vez", "Una vez, fue puntual", "Dos o tres veces", "Cuatro o más, es habitual"],
    s: [10, 7, 3, 0],
  },
  {
    dm: "Flujo de caja",
    q: "Si mañana tuvieras un gasto imprevisto de un mes de costos fijos, ¿podrías cubrirlo sin pedir prestado?",
    o: ["Sí, tengo reservas de sobra", "Podría, pero quedaría muy justo", "Solo cubriría la mitad o menos", "No podría de ninguna manera"],
    s: [10, 6, 3, 0],
  },
  {
    dm: "Rentabilidad",
    q: "En los últimos 3 meses, después de pagar todo (incluido pagarte un sueldo razonable), ¿te quedó plata en el negocio?",
    o: ["Sí, consistentemente queda excedente", "Algunos meses sí, otros quedo en cero", "Generalmente quedo en cero o negativo", "Ni siquiera puedo pagarme un sueldo"],
    s: [10, 5, 2, 0],
  },
  {
    dm: "Rentabilidad",
    q: "En los últimos 6 meses, ¿cómo evolucionaron tus ventas respecto a tus gastos?",
    o: ["Ventas crecieron, gastos se mantuvieron", "Ambos crecieron, ventas más rápido", "Se movieron igual", "Gastos crecieron más que ventas", "Las ventas bajaron"],
    s: [10, 7, 4, 1, 0],
  },
  {
    dm: "Cobranzas",
    q: "Del total facturado en los últimos 3 meses, ¿qué porcentaje cobraste en los plazos acordados?",
    o: ["Más del 90%", "Entre 70% y 90%", "Entre 50% y 70%", "Menos del 50%"],
    s: [10, 6, 3, 0],
  },
  {
    dm: "Cobranzas",
    q: "¿Cobrás antes, al mismo tiempo o después de pagar a tus proveedores?",
    o: ["Cobro antes de pagar", "Cobro y pago al mismo tiempo", "Pago antes, diferencia chica", "Pago mucho antes, me genera problemas"],
    s: [10, 7, 4, 0],
  },
  {
    dm: "Endeudamiento",
    q: "¿Cuánto representan las cuotas de deuda respecto a tu facturación mensual?",
    o: ["No tengo deudas (<5%)", "Entre 5% y 20%", "Entre 20% y 40%", "Más del 40%", "Estoy atrasado en pagos"],
    s: [10, 7, 4, 1, 0],
  },
  {
    dm: "Endeudamiento",
    q: "Cuando te falta efectivo, ¿qué tan grave suele ser el faltante?",
    o: ["No suele faltarme", "Poco, pospongo gastos no urgentes", "Importante, recurro a tarjeta o préstamos", "Grave, no cubro sueldos o proveedores clave"],
    s: [10, 7, 3, 0],
  },
  {
    dm: "Precios",
    q: "¿Sabés exactamente cuánto te cuesta producir o entregar cada producto/servicio?",
    o: ["Sí, conozco el costo completo", "Conozco los principales, no todos", "Tengo idea general, sin cálculo preciso", "No sé cuánto me cuesta realmente"],
    s: [10, 6, 3, 0],
  },
  {
    dm: "Orden",
    q: "¿Cuál de estas frases describe mejor cómo gestionás tus finanzas?",
    o: ["Cuentas separadas, sueldo fijo, registros al día", "Mayormente separadas, registros no siempre al día", "Bastante mezcladas, registro parcial", "Todo mezclado, sin registro organizado"],
    s: [10, 6, 3, 0],
  },
  {
    dm: "Precios",
    q: "Cuando tus costos suben, ¿qué hacés con tus precios?",
    o: ["Ajusto rápido para mantener margen", "Ajusto con demora", "Solo ajusto si la suba es muy grande", "Casi nunca ajusto por miedo a perder clientes"],
    s: [10, 6, 3, 0],
  },
  {
    dm: "Concentración",
    q: "¿Qué porcentaje de tus ingresos depende de tu cliente principal?",
    o: ["Menos del 15%", "Entre 15% y 30%", "Entre 30% y 50%", "Más del 50%"],
    s: [10, 7, 4, 0],
  },
  {
    dm: "Endeudamiento",
    q: "En los últimos 6 meses, ¿te atrasaste en impuestos, sueldos, alquiler o servicios por falta de caja?",
    o: ["Nunca me atrasé", "Una vez, algo puntual", "Varias veces", "Me atraso frecuentemente"],
    s: [10, 6, 2, 0],
  },
  {
    dm: "Flujo de caja",
    q: "¿Cuánto tiempo podrías mantener el negocio si mañana dejaras de vender?",
    o: ["Más de 3 meses", "Entre 1 y 3 meses", "Menos de 1 mes", "Ni una semana"],
    s: [10, 6, 2, 0],
  },
];

// ═══ DIMENSIONS ═══
export interface Dimension {
  k: string;
  l: string;
  w: number;
  qi: number[];
}

export const DIMS: Dimension[] = [
  { k: "Flujo de caja", l: "Flujo de caja", w: 0.25, qi: [0, 1, 13] },
  { k: "Rentabilidad", l: "Rentabilidad", w: 0.15, qi: [2, 3] },
  { k: "Cobranzas", l: "Cobranzas", w: 0.15, qi: [4, 5] },
  { k: "Endeudamiento", l: "Endeudamiento", w: 0.15, qi: [6, 7, 12] },
  { k: "Precios", l: "Precios y costos", w: 0.10, qi: [8, 10] },
  { k: "Orden", l: "Orden admin.", w: 0.10, qi: [9] },
  { k: "Concentración", l: "Concentración", w: 0.10, qi: [11] },
];

// ═══ RECOMMENDATIONS ═══
export const ACTION_PLANS = [
  {
    period: "7 días",
    color: C.rd,
    items: [
      "Listá pagos pendientes de los próximos 30 días por urgencia",
      "Contactá deudores con facturas vencidas",
      "Calculá costo real de tus 3 productos principales",
    ],
  },
  {
    period: "30 días",
    color: C.or,
    items: [
      "Armá flujo de caja proyectado semanal para 4 semanas",
      "Implementá política de cobranza con recordatorios",
      "Evaluá refinanciamiento si deuda supera 25%",
    ],
  },
  {
    period: "90 días",
    color: C.gn,
    items: [
      "Revisión semanal de flujo de caja (viernes)",
      "Diversificá tu cartera de clientes",
      "Construí colchón de 1 mes de costos fijos",
    ],
  },
];

export const STANDARDS = [
  { l: "Cuotas de deuda", s: "< 20% facturación", dimKey: "Endeudamiento" },
  { l: "Cobranza en plazo", s: "> 90% en tiempo", dimKey: "Cobranzas" },
  { l: "Reserva de emergencia", s: "2-3 meses costos fijos", dimKey: "Flujo de caja" },
];

// ═══ MODAL SELECT OPTIONS ═══
export const RUBROS = ["Comercio", "Servicios", "Industria", "Gastronomía", "Tecnología", "Salud", "Construcción", "Agro", "Logística", "Otro"];
export const EMPLEADOS = ["Solo/a", "1 a 5", "6 a 10", "11 a 25", "26 a 50", "Más de 50"];
export const FACTURACION = ["Menos de USD 2.000", "USD 2.000 a USD 5.000", "USD 5.001 a USD 10.000", "USD 10.001 a USD 25.000", "USD 25.001 a USD 50.000", "Más de USD 50.000", "Prefiero no indicarlo"];
export const MOTIVOS = ["Falta de caja / problemas de flujo", "No sé si mi negocio es rentable", "Necesito ordenar números e indicadores", "Tengo problemas de cobranzas", "Tengo dudas sobre precios y márgenes", "Estoy muy endeudado o mal financiado", "Necesito un diagnóstico financiero integral", "Quiero profesionalizar la gestión financiera", "Otro"];
export const URGENCIAS = ["Lo necesito esta semana", "En los próximos 30 días", "Solo quiero evaluarlo por ahora"];

// ═══ UPSELL FEATURES ═══
export const UPSELL_FEATURES = [
  "Scores exactos por dimensión",
  "Todas las alertas con explicación",
  "Orden de prioridad 1-2-3",
  "Plan de acción a 7, 30 y 90 días",
  "Checklist de implementación",
  "3 plantillas accionables",
];

export const CHECKOUT_FEATURES = [
  "Scores exactos de las 7 dimensiones",
  "Plan de acción a 7, 30 y 90 días",
  "Checklist + 3 plantillas accionables",
  "Acceso inmediato y permanente",
];
