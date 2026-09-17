const UUID_EXAMPLE = "123e4567-e89b-42d3-a456-426614174000";

const namedExamples = {
  page: 1,
  size: 10,
  limit: 10,
  search: "Nguyễn Văn An",
  keyword: "Nguyễn Văn An",
  email: "nguyen.van.an@example.com",
  password: "MatKhau@123",
  matKhau: "MatKhau@123",
  oldPassword: "MatKhauCu@123",
  newPassword: "MatKhauMoi@123",
  confirmPassword: "MatKhauMoi@123",
  tenDangNhap: "nguyenvanan",
  phone: "0901234567",
  phoneNumber: "0901234567",
  sdt: "0901234567",
  cccd: "042204001234",
  otp: "123456",
  refreshToken: "refresh-token-mau",
  accessToken: "access-token-mau",
  fcmToken: "fcm-token-mau",
  code: "MAU-001",
  fileName: "tai-lieu-mau.pdf",
  sortOrder: "desc",
  sortBy: "createdAt",
};

const valueForName = (name = "") => {
  if (namedExamples[name] !== undefined) return namedExamples[name];
  if (/^(id|.*Id|.*_id)$/i.test(name)) return UUID_EXAMPLE;
  if (/^(from|to|date.*|.*Date|ngay.*)$/i.test(name)) return "2026-09-17";
  if (/time|gio/i.test(name)) return "08:00";
  if (/status|trangThai/i.test(name)) return "ACTIVE";
  if (/file|tep|upload/i.test(name)) return "tai-lieu-mau.pdf";
  if (/name|ten|title|tieuDe/i.test(name)) return "Nội dung minh họa";
  if (/note|ghiChu|comment|description|moTa|reason|lyDo/i.test(name)) {
    return "Nội dung minh họa để kiểm thử API.";
  }
  return "gia-tri-mau";
};

const typeForParameter = (name = "") => {
  if (/^(page|size|limit|offset)$/i.test(name)) return "integer";
  if (/^(isActive|active|enabled)$/i.test(name)) return "boolean";
  return "string";
};

const resolveSchema = (schema, schemas) => {
  if (!schema?.$ref) return schema;
  const prefix = "#/components/schemas/";
  return schema.$ref.startsWith(prefix)
    ? schemas[schema.$ref.slice(prefix.length)] || schema
    : schema;
};

const exampleForSchema = (inputSchema, schemas, name, depth = 0) => {
  const schema = resolveSchema(inputSchema, schemas) || {};
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  if (depth > 4) return valueForName(name);

  if (schema.type === "array" || schema.items) {
    return [exampleForSchema(schema.items || {}, schemas, name, depth + 1)];
  }
  if (schema.type === "object" || schema.properties) {
    const required = new Set(schema.required || Object.keys(schema.properties || {}));
    return Object.fromEntries(
      Object.entries(schema.properties || {})
        .filter(([propertyName]) => required.has(propertyName))
        .map(([propertyName, propertySchema]) => [
          propertyName,
          exampleForSchema(propertySchema, schemas, propertyName, depth + 1),
        ])
    );
  }
  if (schema.type === "integer" || schema.type === "number") return 1;
  if (schema.type === "boolean") return true;
  if (schema.format === "uuid") return UUID_EXAMPLE;
  if (schema.format === "date") return "2026-09-17";
  if (schema.format === "date-time") return "2026-09-17T08:00:00.000Z";
  if (schema.format === "email") return "nguyen.van.an@example.com";
  if (schema.format === "binary") return "tai-lieu-mau.pdf";
  return valueForName(name);
};

const hasContentExample = (content) =>
  content.example !== undefined || content.examples !== undefined || content.schema?.example !== undefined;

/**
 * Adds safe, copyable defaults only where a hand-written business example is absent.
 * Existing detailed examples always take precedence.
 */
export const fillMissingExamples = (swaggerPaths, schemas = {}) => {
  for (const pathItem of Object.values(swaggerPaths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation || !["get", "post", "put", "patch", "delete"].includes(method)) continue;

      for (const parameter of [...(pathItem.parameters || []), ...(operation.parameters || [])]) {
        if (parameter && !parameter.schema && !parameter.content) {
          parameter.schema = { type: typeForParameter(parameter.name) };
        }
        if (parameter?.schema && parameter.schema.example === undefined && parameter.examples === undefined) {
          parameter.schema.example = exampleForSchema(parameter.schema, schemas, parameter.name);
        }
      }

      for (const content of Object.values(operation.requestBody?.content || {})) {
        if (!hasContentExample(content)) {
          content.example = exampleForSchema(content.schema, schemas);
        }
      }
    }
  }
  return swaggerPaths;
};
