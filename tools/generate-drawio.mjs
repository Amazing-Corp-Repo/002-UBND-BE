// Phát sinh sơ đồ draw.io (ER diagram) từ prisma/schema.prisma
// Chạy:  node tools/generate-drawio.mjs
// Output: database-schema.drawio (import thẳng vào https://app.diagrams.net)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const schemaPath = join(ROOT, "prisma", "schema.prisma");
const outPath = join(ROOT, "database-schema.drawio");

const raw = readFileSync(schemaPath, "utf-8");

// ---- Parse models ----
const models = [];
const reModel = /^model\s+(\w+)\s*\{/gm;
let m;
while ((m = reModel.exec(raw)) !== null) {
  const name = m[1];
  const blockStart = raw.indexOf("{", m.index) + 1;
  // find matching closing brace
  let depth = 1;
  let i = blockStart;
  while (i < raw.length && depth > 0) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") depth--;
    i++;
  }
  const block = raw.slice(blockStart, i - 1);
  models.push({ name, block });
}

// ---- Parse fields (columns) from a model block ----
// Column = line at 2-space indent, non-@, non-empty. Relations reverse lists (array type) excluded from rows.
// Also capture scalar FK -> target model from relation.
function parseColumns(block) {
  const SQL_TYPES = new Set([
    "String", "Boolean", "Int", "BigInt", "Float", "Decimal",
    "DateTime", "Json", "Inet", "Xml", "Url",
  ]);
  const relMap = {}; // dbColumn -> {model, ref}
  const lines = [];
  for (const line of block.split("\n")) {
    if (line.trim() === "") continue;
    if (/^\s{2}/.test(line) === false) continue; // must be nested
    const t = line.trim();
    if (t.startsWith("@")) continue;
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;
    const [name, typeTok, ...rest] = parts;
    const clean = typeTok.replace(/[\[\]?]/g, "");
    // field kiểu model (không phải SQL) = khai báo quan hệ → không phải cột DB
    if (!SQL_TYPES.has(clean)) {
      const fm = /fields:\s*\[\s*([\w]+)/.exec(t);
      const rm = /references:\s*\[\s*([\w]+)/.exec(t);
      if (fm && rm) relMap[fm[1]] = { model: clean, ref: rm[1] };
      continue;
    }
    lines.push({ name, typeTok, attrs: rest.join(" ") });
  }
  const cols = lines.map(({ name, typeTok, attrs }) => ({
    name,
    type: typeTok.replace(/[\[\]?]/g, ""),
    isArray: typeTok.endsWith("[]"),
    isPK: /\b@id\b/.test(attrs),
    isUnique: /\b@unique\b/.test(attrs),
    isDefault: /\b@default\b/.test(attrs),
    isFK: !!relMap[name],
    target: relMap[name] ? relMap[name].model : null,
  }));
  return cols;
}

const tables = models.map((mod) => ({ name: mod.name, cols: parseColumns(mod.block) }));

// ---- draw.io generators ----
const rowH = 24;
const headH = 30;
const colW = 300;
const padX = 40;
const padY = 40;
const GRID = 5; // columns of tables

const colsByModel = Object.fromEntries(tables.map((t) => [t.name, t.cols]));

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellStyle(col) {
  // key badge
  if (col.isPK) return { txt: "PK · " + col.name, fc: "#fff2cc", sc: "#d6b656" };
  if (col.isArray) return { txt: col.name + "  (" + col.type + ")[]", fc: "#f5f5f5", sc: "#999999", it: 1 };
  if (col.isFK) return { txt: "FK · " + col.name, fc: "#dae8fc", sc: "#6c8ebf" };
  if (col.isUnique) return { txt: "UQ · " + col.name, fc: "#d5e8d4", sc: "#82b366" };
  if (col.isDefault) return { txt: col.name + "  =" + defShort(col), fc: "#ffffff", sc: "#d5d5d5" };
  return { txt: col.name, fc: "#ffffff", sc: "#d5d5d5" };
}
function defShort(col) {
  return "";
}

// colors per module prefix
const palette = {
  AUDIT: "#f8cecc", AUTH: "#d5e8d4", PA: "#ffe6cc", TTHC: "#dae8fc",
  TIN: "#fff2cc", VIDEO: "#e1d5e7", DEFAULT: "#dae8fc",
};
function moduleColor(name) {
  for (const k of Object.keys(palette)) if (name.includes(k.toLowerCase())) return palette[k];
  return palette.DEFAULT;
}

// ---- layout: cân bằng theo cột (tránh chồng lấn bàn cao) ----
const cells = [];
const edges = [];
const colHeights = new Array(GRID).fill(padY);

const ids = {};
let nodeId = 2;
for (let ti = 0; ti < tables.length; ti++) {
  const t = tables[ti];
  const h = headH + t.cols.length * rowH;
  // chọn cột có chiều cao đang nhỏ nhất
  let c = 0;
  for (let k = 1; k < GRID; k++) if (colHeights[k] < colHeights[c]) c = k;
  const x = c * (colW + padX) + padX;
  const y = colHeights[c];
  colHeights[c] += h + 40;
  const nid = "n" + nodeId++;
  ids[t.name] = nid;

  const headerFc = moduleColor(t.name);
  // table container
  cells.push(
    `<mxCell id="${nid}" value="${esc(t.name)}" style="swimlane;fontStyle=1;align=center;fillColor=${headerFc};strokeColor=#000000;fontColor=#000000;startSize=${headH};childLayout=stackLayout;horizontal=1;horizontalStack=0;resizeParent=0;resizeParentMax=0;collapsible=0;marginBottom=0;rounded=1;container=1;overflow=fill;" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${colW}" height="${h}" as="geometry"/></mxCell>`
  );
  // column rows
  let rowY = headH;
  for (const col of t.cols) {
    const st = cellStyle(col);
    const rowId = nid + "_" + col.name;
    const typeTxt = col.isArray ? st.txt : `${st.txt} &lt;i&gt;${esc(col.type)}&lt;/i&gt;`;
    cells.push(
      `<mxCell id="${rowId}" value="${typeTxt}" style="text;html=1;fillColor=${st.fc};strokeColor=${st.sc};fontSize=11;fontColor=#000000;fontStyle=${st.it ? 2 : 0};align=left;verticalAlign=middle;spacingLeft=6;spacingRight=6;overflow=hidden;" vertex="1" parent="${nid}"><mxGeometry x="0" y="${rowY}" width="${colW}" height="${rowH}" as="geometry"/></mxCell>`
    );
    rowY += rowH;
  }
}

// edges (FK): child table -> parent table
let edgeId = 9000;
for (const t of tables) {
  for (const col of t.cols) {
    if (!col.target) continue;
    const src = ids[t.name];
    const dst = ids[col.target];
    if (!src || !dst) continue;
    edges.push(
      `<mxCell id="e${edgeId}" value="${esc(col.name)}" style="edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;entryX=0;entryY=0.5;exitX=1;exitY=0.5;fontSize=9;strokeColor=#6c8ebf;targetPerimeterSpacing=0;sourcePerimeterSpacing=0;" edge="1" parent="1" source="${src}" target="${dst}"><mxGeometry relative="1" as="geometry"/></mxCell>`
    );
    edgeId++;
  }
}

// ---- assemble xml ----
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" agent="DB-Schema-Generator" version="23.1.2">
  <diagram id="db-schema" name="UBND - Database Schema">
    <mxGraphModel dx="1600" dy="2000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="0" page="1" pageScale="1" pageWidth="${GRID * (colW + padX) + padX}" pageHeight="${Math.max(...colHeights)}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells.join("\n        ")}
        ${edges.join("\n        ")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, xml, "utf-8");
console.log(`OK — ${tables.length} bảng, ${edges.length} FK edge`);
console.log("Output:", outPath);