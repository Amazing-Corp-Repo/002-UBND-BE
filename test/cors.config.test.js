import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_CORS_ORIGINS,
  isCorsOriginAllowed,
} from "../src/config/cors.config.js";

const CITIZEN_WEB_ORIGIN =
  "https://cong-dan-tangnhonphu-git-update-digital-map-long-d139.vercel.app";

test("allows the deployed Citizen Web origin", () => {
  assert.ok(BUILT_IN_CORS_ORIGINS.includes(CITIZEN_WEB_ORIGIN));
  assert.equal(isCorsOriginAllowed(CITIZEN_WEB_ORIGIN, []), true);
});

test("allows an explicitly configured origin and server-side requests", () => {
  assert.equal(
    isCorsOriginAllowed("https://admin.example.com", [
      "https://admin.example.com",
    ]),
    true
  );
  assert.equal(isCorsOriginAllowed(undefined, []), true);
});

test("allows all origins only when wildcard is configured", () => {
  assert.equal(isCorsOriginAllowed("https://preview.example.com", ["*"]), true);
});

test("rejects untrusted origins including lookalike domains", () => {
  assert.equal(isCorsOriginAllowed("https://unknown.example.com", []), false);
  assert.equal(
    isCorsOriginAllowed(`${CITIZEN_WEB_ORIGIN}.evil.example`, []),
    false
  );
});
