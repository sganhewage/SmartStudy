import mongoose from 'mongoose';
import connect from '@/dbConfig';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

let bucket;

export async function initGridFS() {
    if (!mongoose.connection.readyState) {
        await connect();
    }

    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
}

// Upload buffer to GridFS
export async function uploadToGridFS(filename, mimetype, buffer) {
    if (!bucket) await initGridFS();

    return new Promise((resolve, reject) => {
        const stream = Readable.from(buffer);
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: mimetype,
        });

        stream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => {
            resolve({
                fileId: uploadStream.id,
                filename,
                contentType: mimetype,
            });
        });
    });
}

// Download buffer from GridFS by ID
export async function downloadFromGridFS(fileId) {
    if (!bucket) await initGridFS();

    const chunks = [];
    return new Promise((resolve, reject) => {
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('error', reject);
        downloadStream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve({ buffer, contentType: downloadStream.s.options.contentType });
        });
    });
}
