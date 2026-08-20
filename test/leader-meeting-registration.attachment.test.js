import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import prisma from "../src/config/database.config.js";
import { PERMISSION } from "../src/constants/permission.constant.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import Repository from "../src/repositories/leader-meeting-registration.repository.js";
import router from "../src/routes/leader-meeting-registration.route.js";
import Swagger from "../src/swagger/leader-meeting-registration.swagger.js";
import jwtUtils from "../src/utils/jwt.util.js";

const leaderId = "123e4567-e89b-42d3-a456-426614174001";
const registrationId = "423e4567-e89b-42d3-a456-426614174001";
const attachmentId = "623e4567-e89b-42d3-a456-426614174001";
const root = path.resolve("src/private/uploads/leader-meetings");
const originals = { find: Repository.findAttachment, audit: prisma.audit_logs.create };
let fixtureDirectory;
let fixturePath;
let attachmentType;
let scopedLeaderId;

const token = (roles = ["LANH_DAO"], permissions = [PERMISSION.LMR_GET_DETAIL]) =>
  jwtUtils.signAccessToken(
    { id: leaderId, ten_dang_nhap: "leader", permissions, roles, cate: null },
    "127.0.0.1"
  );

const createServer = () => {
  const app = express();
  app.use("/api/leader-meeting-registrations", router);
  app.use(errorHandler);
  return app.listen(0);
};

beforeEach(async () => {
  await fs.promises.mkdir(root, { recursive: true });
  fixtureDirectory = await fs.promises.mkdtemp(path.join(root, "test-attachment-"));
  fixturePath = path.join(fixtureDirectory, "ho-so.pdf");
  await fs.promises.writeFile(fixturePath, Buffer.from("leader meeting file"));
  attachmentType = "SUPPORTING_DOCUMENT";
  scopedLeaderId = null;
  Repository.findAttachment = async (_registrationId, _attachmentId, leaderScope) => {
    scopedLeaderId = leaderScope;
    return {
      id: attachmentId,
      id_dang_ky: registrationId,
      loai_dinh_kem: attachmentType,
      ten_file_goc: "hồ sơ.pdf",
      duong_dan_file: path.relative(process.cwd(), fixturePath),
      mime_type: "application/pdf",
      kich_thuoc: Buffer.byteLength("leader meeting file"),
    };
  };
  prisma.audit_logs.create = async () => ({ id: "audit" });
});

afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 20));
  Repository.findAttachment = originals.find;
  prisma.audit_logs.create = originals.audit;
  await fs.promises.rm(fixtureDirectory, { recursive: true, force: true });
});

describe("GET /api/leader-meeting-registrations/:id/attachments/:attachmentId", () => {
  it("documents inline CCCD, document download and hidden physical paths", () => {
    const operation = Swagger[
      "/api/leader-meeting-registrations/{id}/attachments/{attachmentId}"
    ].get;
    assert.match(operation.description, /CCCD_FRONT\/CCCD_BACK luôn trả Content-Disposition inline/);
    assert.match(operation.description, /không trả đường dẫn lưu trữ vật lý/);
    assert.match(operation.description, /audit/);
  });

  it("downloads an authorized supporting document and scopes a leader", async () => {
    const server = createServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}/attachments/${attachmentId}?download=true`,
        { headers: { authorization: `Bearer ${token()}` } }
      );
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-disposition"), /^attachment;/);
      assert.equal(await response.text(), "leader meeting file");
      assert.equal(scopedLeaderId, leaderId);
    } finally {
      server.close();
    }
  });

  it("forces CCCD images to inline and rejects an explicit download", async () => {
    attachmentType = "CCCD_FRONT";
    const server = createServer();
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}/attachments/${attachmentId}`;
    try {
      const inline = await fetch(base, { headers: { authorization: `Bearer ${token()}` } });
      const denied = await fetch(`${base}?download=true`, {
        headers: { authorization: `Bearer ${token()}` },
      });
      assert.equal(inline.status, 200);
      assert.match(inline.headers.get("content-disposition"), /^inline;/);
      assert.equal(denied.status, 403);
    } finally {
      server.close();
    }
  });

  it("allows ADMIN cross-leader reads and returns 403 without permission", async () => {
    const server = createServer();
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/leader-meeting-registrations/${registrationId}/attachments/${attachmentId}`;
    try {
      const admin = await fetch(url, {
        headers: { authorization: `Bearer ${token(["ADMIN"])}` },
      });
      assert.equal(admin.status, 200);
      assert.equal(scopedLeaderId, undefined);
      const forbidden = await fetch(url, {
        headers: { authorization: `Bearer ${token(["LANH_DAO"], [])}` },
      });
      assert.equal(forbidden.status, 403);
    } finally {
      server.close();
    }
  });
});
