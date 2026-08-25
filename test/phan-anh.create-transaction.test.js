import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import prisma from "../src/config/database.config.js";
import PhanAnhRepository from "../src/repositories/phan-anh.repository.js";

const originalTransaction = prisma.$transaction;

afterEach(() => {
  prisma.$transaction = originalTransaction;
});

describe("PhanAnhRepository.createWithInitialState", () => {
  it("tạo phản ánh, trạng thái đầu tiên và đính kèm trong cùng transaction", async () => {
    const calls = [];
    prisma.$transaction = async (callback) =>
      callback({
        phan_anh: {
          create: async ({ data }) => {
            calls.push(["phan_anh", data]);
            return { id: "complaint-id", ...data };
          },
        },
        lich_su_trang_thai: {
          create: async ({ data }) => {
            calls.push(["history", data]);
            return { id: "history-id", ...data };
          },
        },
        dinh_kem_phan_anh: {
          createMany: async ({ data }) => {
            calls.push(["attachments", data]);
            return { count: data.length };
          },
        },
      });

    const result = await PhanAnhRepository.createWithInitialState(
      { ma_phan_anh: "PA000001", khu_pho: "Khu phố 1" },
      { ten: "Đã gửi" },
      [{ url_file: "/uploads/phan-anh/anh.jpg", loai: "PHAN_ANH" }],
    );

    assert.deepEqual(calls.map(([name]) => name), [
      "phan_anh",
      "history",
      "attachments",
    ]);
    assert.equal(calls[1][1].id_phan_anh, "complaint-id");
    assert.equal(calls[2][1][0].id_phan_anh, "complaint-id");
    assert.equal(result.createdPhanAnh.id, "complaint-id");
    assert.equal(result.trangThai.ten, "Đã gửi");
  });

  it("không tạo bảng đính kèm khi phản ánh không có file", async () => {
    let attachmentWriteCalled = false;
    prisma.$transaction = async (callback) =>
      callback({
        phan_anh: {
          create: async ({ data }) => ({ id: "complaint-id", ...data }),
        },
        lich_su_trang_thai: {
          create: async ({ data }) => ({ id: "history-id", ...data }),
        },
        dinh_kem_phan_anh: {
          createMany: async () => {
            attachmentWriteCalled = true;
          },
        },
      });

    await PhanAnhRepository.createWithInitialState(
      { ma_phan_anh: "PA000002", khu_pho: "Khu phố 2" },
      { ten: "Đã gửi" },
      [],
    );

    assert.equal(attachmentWriteCalled, false);
  });
});
