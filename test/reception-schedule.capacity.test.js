import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import { PERMISSION } from "../src/constants/permission.constant.js";
import prisma from "../src/config/database.config.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import ReceptionScheduleRepository from "../src/repositories/reception-schedule.repository.js";
import receptionScheduleRouter from "../src/routes/reception-schedule.route.js";
import ReceptionScheduleSwagger from "../src/swagger/reception-schedule.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const scheduleId = "223e4567-e89b-42d3-a456-426614174000";
const slotId = "323e4567-e89b-42d3-a456-426614174000";
const originalUpdateSlotCapacity = ReceptionScheduleRepository.updateSlotCapacity;
const originalAuditCreate = prisma.audit_logs.create;
let repositoryResult;

const createToken = (permissions) =>
  jwtUtils.signAccessToken(
    {
      id: userId,
      ten_dang_nhap: "officer",
      permissions,
      cate: null,
      roles: ["OFFICER"],
    },
    "127.0.0.1"
  );

const createTestServer = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reception-schedules", receptionScheduleRouter);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(() => {
  repositoryResult = {
    slot: {
      id: slotId,
      id_lich_tiep_dan: scheduleId,
      khung_gio: "07:30 - 08:30",
      ma_quay: "QUAY_1",
      suc_chua: 3,
    },
    assignedCount: 1,
    heldCount: 5,
    totalCapacity: 17,
  };
  ReceptionScheduleRepository.updateSlotCapacity = async () => repositoryResult;
  prisma.audit_logs.create = async () => ({});
});

afterEach(() => {
  ReceptionScheduleRepository.updateSlotCapacity = originalUpdateSlotCapacity;
  prisma.audit_logs.create = originalAuditCreate;
});

describe("PATCH /api/reception-schedules/:scheduleId/slots/:slotId/capacity", () => {
  it("documents the unbounded positive capacity rule in Swagger", () => {
    const operation =
      ReceptionScheduleSwagger[
        "/api/reception-schedules/{scheduleId}/slots/{slotId}/capacity"
      ].patch;

    assert.ok(operation.description.includes("không giới hạn tối đa"));
    assert.equal(
      operation.requestBody.content["application/json"].schema.properties
        .capacity.minimum,
      1
    );
    assert.ok(operation.responses[409]);
  });

  it("updates a counter capacity with LTD_UPDATE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/${scheduleId}/slots/${slotId}/capacity`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify({ capacity: 3 }),
        }
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.data.counterCode, "QUAY_1");
      assert.equal(body.data.capacity, 3);
      assert.equal(body.data.slotTotalCapacity, 17);
    } finally {
      server.close();
    }
  });

  it("returns 400 for a capacity lower than one", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/${scheduleId}/slots/${slotId}/capacity`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify({ capacity: 0 }),
        }
      );

      assert.equal(response.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 409 when the new capacity is below held registrations", async () => {
    repositoryResult = { conflict: "BELOW_SLOT_HELD" };
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/${scheduleId}/slots/${slotId}/capacity`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify({ capacity: 1 }),
        }
      );

      assert.equal(response.status, 409);
    } finally {
      server.close();
    }
  });

  it("returns 404 when the counter slot does not belong to the schedule", async () => {
    repositoryResult = { conflict: "SLOT_NOT_FOUND" };
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/${scheduleId}/slots/${slotId}/capacity`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([PERMISSION.LTD_UPDATE])}`,
          },
          body: JSON.stringify({ capacity: 3 }),
        }
      );

      assert.equal(response.status, 404);
    } finally {
      server.close();
    }
  });

  it("returns 403 without LTD_UPDATE permission", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/reception-schedules/${scheduleId}/slots/${slotId}/capacity`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${createToken([])}`,
          },
          body: JSON.stringify({ capacity: 3 }),
        }
      );

      assert.equal(response.status, 403);
    } finally {
      server.close();
    }
  });
});
