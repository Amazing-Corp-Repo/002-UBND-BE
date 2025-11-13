import joiToSwagger from "joi-to-swagger";
import { CreateLichTiepDanRequest, UpdateLichTiepDanRequest, UpdateLStatusLichTiepDanRequest } from "../validators/lich-tiep-dan.validator.js";

const { swagger: UpdateLStatusLichTiepDanSchemaSwagger } = joiToSwagger(UpdateLStatusLichTiepDanRequest);
const { swagger: CreateLichTiepDanRequestSchemaSwagger } = joiToSwagger(CreateLichTiepDanRequest);
const { swagger: UpdateLichTiepDanRequestSchemaSwagger } = joiToSwagger(UpdateLichTiepDanRequest);

export const LichTiepDanSchemas = {
    UpdateLStatusLichTiepDanSchemaSwagger,
    CreateLichTiepDanRequestSchemaSwagger,
    UpdateLichTiepDanRequestSchemaSwagger,
};