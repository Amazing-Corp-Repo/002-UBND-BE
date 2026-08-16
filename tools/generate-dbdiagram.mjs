// Phát sinh file DBML cho dbdiagram.io từ prisma/schema.prisma
// Chạy:  node tools/generate-dbdiagram.mjs
// Kết quả in ra stdout → dán vào https://dbdiagram.io/d
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const raw = readFileSync(join(ROOT, "prisma", "schema.prisma"), "utf-8");

const models = [];
const reModel = /^model\s+(\w+)\s*\{/gm;
let m;
while ((m = reModel.exec(raw)) !== null) {
  const name = m[1];
  const blockStart = raw.indexOf("{", m.index) + 1;
  let depth = 1;
  let i = blockStart;
  while (i < raw.length && depth > 0) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") depth--;
    i++;
  }
  models.push({ name, block: raw.slice(blockStart, i - 1) });
}

const SQL_TYPES = new Set([
  "String", "Boolean", "Int", "BigInt", "Float", "Decimal",
  "DateTime", "Json", "Inet", "Xml", "Url",
]);

function mapType(typeTok, attrs) {
  const isArray = typeTok.endsWith("[]");
  const clean = typeTok.replace(/[\[\]?]/g, "");
  // ưu tiên kiểu thật từ @db.TYPE(..)
  const dbm = /@db\.((\w+)(?:\(([^)]*)\))?)/.exec(attrs);
  let t;
  if (dbm) {
    const [ , , name, args] = dbm;
    switch (name) {
      case "VarChar": t = args ? `varchar(${args.trim().split(",")[0]})` : "varchar"; break;
      case "Uuid": t = "uuid"; break;
      case "Inet": t = "inet"; break;
      case "Timestamp": t = "timestamp"; break;
      case "Date": t = "date"; break;
      case "Decimal": t = args ? `decimal(${args.replace(/ /g, "")})` : "decimal"; break;
      case "Json": case "JsonB": t = "json"; break;
      default: t = name.toLowerCase();
    }
  } else {
    switch (clean) {
      case "String": t = "varchar(255)"; break;
      case "Boolean": t = "bool"; break;
      case "Int": t = "int"; break;
      case "BigInt": t = "bigint"; break;
      case "Float": t = "float"; break;
      case "Decimal": t = "decimal"; break;
      case "DateTime": t = "timestamp"; break;
      case "Json": t = "json"; break;
      case "Inet": t = "inet"; break;
      default: t = clean.toLowerCase();
    }
  }
  return isArray ? `${t}[]` : t;
}

function parseColumns(block) {
  const relMap = {}; // dbColumn -> {model, ref}
  const lines = [];
  for (const line of block.split("\n")) {
    if (line.trim() === "") continue;
    if (/^\s{2}/.test(line) === false) continue;
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
  return lines.map(({ name, typeTok, attrs }) => ({
    name,
    type: mapType(typeTok, attrs),
    isArray: typeTok.endsWith("[]"),
    isPK: /\b@id\b/.test(attrs),
    isUnique: /\b@unique\b/.test(attrs),
    isFK: !!relMap[name],
    target: relMap[name] || null,
  }));
}

const tables = models.map((mod) => ({ name: mod.name, cols: parseColumns(mod.block) }));

// ---- DBML ----
const out = [];
out.push("// UBND - Database Schema (sinh từ prisma/schema.prisma)");
out.push("");
for (const t of tables) {
  out.push(`Table ${t.name} {`);
  for (const col of t.cols) {
    const notes = [];
    if (col.isPK) notes.push("pk");
    if (col.isUnique) notes.push("unique");
    let line = `  ${col.name} ${col.type}`;
    if (notes.length) line += ` [${notes.join(", ")}]`;
    out.push(line);
  }
  out.push("}");
  out.push("");
}

// relationships
for (const t of tables) {
  for (const col of t.cols) {
    if (col.isFK && col.target) {
      out.push(`Ref: ${t.name}.${col.name} > ${col.target.model}.${col.target.ref}`);
    }
  }
}

process.stdout.write(out.join("\n"));
console.log("\n");