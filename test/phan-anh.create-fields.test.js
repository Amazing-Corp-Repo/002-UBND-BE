import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import express from "express";
import LinhVucPhanAnhRepository from "../src/repositories/linh-vuc-phan-anh.repository.js";
import PhanAnhRepository from "../src/repositories/phan-anh.repository.js";
import UserRepository from "../src/repositories/user.repository.js";
import PhanAnhService from "../src/services/phan-anh.service.js";
import MailService from "../src/services/mail.service.js";
import PhanAnhSwagger from "../src/swagger/phan-anh.swagger.js";
import phanAnhRouter from "../src/routes/phan-anh.route.js";
import { errorHandler } from "../src/middlewares/error-handle.middleware.js";
import {
  CreatePhanAnhPublicRequest,
  CreatePhanAnhRequest,
} from "../src/validators/phan-anh.validator.js";

const original = {
  findLinhVuc: LinhVucPhanAnhRepository.findById,
  getManagerEmails: LinhVucPhanAnhRepository.getManagerEmailsByLinhVucId,
  createWithInitialState: PhanAnhRepository.createWithInitialState,
  getAllAdmin: UserRepository.getAllAdmin,
  findUser: UserRepository.findById,
  sendMail: MailService.sendMailCC,
};

const commonInput = {
  idLinhVucPhanAnh: "123e4567-e89b-42d3-a456-426614174000",
  tieuDe: "Phản ánh vệ sinh môi trường",
  moTa: "Có rác thải tồn đọng nhiều ngày tại khu dân cư.",
  viTri: "12 đường Tăng Nhơn Phú",
  mucDo: "Thông thường",
  tenNguoiPhanAnh: "nguyễn văn an",
  soDienThoaiNguoiPhanAnh: "0912345678",
  cccd: "079123456789",
  khuPho: "Khu phố 1",
  moTaViTri: "Gần cổng trường tiểu học",
  idVideo: ["video-1"],
};

let capturedData;
let capturedInitialStatus;
let capturedAttachments;

function createTestServer() {
  const app = express();
  app.use(express.json());
  app.use("/api/phan-anh", phanAnhRouter);
  app.use(errorHandler);
  return app.listen(0);
}

function toPublicFormData(overrides = {}) {
  const input = { ...commonInput, ...overrides };
  const formData = new FormData();
  for (const field of [
    "idLinhVucPhanAnh",
    "tieuDe",
    "moTa",
    "viTri",
    "mucDo",
    "tenNguoiPhanAnh",
    "soDienThoaiNguoiPhanAnh",
    "cccd",
    "khuPho",
    "moTaViTri",
  ]) {
    if (input[field] !== undefined) formData.append(field, input[field]);
  }
  formData.append("idVideo", "video-1");
  return formData;
}

beforeEach(() => {
  capturedData = null;
  capturedInitialStatus = null;
  capturedAttachments = null;
  LinhVucPhanAnhRepository.findById = async () => ({
    id: commonInput.idLinhVucPhanAnh,
    is_active: true,
  });
  LinhVucPhanAnhRepository.getManagerEmailsByLinhVucId = async () => [];
  PhanAnhRepository.createWithInitialState = async (data, initialStatus, attachments) => {
    capturedData = data;
    capturedInitialStatus = initialStatus;
    capturedAttachments = attachments;
    return {
      createdPhanAnh: { id: "complaint-id", ...data },
      trangThai: { ten: initialStatus.ten },
    };
  };
  UserRepository.getAllAdmin = async () => [];
  UserRepository.findById = async (id) => ({ id });
  MailService.sendMailCC = async () => ({});
});

afterEach(() => {
  LinhVucPhanAnhRepository.findById = original.findLinhVuc;
  LinhVucPhanAnhRepository.getManagerEmailsByLinhVucId = original.getManagerEmails;
  PhanAnhRepository.createWithInitialState = original.createWithInitialState;
  UserRepository.getAllAdmin = original.getAllAdmin;
  UserRepository.findById = original.findUser;
  MailService.sendMailCC = original.sendMail;
});

describe("Hai API tạo phản ánh", () => {
  it("bắt buộc khu phố và kiểm tra CCCD ở cả hai validator", () => {
    for (const schema of [CreatePhanAnhRequest, CreatePhanAnhPublicRequest]) {
      const missingWard = schema.validate({ ...commonInput, khuPho: undefined });
      assert.equal(missingWard.error?.details[0].path[0], "khuPho");

      const invalidCitizenId = schema.validate({ ...commonInput, cccd: "123" });
      assert.equal(invalidCitizenId.error?.details[0].path[0], "cccd");

      assert.equal(schema.validate(commonInput).error, undefined);
    }
  });

  it("lưu và trả lại các field mới qua API công khai", async () => {
    const result = await PhanAnhService.createPhanAnhPublic(
      commonInput.idLinhVucPhanAnh,
      commonInput.tieuDe,
      commonInput.moTa,
      commonInput.viTri,
      commonInput.mucDo,
      commonInput.tenNguoiPhanAnh,
      commonInput.soDienThoaiNguoiPhanAnh,
      commonInput.cccd,
      commonInput.khuPho,
      commonInput.moTaViTri,
      [],
      commonInput.idVideo,
    );

    assert.equal(capturedData.cccd, commonInput.cccd);
    assert.equal(capturedData.khu_pho, commonInput.khuPho);
    assert.equal(capturedData.mo_ta_vi_tri, commonInput.moTaViTri);
    assert.equal(capturedInitialStatus.ten, "Đã gửi");
    assert.deepEqual(capturedAttachments, []);
    assert.equal(result.cccd, commonInput.cccd);
    assert.equal(result.khu_pho, commonInput.khuPho);
    assert.equal(result.mo_ta_vi_tri, commonInput.moTaViTri);
  });

  it("lưu và trả lại các field mới qua API có đăng nhập", async () => {
    const userId = "223e4567-e89b-42d3-a456-426614174000";
    const result = await PhanAnhService.createPhanAnh(
      commonInput.idLinhVucPhanAnh,
      commonInput.tieuDe,
      commonInput.moTa,
      commonInput.viTri,
      commonInput.mucDo,
      commonInput.tenNguoiPhanAnh,
      commonInput.soDienThoaiNguoiPhanAnh,
      commonInput.cccd,
      commonInput.khuPho,
      commonInput.moTaViTri,
      userId,
      [],
      commonInput.idVideo,
    );

    assert.equal(capturedData.nguoi_tao, userId);
    assert.equal(capturedInitialStatus.ten, "Đã gửi");
    assert.deepEqual(capturedAttachments, []);
    assert.equal(result.cccd, commonInput.cccd);
    assert.equal(result.khu_pho, commonInput.khuPho);
    assert.equal(result.mo_ta_vi_tri, commonInput.moTaViTri);
  });

  it("đưa field mới và yêu cầu khu phố lên Swagger", () => {
    for (const path of ["/api/phan-anh", "/api/phan-anh/public/create"]) {
      const operation = PhanAnhSwagger[path].post;
      const schema = operation.requestBody.content["multipart/form-data"].schema;
      assert.ok(schema.properties.cccd);
      assert.ok(schema.properties.khuPho);
      assert.ok(schema.properties.moTaViTri);
      assert.ok(schema.required.includes("khuPho"));
      assert.match(operation.description, /Khu phố là bắt buộc/);
    }
  });

  it("parse multipart trước khi validate và tạo phản ánh công khai", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/phan-anh/public/create`,
        { method: "POST", body: toPublicFormData() },
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.cccd, commonInput.cccd);
      assert.equal(body.data.khu_pho, commonInput.khuPho);
      assert.equal(body.data.mo_ta_vi_tri, commonInput.moTaViTri);
    } finally {
      server.close();
    }
  });

  it("trả 400 khi multipart công khai thiếu khu phố", async () => {
    const server = createTestServer();
    const { port } = server.address();
    try {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/phan-anh/public/create`,
        {
          method: "POST",
          body: toPublicFormData({ khuPho: undefined }),
        },
      );
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.equal(body.success, false);
      assert.ok(body.errors.some((item) => item.field === "khuPho"));
    } finally {
      server.close();
    }
  });
});
