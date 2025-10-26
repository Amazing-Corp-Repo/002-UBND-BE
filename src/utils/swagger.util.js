import JoiToSwagger from "joi-to-swagger";

export const addFileToJoiSchema = (
    joiSchema,
    {
        fieldName = "file",
        maxCount,
        description = "",
        allowNull = false,
    } = {}
) => {
    const { swagger } = JoiToSwagger(joiSchema);

    let note = description.trim();
    if (maxCount) note += ` Cho phép upload tối đa ${maxCount} file.`;
    if (allowNull) note += ` (Tùy chọn, có thể để trống.)`;

    const fileProperty = {
        type: "array",
        items: {
            type: "string",
            format: "binary",
        },
        description: note.trim(),
    };

    const schema = {
        type: "object",
        properties: {
            ...swagger.properties,
            [fieldName]: fileProperty,
        },
        required: [...(swagger.required || [])],
    };

    if (!allowNull) {
        schema.required.push(fieldName);
    }

    return schema;
};
