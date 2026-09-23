import OBRAS from "./data/obras.json";

export { OBRAS };

export const nf = (n, d = 1) => Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (a, b, d = 1) => (b > 0 ? nf((a / b) * 100, d) + "%" : "–");

export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const ymLabel = (ym) => {
  const [y, m] = ym.split("-");
  return MESES[Number(m) - 1] + "-" + y.slice(2);
};

// Meses disponibles (de la primera a la última instalación registrada)
const allYm = OBRAS.flatMap((o) => o.meses.map((m) => m.ym)).sort();
export const YM_MIN = allYm[0];
export const YM_MAX = allYm[allYm.length - 1];
export const YM_LIST = (() => {
  const out = [];
  let [y, m] = YM_MIN.split("-").map(Number);
  const [ye, me] = YM_MAX.split("-").map(Number);
  while (y < ye || (y === ye && m <= me)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
})();

export const ORDEN = {
  rango: ["Micro (1–4 kWp)", "Pequeña (5–12 kWp)", "Mediana (13–40 kWp)", "Grande (41–99 kWp)", "Muy grande (100–300 kWp)", "Parque solar (>300 kWp)"],
  implantacion: ["En techo", "En suelo", "Cochera solar"],
  estructura: ["Baratec (suelo)", "Coplanar", "Cochera solar", "Triangular / Telescópica / Regulable", "RS10"],
  marca: ["Huawei", "Deye", "Fronius", "Victron"],
  sistema: ["On grid", "Híbrido", "Off grid"],
};
export const WP_LIST = [...new Set(OBRAS.map((o) => o.wp).filter(Boolean))].sort((a, b) => a - b);
export const capw = (t) => t.split(" + ").map((p) => p[0] + p.slice(1).toLowerCase()).join(" + ");
export const marcasDe = (o) => o.marca.split(" + ").map((p) => p[0] + p.slice(1).toLowerCase());

export const FILTROS_VACIOS = { desde: YM_MIN, hasta: YM_MAX, rango: [], implantacion: [], estructura: [], marca: [], sistema: [], wp: [], q: "" };

// Aplica los filtros. La potencia de cada obra es la instalada dentro del rango de fechas elegido.
export function filtrar(f) {
  const q = f.q.trim().toLowerCase();
  const out = [];
  for (const o of OBRAS) {
    const regs = o.meses.filter((m) => m.ym >= f.desde && m.ym <= f.hasta);
    if (!regs.length) continue;
    if (f.rango.length && !f.rango.includes(o.rango)) continue;
    if (f.implantacion.length && !f.implantacion.includes(o.implantacion)) continue;
    if (f.estructura.length && !f.estructura.includes(o.estructura)) continue;
    if (f.sistema.length && !f.sistema.includes(o.sistema)) continue;
    if (f.wp.length && !f.wp.includes(o.wp)) continue;
    if (f.marca.length && !marcasDe(o).some((m) => f.marca.includes(m))) continue;
    if (q && !(o.obra.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q))) continue;
    const kwpSel = regs.reduce((t, m) => t + m.kwp, 0);
    out.push({ ...o, regs, kwpSel, mesesTxt: regs.map((m) => ymLabel(m.ym)).join(", ") });
  }
  return out;
}

// Participación por dimensión: [{ nombre, kwp, obras }]
export function participacion(list, keyFn, orden) {
  const g = new Map();
  for (const o of list) {
    const k = keyFn(o);
    if (k === null || k === undefined || k === "") continue;
    const a = g.get(k) || { nombre: String(k), kwp: 0, obras: 0 };
    a.kwp += o.kwpSel;
    a.obras += 1;
    g.set(k, a);
  }
  const arr = [...g.values()];
  if (orden) arr.sort((a, b) => (orden.indexOf(a.nombre) + 1 || 99) - (orden.indexOf(b.nombre) + 1 || 99));
  else arr.sort((a, b) => b.kwp - a.kwp);
  return arr;
}

export function mensual(list) {
  const m = {};
  for (const o of list) for (const r of o.regs) m[r.ym] = (m[r.ym] || 0) + r.kwp;
  return YM_LIST.map((ym) => ({ ym, mes: ymLabel(ym), anio: ym.slice(0, 4), kwp: Math.round((m[ym] || 0) * 10) / 10 }));
}

export function toCsv(list) {
  const cols = [
    ["Año", (o) => o.anio], ["Obra", (o) => o.obra], ["Meses", (o) => o.mesesTxt], ["kWp instalados", (o) => nf(o.kwpSel)],
    ["Potencia de la obra (kWp)", (o) => nf(o.potObra)], ["Rango", (o) => o.rango], ["Implantación", (o) => o.implantacion],
    ["Estructura (agrupada)", (o) => o.estructura], ["Estructura (detalle)", (o) => o.estructuraDetalle], ["Tipo de instalación", (o) => o.sistema],
    ["Marca inversor", (o) => capw(o.marca)], ["Acople (kW)", (o) => o.acople ?? ""], ["Panel (Wp)", (o) => o.wp ?? ""], ["Cantidad de paneles (BD)", (o) => o.paneles ?? ""], ["Cliente", (o) => o.cliente],
  ];
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  return "﻿" + [cols.map((c) => esc(c[0])).join(";"), ...list.map((o) => cols.map((c) => esc(c[1](o))).join(";"))].join("\n");
}
