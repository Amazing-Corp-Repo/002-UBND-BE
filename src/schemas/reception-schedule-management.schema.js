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

export const ReceptionScheduleManagementSchemas = {
  UpdateStatusSchema,
  CreateScheduleSchema,
  UpdateScheduleSchema,
};
