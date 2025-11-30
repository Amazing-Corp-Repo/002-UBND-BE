import JoiToSwagger from "joi-to-swagger";
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRoleStatusRequest,
} from "../validators/role.validator.js";

const { swagger: CreateRoleRequestSchema } = JoiToSwagger(CreateRoleRequest);
const { swagger: UpdateRoleStatusRequestSchema } = JoiToSwagger(
  UpdateRoleStatusRequest
);
const { swagger: UpdateRoleRequestSchema } = JoiToSwagger(UpdateRoleRequest);

const RoleSchemas = {
  CreateRoleRequest: CreateRoleRequestSchema,
  UpdateRoleStatusRequest: UpdateRoleStatusRequestSchema,
  UpdateRoleRequest: UpdateRoleRequestSchema,
};

export default RoleSchemas;
