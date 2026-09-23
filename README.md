# Tablero de obras instaladas 2025–2026 (Ecovatio)

Tablero para el área de compras: detalle de las obras instaladas en 2025 y 2026, con filtros y % de participación.
Proyecto independiente (React + Vite + Tailwind + Recharts). Se despliega en Vercel desde GitHub.

## Qué incluye
- **Detalle de obras**: KPIs, potencia instalada por mes, tabla ordenable (clic en una fila = detalle mensual y estructura original) y descarga CSV.
- **% de participación**: por año, clasificación de potencia, implantación, tipo de estructura, marca de inversor, tipo de instalación, potencia del panel y tipo de cliente. Se puede ver sobre kWp o sobre cantidad de obras.
- **Filtros** (compartidos por ambas solapas): rango de fechas (mes desde / hasta), clasificación de potencia de la obra, implantación, estructura (agrupada), marca de inversor, tipo de instalación (on grid / híbrido / off grid) y potencia del panel (Wp). Sin selección = todos.

## Criterios de los datos
- Fuente: hojas PI 2025 y PI 2026 cruzadas con la BD de obras (reporte Excel `Reporte_Obras_Instaladas_2025-2026.xlsx`, hoja *Obras*).
- Estructuras agrupadas: **Baratec (suelo)** = Baratec + BT roscada + BT hincada + BT cementada; **Cochera solar** = Perfil P37/P38 + Perfil C; **Triangular / Telescópica / Regulable** (incluye Triangular c/ contrapesos); Coplanar y RS10 aparte.
- MATIAS LOPEZ se cuenta una sola vez (estaba duplicada en PI 2025). ORMAY 1 no se incluye.
- Con un rango de fechas, cada obra suma solo la potencia instalada en esos meses. Una obra que continúa en el año siguiente aparece una vez por año.
- Filtro de marca: por marca individual; una obra con dos marcas (ej. Victron + Huawei) aparece al elegir cualquiera de las dos.

## Actualizar los datos
1. Actualizar el Excel del reporte (hoja *Obras*).
2. Ejecutar (requiere Python con `openpyxl`):
   ```bash
   python scripts/export_data.py "ruta/al/Reporte_Obras_Instaladas_2025-2026.xlsx"
   ```
   Esto regenera `src/data/obras.json`.
3. `git add . && git commit -m "Actualizar datos" && git push` → Vercel despliega solo.

## Desarrollo local
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Despliegue
GitHub (repo propio) → Vercel: *Add New Project* → importar el repo → detecta Vite (build `npm run build`, salida `dist`). Cada `push` a `main` redespliega.
