import test from "node:test";
import assert from "node:assert/strict";
import { CreatePhanAnhExtensionRequest } from "./phan-anh-extension.validator.js";

const baseRequest = {
  complaintId: "00000000-0000-0000-0000-000000000001",
  reason: "Cần thêm thời gian để hoàn tất xử lý",
};

test("cho phép xin gia hạn khi hạn hiện tại đã quá hạn", () => {
  const { error } = CreatePhanAnhExtensionRequest.validate({
    ...baseRequest,
    requestedDeadline: "2026-09-10T12:00:00.000Z",
  });

  assert.equal(error, undefined);
});

test("cho phép xin gia hạn trước khi đơn hết hạn", () => {
  const { error } = CreatePhanAnhExtensionRequest.validate({
    ...baseRequest,
    requestedDeadline: "2026-09-20T12:00:00.000Z",
  });

  assert.equal(error, undefined);
});

test("vẫn từ chối ngày đề xuất không phải ISO", () => {
  const { error } = CreatePhanAnhExtensionRequest.validate({
    ...baseRequest,
    requestedDeadline: "10/09/2026",
  });

  assert.equal(error?.details[0]?.type, "string.isoDate");
});
