import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionCounterRepository from "../src/repositories/reception-counter.repository.js";
import receptionCounterRouter from "../src/routes/reception-counter.route.js";
import ReceptionCounterSwagger from "../src/swagger/reception-counter.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const counterId = "223e4567-e89b-42d3-a456-426614174001";
const userId = "123e4567-e89b-42d3-a456-426614174000";
const originals = {
  findById: ReceptionCounterRepository.findById,
  update: ReceptionCounterRepository.update,
  audit: prisma.audit_logs.create,
};
let capturedUpdate;

const token = (permissions) =>
  jwtUtils.signAccessToken(
    { id: userId, ten_dang_nhap: "staff", permissions, roles: ["STAFF"] },
    "127.0.0.1"
  );

const serverForTest = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-counters", receptionCounterRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  capturedUpdate = null;
  ReceptionCounterRepository.findById = async (id) =>
    id === counterId ? { id, ma_quay: "QUAY_1", is_delete: false } : null;
  ReceptionCounterRepository.update = async (id, data) => {
    capturedUpdate = data;
    return {
      id,
      ma_quay: "QUAY_1",
      ten_quay: data.ten_quay || "Quầy số 1",
      so_thu_tu: 1,
      suc_chua_mac_dinh: data.suc_chua_mac_dinh ?? 2,
      vi_tri: data.vi_tri,
      is_active: data.is_active ?? true,
      thoi_gian_cap_nhat: data.thoi_gian_cap_nhat,
    };
  };
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  ReceptionCounterRepository.findById = originals.findById;
  ReceptionCounterRepository.update = originals.update;
  prisma.audit_logs.create = originals.audit;
});

describe("PATCH /api/reception-counters/:id", () => {
  it("documents editable fields and Vietnamese responses in Swagger", () => {
    const operation = ReceptionCounterSwagger["/api/reception-counters/{id}"].patch;
    assert.match(operation.description, /LTD_UPDATE/);
    assert.ok(operation.requestBody.content["application/json"].examples.valid);
    assert.ok(operation.responses[400]);
    assert.ok(operation.responses[404]);
  });

  it("updates allowed fields and audit metadata", async () => {
    const server = serverForTest();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters/${counterId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
        },
        body: JSON.stringify({ counterName: "Quầy tiếp nhận số 1", defaultCapacity: 3 }),
      });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.data.defaultCapacity, 3);
      assert.equal(capturedUpdate.nguoi_cap_nhat, userId);
      assert.equal("ma_quay" in capturedUpdate, false);
      assert.equal("so_thu_tu" in capturedUpdate, false);
    } finally {
      server.close();
    }
  });

  it("returns 400 for an empty body or capacity below one", async () => {
    const server = serverForTest();
    const { port } = server.address();
    try {
      for (const body of [{}, { defaultCapacity: 0 }]) {
        const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters/${counterId}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify(body),
        });
        assert.equal(response.status, 400);
      }
    } finally {
      server.close();
    }
  });

  it("returns 404 for a missing counter", async () => {
    ReceptionCounterRepository.findById = async () => null;
    const server = serverForTest();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-counters/323e4567-e89b-42d3-a456-426614174001`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify({ defaultCapacity: 2 }),
        }
      );
      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_UPDATE", async () => {
    const server = serverForTest();
    const { port } = server.address();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/reception-counters/${counterId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token([])}`,
        },
        body: JSON.stringify({ defaultCapacity: 2 }),
      });
      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
