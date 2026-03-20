export async function sendEmail(
  tipo: "resultado_gratis" | "resultado_premium" | "followup_48h",
  destinatario: string,
  nombre: string,
  score: number,
  rango: string,
  label: string,
  alertas: string[],
  color: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        destinatario,
        nombre,
        score,
        rango,
        label,
        alertas,
        color,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Error enviando email:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error enviando email:", err);
    return false;
  }
}