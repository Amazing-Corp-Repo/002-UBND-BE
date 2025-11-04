import joiToSwagger from "joi-to-swagger";
import { UpdateLStatusLichTiepDanSchema } from "../validators/lich-tiep-dan.validator.js";

const { swagger: UpdateLStatusLichTiepDanSchemaSwagger } = joiToSwagger(UpdateLStatusLichTiepDanSchema);

export const LichTiepDanSchemas = {
    UpdateLStatusLichTiepDanSchemaSwagger,
};