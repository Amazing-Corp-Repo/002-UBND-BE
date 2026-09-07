import * as fs from "node:fs";
import * as XLSX from "xlsx";

// SheetJS ESM does not load Node's filesystem module automatically.
// Register it once so readFile/writeFile keep working in server-side code.
XLSX.set_fs(fs);

export default XLSX;
