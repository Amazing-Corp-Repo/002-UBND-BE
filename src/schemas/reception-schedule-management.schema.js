import joiToSwagger from "joi-to-swagger";
import {
  CreateLichTiepDanRequest,
  UpdateLichTiepDanRequest,
  UpdateLStatusLichTiepDanRequest,
} from "../validators/reception-schedule-management.validator.js";

const { swagger: UpdateStatusSchema } = joiToSwagger(
  UpdateLStatusLichTiepDanRequest
);
const { swagger: CreateScheduleSchema } = joiToSwagger(
  CreateLichTiepDanRequest
);
const { swagger: UpdateScheduleSchema } = joiToSwagger(
  UpdateLichTiepDanRequest
);

const ScheduleWithSlotsSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    dia_diem: { type: "string", description: "Địa điểm tiếp dân" },
    ten_can_bo: { type: "string", description: "Tên cán bộ tiếp dân" },
    ngay_tiep_dan: { type: "string", format: "date-time" },
    thoi_gian: { type: "string", description: "Các khoảng thời gian làm việc" },
    ghi_chu: { type: "string", nullable: true },
    is_active: { type: "boolean" },
    slots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          timeSlot: { type: "string", example: "07:30 - 08:30" },
          totalCapacity: { type: "integer", minimum: 8, example: 16 },
          heldCount: { type: "integer", minimum: 0 },
          remainingCapacity: { type: "integer", minimum: 0 },
          isFull: { type: "boolean" },
          unassignedHeldCount: { type: "integer", minimum: 0 },
          counters: {
            type: "array",
            minItems: 8,
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                counterCode: {
                  type: "string",
                  enum: [
                    "QUAY_1",
                    "QUAY_2",
                    "QUAY_3",
                    "QUAY_4",
                    "QUAY_5",
                    "QUAY_6",
                    "QUAY_7",
                    "QUAY_8",
                  ],
                },
                capacity: { type: "integer", minimum: 1, example: 2 },
                heldCount: { type: "integer", minimum: 0 },
                remainingCapacity: { type: "integer", minimum: 0 },
                isFull: { type: "boolean" },
                isActive: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  },
};

const ScheduleWithSlotsSuccessSchema = {
  type: "object",
  required: ["success", "data", "message"],
  properties: {
    success: { type: "boolean", example: true },
    data: ScheduleWithSlotsSchema,
    message: { type: "string", example: "Tạo lịch tiếp dân thành công" },
    pagination: { nullable: true, example: null },
  },
};

export const ReceptionScheduleManagementSchemas = {
  UpdateStatusSchema,
  CreateScheduleSchema,
  UpdateScheduleSchema,
  ScheduleWithSlotsSchema,
  ScheduleWithSlotsSuccessSchema,
};
