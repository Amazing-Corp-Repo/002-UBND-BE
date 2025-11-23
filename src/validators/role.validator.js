import Joi from "joi";

export const CreateRoleRequest = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.min': 'Tên vai trò phải có ít nhất 3 ký tự',
            'string.max': 'Tên vai trò không được vượt quá 100 ký tự',
            'any.required': 'Tên vai trò là bắt buộc',
        }),
    description: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Mô tả không được vượt quá 255 ký tự',
        }),
    permissionIds: Joi.array()
        .items(
            Joi.string()
                .trim()
                .uuid()
                .messages({
                    'string.uuid': 'Mỗi permissionId phải là một UUID hợp lệ',
                })
        )
        .messages({
            'array.base': 'permissionIds phải là một mảng',
        }),
});

export const UpdateRoleStatusRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});

export const UpdateRoleRequest = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.min': 'Tên vai trò phải có ít nhất 3 ký tự',
            'string.max': 'Tên vai trò không được vượt quá 100 ký tự',
            'any.required': 'Tên vai trò là bắt buộc',
        }),
    description: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Mô tả không được vượt quá 255 ký tự',
        }),
    permissionIds: Joi.array()
        .items(
            Joi.string()
                .trim()
                .uuid()
                .messages({
                    'string.uuid': 'Mỗi permissionId phải là một UUID hợp lệ',
                })
        )
        .messages({
            'array.base': 'permissionIds phải là một mảng',
        }),
});