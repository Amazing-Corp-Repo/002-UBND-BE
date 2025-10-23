import multer from "multer";
import path from "path";
import fs from "fs";
import UPLOAD_TYPE from "../constants/upload-type.constant.js";
import { BaseError } from "../utils/base-error.util.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            const type = req.query.type;
            let id;
            const mimetype = file.mimetype.split("/")[0];

            // Determine the upload directory based on the type
            switch (type) {
                case UPLOAD_TYPE.AVATAR:
                    id = req.payload.userId;
                    break;
                default:
                    throw new BaseError(400, "Invalid upload type");
            }

            const currentDate = new Date().toISOString().split("T")[0];
            const uploadDir = path.join(
                process.cwd(),
                "public",
                mimetype,
                type.toLocaleLowerCase(),
                id,
                currentDate
            );
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + ext);
    },
});


const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

// Middleware wrapper: fields thay vì single
const uploadFile = (req, res, next) => {
    const fields = [
        { name: "file", maxCount: 10 }
    ];

    upload.fields(fields)(req, res, (err) => {
        if (err) {
            return next(err);
        }

        // normalize để giữ API giống single
        if (req.files && req.files.file) {
            req.file = req.files.file[0];
        }

        next();
    });
};

export default uploadFile;
