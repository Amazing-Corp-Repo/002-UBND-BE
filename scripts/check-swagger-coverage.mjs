import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import swaggerDocument from "../src/swagger/index.js";

const ROOT_DIR = process.cwd();
const ROUTES_DIR = path.join(ROOT_DIR, "src", "routes");
const HIDDEN_OPERATIONS = new Set([
  "POST /api/users/create-admin-account",
  "POST /api/permission/sync",
]);
const HTTP_METHOD_PATTERN = /\.(get|post|put|patch|delete)\(/g;

const countSourceOperations = () => {
  return fs
    .readdirSync(ROUTES_DIR)
    .filter((file) => file.endsWith(".route.js") && file !== "root.route.js")
    .reduce((total, file) => {
      const source = fs.readFileSync(path.join(ROUTES_DIR, file), "utf8");
      return total + [...source.matchAll(HTTP_METHOD_PATTERN)].length;
    }, 0);
};

const swaggerOperations = Object.entries(swaggerDocument.paths).flatMap(
  ([pathName, pathItem]) =>
    Object.entries(pathItem)
      .filter(([method]) => ["get", "post", "put", "patch", "delete"].includes(method))
      .map(([method, operation]) => ({
        key: `${method.toUpperCase()} ${pathName}`,
        operation,
      })),
);

const sourceOperationCount = countSourceOperations();
const documentedOperationCount = swaggerOperations.length;

assert.equal(
  sourceOperationCount - HIDDEN_OPERATIONS.size,
  documentedOperationCount,
  "Every non-hidden route operation must have a Swagger operation",
);

for (const hiddenOperation of HIDDEN_OPERATIONS) {
  assert.equal(
    swaggerOperations.some(({ key }) => key === hiddenOperation),
    false,
    `${hiddenOperation} must remain hidden from Swagger`,
  );
}

for (const { key, operation } of swaggerOperations) {
  assert.ok(operation.summary, `${key} must declare a Swagger summary`);
  assert.ok(
    operation.responses && Object.keys(operation.responses).length > 0,
    `${key} must declare at least one response`,
  );
}

console.log(
  `Swagger coverage valid: ${documentedOperationCount} public operations; ${HIDDEN_OPERATIONS.size} hidden operations excluded.`,
);
