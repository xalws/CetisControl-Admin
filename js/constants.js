/* Constantes compartidas */
export const ESTATUS = ["Sin incidencias", "Castigo", "Falta notificada", "Reporte", "Alta para prácticas", "Pase de salud"];

export const ESTATUS_COLOR = {
  "Sin incidencias": "green", "Alta para prácticas": "green", "Pase de salud": "green",
  "Castigo": "red", "Falta notificada": "amber", "Reporte": "amber",
};

export const TURNOS = ["Matutino", "Vespertino"];

export const ROLES_PERMITIDOS = ["admin", "control_escolar", "enfermeria"];

/* Materias disponibles para armar horarios. Edita esta lista con las materias reales del plantel. */
export const MATERIAS = [
  "Álgebra", "Biología", "Cálculo diferencial", "Cálculo integral", "Ciencias sociales", "Ecología",
  "Educación física", "Estructura socioeconómica de México", "Ética", "Filosofía", "Física I", "Física II",
  "Geometría analítica", "Geometría y trigonometría", "Historia de México", "Informática", "Inglés I",
  "Inglés II", "Inglés III", "Inglés IV", "Lectura y redacción", "Metodología de la investigación",
  "Módulo profesional", "Probabilidad y estadística", "Química I", "Química II", "Tutoría",
].sort((a, b) => a.localeCompare(b, "es"));
