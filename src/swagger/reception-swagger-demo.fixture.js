// Bộ dữ liệu cố định chỉ dùng để chạy thử Swagger trên database DEV.
// Seed và tài liệu OpenAPI cùng import file này để ID/mã không bị lệch nhau.
export const RECEPTION_SWAGGER_DEMO = Object.freeze({
  auth: {
    userId: "50000000-0000-4000-8000-000000000001",
    roleId: "50000000-0000-4000-8000-000000000002",
    username: "swagger_reception_demo",
    password: "Swagger@2026",
  },
  dates: {
    main: "2099-08-25",
    capacity: "2099-08-26",
    update: "2099-08-27",
    deletion: "2099-08-28",
    status: "2099-08-29",
    create: "2099-09-01",
  },
  schedules: {
    main: "10000000-0000-4000-8000-000000000001",
    capacity: "10000000-0000-4000-8000-000000000002",
    update: "10000000-0000-4000-8000-000000000003",
    deletion: "10000000-0000-4000-8000-000000000004",
    status: "10000000-0000-4000-8000-000000000005",
  },
  slots: {
    main: "20000000-0000-4000-8000-000000000001",
    capacity: "20000000-0000-4000-8000-000000000101",
  },
  registrations: {
    detail: { id: "30000000-0000-4000-8000-000000000001", code: "SWG001" },
    approve: { id: "30000000-0000-4000-8000-000000000002", code: "SWG002" },
    complete: { id: "30000000-0000-4000-8000-000000000003", code: "SWG003" },
    reject: { id: "30000000-0000-4000-8000-000000000004", code: "SWG004" },
    ratingLookup: { id: "30000000-0000-4000-8000-000000000005", code: "SWG005" },
    rated: { id: "30000000-0000-4000-8000-000000000006", code: "SWG006" },
    ratingCreate: { id: "30000000-0000-4000-8000-000000000007", code: "SWG007" },
  },
  ratingId: "40000000-0000-4000-8000-000000000001",
  publicRegistration: {
    phone: "0901000001",
    citizenId: "042299900001",
  },
  createScheduleOfficer: "Cán bộ Swagger tạo mới",
});
