import assert from "node:assert/strict";
import test from "node:test";

import PhanAnhSchemas from "../src/schemas/phan-anh.schema.js";
import PhanAnhSwagger from "../src/swagger/phan-anh.swagger.js";

test("status update documentation exposes approval workflow fields", () => {
  const operation =
    PhanAnhSwagger["/api/phan-anh/update-status/{idPhanAnh}"].put;
  const schema =
    operation.requestBody.content["multipart/form-data"].schema;

  assert.ok(schema.properties.idNguoiXuLy);
  assert.ok(schema.properties.soNgayXuLy);
  assert.match(operation.description, /PA_APPROVE \+ PA_ASSIGN/);
  assert.match(operation.description, /24 giờ/);
  assert.match(operation.description, /ngày làm việc/);
});

test("Swagger documents response media and neighborhood statistics", () => {
  const detailSchema =
    PhanAnhSwagger["/api/phan-anh/{idPhanAnh}"].get.responses[200].content[
      "application/json"
    ].schema.properties.data.properties;
  assert.ok(detailSchema.video_giai_quyet);
  assert.ok(detailSchema.danh_sach_file_giai_quyet);

  const overview = PhanAnhSwagger["/api/phan-anh/tong-quan"].get;
  assert.match(overview.description, /PA_GET_STATS/);
  assert.ok(
    overview.responses[200].content["application/json"].schema.properties.data
      .properties.thong_ke_theo_khu_pho,
  );
});

test("assignment endpoints are documented while extension APIs stay excluded", () => {
  assert.ok(PhanAnhSchemas.AssignPhanAnhRequest.properties.idNguoiXuLy);
  assert.ok(PhanAnhSwagger["/api/phan-anh/{idPhanAnh}/nguoi-xu-ly"]);
  assert.ok(PhanAnhSwagger["/api/phan-anh/assign/{idPhanAnh}"]);
  assert.equal(PhanAnhSwagger["/api/phan-anh/gia-han"], undefined);
});
