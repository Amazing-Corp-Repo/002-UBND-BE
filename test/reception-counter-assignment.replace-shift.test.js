import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import Repository, {
  RECEPTION_ASSIGNMENT_TRANSACTION_OPTIONS,
} from "../src/repositories/reception-counter-assignment.repository.js";
import router from "../src/routes/reception-shift-assignment.route.js";
import Swagger from "../src/swagger/reception-counter-assignment.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const shiftId = "323e4567-e89b-42d3-a456-426614174001";
const configurationId = "223e4567-e89b-42d3-a456-426614174001";
const officerId = "523e4567-e89b-42d3-a456-426614174001";
const currentUserId = "123e4567-e89b-42d3-a456-426614174000";
const originals = {
  findShift: Repository.findActiveShiftById,
  findConfigurations: Repository.findActiveConfigurationsByIds,
  findOfficers: Repository.findActiveOfficersByIds,
  replace: Repository.replaceForShift,
  audit: prisma.audit_logs.create,
};
let received;
const token = (permissions) => jwtUtils.signAccessToken(
  { id: currentUserId, ten_dang_nhap: "manager", permissions, roles: ["STAFF"] },
  "127.0.0.1"
);
const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-shifts", router);
  app.use(errorHandler);
  return app.listen(0);
};
const body = {
  assignments: [{ counterConfigurationId: configurationId, officerId }],
};
const assignmentRecord = {
  id: "423e4567-e89b-42d3-a456-426614174001",
  id_cau_hinh_quay: configurationId,
  is_active: true,
  can_bo: { id: officerId, ho_va_ten: "Nguyễn Văn An", ten_dang_nhap: "canbo" },
  cau_hinh_quay: {
    id_ca_tiep_dan: shiftId,
    quay_tiep_dan: {
      id: "623e4567-e89b-42d3-a456-426614174001",
      ma_quay: "QUAY_1",
      ten_quay: "Quầy số 1",
    },
    ca_tiep_dan: {
      gio_bat_dau: "07:30",
      gio_ket_thuc: "08:30",
      lich_tiep_dan: { ngay_tiep_dan: "2026-08-26" },
    },
  },
};

beforeEach(() => {
  received = null;
  Repository.findActiveShiftById = async (id) => id === shiftId ? { id } : null;
  Repository.findActiveConfigurationsByIds = async (_shiftId, ids) =>
    ids.map((id) => ({ id }));
  Repository.findActiveOfficersByIds = async (ids) => ids.map((id) => ({ id }));
  Repository.replaceForShift = async (...args) => {
    received = args;
    return [assignmentRecord];
  };
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  Repository.findActiveShiftById = originals.findShift;
  Repository.findActiveConfigurationsByIds = originals.findConfigurations;
  Repository.findActiveOfficersByIds = originals.findOfficers;
  Repository.replaceForShift = originals.replace;
  prisma.audit_logs.create = originals.audit;
});

describe("PUT /api/reception-shifts/:shiftId/counter-assignments", () => {
  it("allows enough transaction time for a remote database", () => {
    assert.deepEqual(RECEPTION_ASSIGNMENT_TRANSACTION_OPTIONS, {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 120000,
    });
  });

  it("documents the Vietnamese bulk assignment contract", () => {
    const operation = Swagger["/api/reception-shifts/{shiftId}/counter-assignments"].put;
    assert.match(operation.description, /LTD_UPDATE/);
    assert.equal(operation.parameters[0].schema.example, shiftId);
    assert.ok(operation.responses[409]);
  });

  it("replaces assignments for the selected shift", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-shifts/${shiftId}/counter-assignments`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const responseBody = await response.json();
      assert.equal(response.status, 200);
      assert.equal(responseBody.data[0].officer.id, officerId);
      assert.deepEqual(received, [shiftId, body.assignments, currentUserId]);
    } finally { server.close(); }
  });

  it("returns 400 for malformed input", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-shifts/${shiftId}/counter-assignments`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ assignments: [{ officerId }] }),
        }
      );
      assert.equal(response.status, 400);
    } finally { server.close(); }
  });

  it("returns 409 when an officer is assigned twice in the shift", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-shifts/${shiftId}/counter-assignments`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ assignments: [
            body.assignments[0],
            {
              counterConfigurationId: "723e4567-e89b-42d3-a456-426614174001",
              officerId,
            },
          ] }),
        }
      );
      assert.equal(response.status, 409);
    } finally { server.close(); }
  });

  it("returns 404 when the shift does not exist", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        "http://127.0.0.1:" + port +
          "/api/reception-shifts/823e4567-e89b-42d3-a456-426614174001/counter-assignments",
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      assert.equal(response.status, 404);
    } finally { server.close(); }
  });

  it("returns 403 without permission", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-shifts/${shiftId}/counter-assignments`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token([])}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      assert.equal(response.status, 403);
    } finally { server.close(); }
  });
});
