import path from "path";
import fs from "fs";
import multer from "multer";
import { BadRequestException } from "../uitilties/error/app-error.js";
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type";

export const fileType = {
    images: ["image/jpg", "image/jpeg", "image/png", "image/webp"],
    imaages: ["image/jpg", "image/jpeg", "image/png", "image/webp"],
    pdf: ["application/pdf"],
    video: ["video/mp4"]
};
export const multerLocal = ({ fileType = [], customPath } = {}) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            let folderBath = path.resolve("assets");
            
            if (customPath) {
                folderBath = path.resolve("assets", customPath);
            }

            if (!fs.existsSync(folderBath)) {
                fs.mkdirSync(folderBath, { recursive: true });
            }

            cb(null, folderBath);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        }
    });

    const fileFilter = (req, file, cb) => {
        if (fileType && fileType.length && !fileType.includes(file.mimetype)) {
            return cb(new BadRequestException("we only accept valid files"), false);
        }
        return cb(null, true);
    };

    return multer({
        storage,
        fileFilter
    });
};

const processSingleFile = async (file, allowedTypes = []) => {
    let result;
    if (file.buffer) {
        result = await fileTypeFromBuffer(file.buffer);
    } else {
        result = await fileTypeFromFile(file.path);
    }

    if (!result || !allowedTypes.includes(result.mime)) {
        if (file.path) {
            fs.unlinkSync(file.path);
        }
        throw new BadRequestException("Invalid file type");
    }

    if (file.buffer) {
        const folderPath = "./uploads";
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const fullPath = `./uploads/${Date.now()}.${result.ext}`;
        fs.writeFileSync(fullPath, file.buffer);
        file.fullPath = fullPath;
    }
};

export const processFiles = ({ fileType = [] } = {}) => {
    return async (req, res, next) => {
        if (req.file) {
            await processSingleFile(req.file, fileType);
        }
        if (req.files) {
            if (Array.isArray(req.files)) {
                for (const file of req.files) {
                    await processSingleFile(file, fileType);
                }
            } else {
                for (const key of Object.keys(req.files)) {
                    for (const file of req.files[key]) {
                        await processSingleFile(file, fileType);
                    }
                }
            }
        }
        next();
    };
};
export const proccessFiles = processFiles;

export const multerMemory = ({ fileType = [] } = {}) => {
    const storage = multer.memoryStorage();
    const fileFilter = (req, file, cb) => {
        if (fileType.length && !fileType.includes(file.mimetype)) {
            return cb(new BadRequestException("wrong file type"));
        }
        return cb(null, true);
    };

    return multer({
        storage,
        fileFilter
    });
};

export const validateMemoryFileTypes = ({ fileType = [] } = {}) => {
    return async (req, res, next) => {
        const uploadedFiles = [];

        if (req.file) {
            uploadedFiles.push(req.file);
        }

        if (req.files) {
            if (Array.isArray(req.files)) {
                uploadedFiles.push(...req.files);
            } else {
                for (const key of Object.keys(req.files)) {
                    uploadedFiles.push(...(req.files[key] || []));
                }
            }
        }

        for (const uploadedFile of uploadedFiles) {
            if (!uploadedFile || !uploadedFile.buffer) continue;

            const detectedType = await fileTypeFromBuffer(uploadedFile.buffer);
            if (!detectedType || !fileType.includes(detectedType.mime)) {
                throw new BadRequestException("invalid file type");
            }

            const folderPath = "./uploads";
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            const fullPath = `./uploads/${Date.now()}.${detectedType.ext}`;
            fs.writeFileSync(fullPath, uploadedFile.buffer);
            uploadedFile.fullPath = fullPath;
        }

        next();
    };
};