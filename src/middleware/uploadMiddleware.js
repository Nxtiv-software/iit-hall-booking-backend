import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// Setting up AWS credentials
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export async function uploadToS3(file) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const key = `uploads/${file.fieldname}-${uniqueSuffix}-${file.originalname}`;

    const uploader = new Upload({
        client: s3,
        params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "private",
        },
    });

    await uploader.done();
    return key;
}

export { upload, s3 };
