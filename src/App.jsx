import React, { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import {
  FILTROS_VACIOS, ORDEN, WP_LIST, YM_LIST, capw, filtrar, marcasDe, mensual, nf, participacion, pct, toCsv, ymLabel,
} from "./lib.js";

const PALETA = ["#95de1d", "#c7ee8a", "#b9c7c9", "#5f8f97", "#e4f5c4", "#7a9aa1", "#3f7a52", "#d9e36a"];

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 text-sm transition-colors " +
        (active ? "border-green bg-green text-bg font-semibold" : "border-line bg-card2 text-white hover:border-green")
      }
    >
      {children}
    </button>
  );
}

function Grupo({ titulo, opciones, valor, onChange, fmt = (x) => x }) {
  const toggle = (v) => onChange(valor.includes(v) ? valor.filter((x) => x !== v) : [...valor, v]);
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{titulo}</div>
      <div className="flex flex-wrap gap-1.5">
        {opciones.map((o) => (
          <Chip key={String(o)} active={valor.includes(o)} onClick={() => toggle(o)}>
            {fmt(o)}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Kpi({ etiqueta, valor, nota }) {
  return (
    <div className="rounded-xl bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{etiqueta}</div>
      <div className="mt-1 text-3xl font-bold text-green">{valor}</div>
      {nota && <div className="mt-0.5 text-sm text-muted">{nota}</div>}
    </div>
  );
}

function Filtros({ f, setF, total }) {
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const hayFiltros = JSON.stringify({ ...f, q: "" }) !== JSON.stringify({ ...FILTROS_VACIOS, q: "" }) || f.q;
  return (
    <section className="space-y-4 rounded-xl bg-card p-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Desde</span>
          <select
            value={f.desde}
            onChange={(e) => setF({ ...f, desde: e.target.value, hasta: e.target.value > f.hasta ? e.target.value : f.hasta })}
            className="rounded-md border border-line bg-card2 px-2 py-1.5"
          >
            {YM_LIST.map((ym) => <option key={ym} value={ym}>{ymLabel(ym)}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Hasta</span>
          <select
            value={f.hasta}
            onChange={(e) => setF({ ...f, hasta: e.target.value, desde: e.target.value < f.desde ? e.target.value : f.desde })}
            className="rounded-md border border-line bg-card2 px-2 py-1.5"
          >
            {YM_LIST.map((ym) => <option key={ym} value={ym}>{ymLabel(ym)}</option>)}
          </select>
        </label>
        <div className="flex gap-1.5">
          <Chip active={f.desde === "2025-01" && f.hasta === "2025-12"} onClick={() => setF({ ...f, desde: "2025-01", hasta: "2025-12" })}>Solo 2025</Chip>
          <Chip active={f.desde === "2026-01" && f.hasta === YM_LIST[YM_LIST.length - 1]} onClick={() => setF({ ...f, desde: "2026-01", hasta: YM_LIST[YM_LIST.length - 1] })}>Solo 2026</Chip>
          <Chip active={f.desde === YM_LIST[0] && f.hasta === YM_LIST[YM_LIST.length - 1]} onClick={() => setF({ ...f, desde: YM_LIST[0], hasta: YM_LIST[YM_LIST.length - 1] })}>Todo</Chip>
        </div>
        <label className="min-w-[220px] flex-1 text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Buscar obra o cliente</span>
          <input
            value={f.q}
            onChange={(e) => set("q")(e.target.value)}
            placeholder="Ej.: Belgrano, Industrial…"
            className="w-full rounded-md border border-line bg-card2 px-3 py-1.5 placeholder:text-muted/60"
          />
        </label>
        {hayFiltros && (
          <button onClick={() => setF(FILTROS_VACIOS)} className="rounded-md border border-green px-3 py-1.5 text-sm text-green hover:bg-green hover:text-bg">
            Limpiar filtros
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Grupo titulo="Clasificación de potencia (de la obra)" opciones={ORDEN.rango} valor={f.rango} onChange={set("rango")} fmt={(x) => x.replace(" kWp)", ")").replace("Parque solar", "Parque")} />
        <Grupo titulo="Implantación" opciones={ORDEN.implantacion} valor={f.implantacion} onChange={set("implantacion")} />
        <Grupo titulo="Tipo de estructura (agrupada)" opciones={ORDEN.estructura} valor={f.estructura} onChange={set("estructura")} />
        <Grupo titulo="Tipo de instalación" opciones={ORDEN.sistema} valor={f.sistema} onChange={set("sistema")} />
        <Grupo titulo="Marca de inversor" opciones={ORDEN.marca} valor={f.marca} onChange={set("marca")} />
        <Grupo titulo="Potencia del panel (Wp)" opciones={WP_LIST} valor={f.wp} onChange={set("wp")} fmt={(x) => x + " Wp"} />
      </div>
      <div className="text-xs text-muted">
        Sin selección = todos. Dentro de cada grupo se pueden elegir varias opciones; entre grupos los filtros se combinan (y). Con un rango de fechas, cada obra suma solo lo instalado en esos meses.
      </div>
    </section>
  );
}

function GraficoMensual({ list }) {
  const data = useMemo(() => mensual(list).filter((d) => d.kwp > 0 || true), [list]);
  return (
    <div className="rounded-xl bg-card p-4">
      <div className="mb-2 text-sm font-semibold">Potencia instalada por mes (kWp)</div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fill: "#b9c7c9", fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={45} />
            <YAxis hide />
            <Tooltip formatter={(v) => [nf(v) + " kWp", "Instalado"]} contentStyle={{ background: "#1d3c44", border: "1px solid #3b5d65", color: "#fff" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar isAnimationActive={false} dataKey="kwp" radius={[3, 3, 0, 0]}>
              {data.map((d) => <Cell key={d.ym} fill={d.anio === "2025" ? "#b9c7c9" : "#95de1d"} />)}
              <LabelList dataKey="kwp" position="top" fill="#fff" fontSize={10} formatter={(v) => (v > 0 ? Math.round(v) : "")} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex gap-4 text-xs text-muted">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-muted" />2025</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green" />2026</span>
      </div>
    </div>
  );
}

const AL = { left: "text-left", right: "text-right", center: "text-center" };
const COLS = [
  ["anio", "Año", (o) => o.anio, "center"],
  ["obra", "Obra", (o) => o.obra, "left"],
  ["mesesTxt", "Meses", (o) => o.mesesTxt, "left"],
  ["kwpSel", "kWp", (o) => nf(o.kwpSel), "right"],
  ["potObra", "Pot. obra kWp", (o) => nf(o.potObra), "right"],
  ["rango", "Rango", (o) => o.rango.split(" (")[0], "left"],
  ["implantacion", "Implantación", (o) => o.implantacion, "left"],
  ["estructura", "Estructura", (o) => o.estructura, "left"],
  ["sistema", "Instalación", (o) => o.sistema, "left"],
  ["marca", "Inversor", (o) => capw(o.marca), "left"],
  ["acople", "Acople kW", (o) => o.acople ?? "–", "right"],
  ["wp", "Panel Wp", (o) => o.wp ?? "–", "right"],
  ["paneles", "Paneles (BD)", (o) => o.paneles ?? "–", "right"],
  ["cliente", "Cliente", (o) => o.cliente, "left"],
];

function Tabla({ list }) {
  const [orden, setOrden] = useState({ k: "kwpSel", d: -1 });
  const [abierta, setAbierta] = useState(null);
  const sorted = useMemo(() => {
    const a = [...list];
    a.sort((x, y) => {
      const vx = x[orden.k] ?? -Infinity, vy = y[orden.k] ?? -Infinity;
      return (typeof vx === "number" && typeof vy === "number" ? vx - vy : String(vx).localeCompare(String(vy), "es")) * orden.d;
    });
    return a;
  }, [list, orden]);
  const descargar = () => {
    const blob = new Blob([toCsv(sorted)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "obras_filtradas.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="rounded-xl bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Detalle de obras ({list.length})</div>
        <button onClick={descargar} className="rounded-md border border-line px-3 py-1 text-sm hover:border-green">Descargar CSV</button>
      </div>
      <div className="max-h-[560px] overflow-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-green text-bg">
            <tr>
              {COLS.map(([k, t, , al]) => (
                <th key={k} onClick={() => setOrden(orden.k === k ? { k, d: -orden.d } : { k, d: k === "obra" ? 1 : -1 })}
                  className={"cursor-pointer whitespace-nowrap px-2.5 py-2 font-semibold select-none " + AL[al]}>
                  {t}{orden.k === k ? (orden.d > 0 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((o, i) => (
              <React.Fragment key={o.id}>
                <tr onClick={() => setAbierta(abierta === o.id ? null : o.id)} className={"cursor-pointer hover:bg-line " + (i % 2 ? "bg-card2" : "bg-card")}>
                  {COLS.map(([k, , fn, al]) => (
                    <td key={k} className={"whitespace-nowrap px-2.5 py-1.5 " + AL[al] + (k === "obra" ? " font-semibold" : "") + (k === "kwpSel" ? " font-bold text-green" : "")}>{fn(o)}</td>
                  ))}
                </tr>
                {abierta === o.id && (
                  <tr className="bg-bg">
                    <td colSpan={COLS.length} className="px-4 py-3 text-sm text-muted">
                      <b className="text-white">{o.obra} ({o.anio})</b> · Estructura original: <b className="text-white">{o.estructuraDetalle}</b> · Potencia total de la obra: <b className="text-white">{nf(o.potObra)} kWp</b> ·
                      Instalado por mes: {o.regs.map((r) => `${ymLabel(r.ym)} ${nf(r.kwp)} kWp`).join(" · ")}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!sorted.length && <tr><td colSpan={COLS.length} className="p-6 text-center text-muted">No hay obras con estos filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted">Tocá una fila para ver el detalle mensual. Una obra que continúa en el año siguiente aparece una vez por año.</div>
    </div>
  );
}

function Detalle({ list }) {
  const kwp = list.reduce((t, o) => t + o.kwpSel, 0);
  const onGrid = list.filter((o) => o.sistema === "On grid").reduce((t, o) => t + o.kwpSel, 0);
  const wps = list.filter((o) => o.wp);
  const wpProm = wps.reduce((t, o) => t + o.wp * o.kwpSel, 0) / (wps.reduce((t, o) => t + o.kwpSel, 0) || 1);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi etiqueta="Potencia instalada" valor={nf(kwp) + " kWp"} />
        <Kpi etiqueta="Obras" valor={nf(list.length, 0)} nota={"Promedio " + nf(list.length ? kwp / list.length : 0) + " kWp por obra"} />
        <Kpi etiqueta="On grid" valor={pct(onGrid, kwp)} nota={nf(onGrid) + " kWp"} />
        <Kpi etiqueta="Panel promedio" valor={wps.length ? nf(wpProm, 0) + " Wp" : "–"} nota="Ponderado por kWp" />
      </div>
      <GraficoMensual list={list} />
      <Tabla list={list} />
    </div>
  );
}

function Participacion({ list }) {
  const [metrica, setMetrica] = useState("kwp");
  const total = list.reduce((t, o) => t + (metrica === "kwp" ? o.kwpSel : 1), 0);
  const dims = [
    ["Año", participacion(list, (o) => o.anio)],
    ["Clasificación de potencia", participacion(list, (o) => o.rango, ORDEN.rango)],
    ["Implantación", participacion(list, (o) => o.implantacion, ORDEN.implantacion)],
    ["Tipo de estructura", participacion(list, (o) => o.estructura, ORDEN.estructura)],
    ["Marca de inversor", participacion(list, (o) => capw(o.marca))],
    ["Tipo de instalación", participacion(list, (o) => o.sistema, ORDEN.sistema)],
    ["Potencia del panel", participacion(list, (o) => (o.wp ? o.wp + " Wp" : "Sin dato"), WP_LIST.map((w) => w + " Wp"))],
    ["Tipo de cliente", participacion(list, (o) => o.cliente)],
  ];
  const val = (d) => (metrica === "kwp" ? d.kwp : d.obras);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-muted">Participación sobre:</div>
        <Chip active={metrica === "kwp"} onClick={() => setMetrica("kwp")}>Potencia (kWp)</Chip>
        <Chip active={metrica === "obras"} onClick={() => setMetrica("obras")}>Cantidad de obras</Chip>
        <div className="text-sm text-muted">Total filtrado: <b className="text-white">{metrica === "kwp" ? nf(total) + " kWp" : nf(total, 0) + " obras"}</b></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {dims.map(([titulo, data]) => (
          <div key={titulo} className="rounded-xl bg-card p-4">
            <div className="mb-2 text-sm font-semibold">{titulo}</div>
            {!data.length ? <div className="p-6 text-center text-muted">Sin datos</div> : (
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie isAnimationActive={false} data={data.map((d) => ({ ...d, v: val(d) }))} dataKey="v" nameKey="nombre" innerRadius={42} outerRadius={80} stroke="#26474f" strokeWidth={2}>
                        {data.map((d, i) => <Cell key={d.nombre} fill={PALETA[i % PALETA.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [metrica === "kwp" ? nf(v) + " kWp (" + pct(v, total) + ")" : v + " obras (" + pct(v, total) + ")", n]} contentStyle={{ background: "#1d3c44", border: "1px solid #3b5d65", color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full flex-1 space-y-1.5">
                  {data.map((d, i) => (
                    <div key={d.nombre} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PALETA[i % PALETA.length] }} />{d.nombre}</span>
                        <span className="whitespace-nowrap"><b className="text-green">{pct(val(d), total)}</b> <span className="text-muted">· {metrica === "kwp" ? nf(d.kwp) + " kWp" : d.obras + (d.obras === 1 ? " obra" : " obras")}</span></span>
                      </div>
                      <div className="h-1.5 rounded bg-bg"><div className="h-1.5 rounded" style={{ width: (total ? (val(d) / total) * 100 : 0) + "%", background: PALETA[i % PALETA.length] }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-xs text-muted">Los porcentajes respetan los filtros de arriba. En "Marca de inversor" las combinaciones (Ej.: Victron + Huawei) son obras con dos marcas.</div>
    </div>
  );
}

export default function App() {
  const [f, setF] = useState(FILTROS_VACIOS);
  const [tab, setTab] = useState("detalle");
  const list = useMemo(() => filtrar(f), [f]);
  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Obras instaladas 2025–2026</h1>
          <p className="text-sm text-muted">Potencia, implantación, estructura, paneles e inversores · insumo para evaluar compras</p>
        </div>
        <img src="/logo-ecovatio.png" alt="Ecovatio" className="h-8" />
      </header>
      <Filtros f={f} setF={setF} />
      <nav className="flex gap-2">
        <Chip active={tab === "detalle"} onClick={() => setTab("detalle")}>Detalle de obras</Chip>
        <Chip active={tab === "part"} onClick={() => setTab("part")}>% de participación</Chip>
      </nav>
      {tab === "detalle" ? <Detalle list={list} /> : <Participacion list={list} />}
      <footer className="pb-4 text-xs text-muted">
        Fuente: hojas PI 2025 y PI 2026 cruzadas con la BD de obras. MATIAS LOPEZ se cuenta una sola vez y ORMAY 1 no está incluida. Datos al 23/09/2026.
      </footer>
    </div>
  );
}
