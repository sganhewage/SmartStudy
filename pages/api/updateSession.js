// pages/api/updateSession.js
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { initGridFS, uploadToGridFS } from '@/models/gridfsUtils';
import connect from '@/dbConfig';
import jwt from 'jsonwebtoken';
import User from '@/models/userModel';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    await connect();

    const form = formidable({ multiples: true, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Form parsing failed:', err);
            return res.status(400).json({ message: 'Form parsing error' });
        }

        try {
            const { sessionId, name, description, instructions, remainingFileIds } = fields;
            const parsedRemainingIds = JSON.parse(remainingFileIds);

            const uploadedFiles = [];
            if (files.files) {
                const fileArray = Array.isArray(files.files) ? files.files : [files.files];
                uploadedFiles.push(...fileArray);
            } else {
                Object.values(files).forEach(file => {
                    if (Array.isArray(file)) {
                        uploadedFiles.push(...file);
                    } else if (file && file.filepath) {
                        uploadedFiles.push(file);
                    }
                });
            }

            const gridfsFiles = [];
            for (const file of uploadedFiles) {
                const fileBuffer = await fs.readFile(file.filepath);
                const meta = await uploadToGridFS(file.originalFilename, file.mimetype, fileBuffer);
                gridfsFiles.push({
                    fileName: meta.filename,
                    fileType: meta.contentType,
                    gridFsId: meta.fileId,
                });
            }

            const token = req.cookies?.token;
            if (!token) return res.status(401).json({ message: 'Unauthorized' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const session = user.sessions.id(sessionId);
            if (!session) return res.status(404).json({ message: 'Session not found' });

            // Identify and delete removed files from GridFS
            const currentFileIds = session.files.map(f => f.gridFsId.toString());
            const removedFileIds = currentFileIds.filter(id => !parsedRemainingIds.includes(id));

            if (removedFileIds.length > 0) {
                const db = mongoose.connection.db;
                const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

                if (!bucket) {
                    return res.status(500).json({ message: 'GridFS bucket not initialized' });
                }

                for (const fileId of removedFileIds) {
                    try {
                        await bucket.delete(new mongoose.Types.ObjectId(fileId));
                    } catch (err) {
                        console.warn(`Failed to delete file ${fileId} from GridFS`, err);
                    }
                }
            }

            session.name = name[0];
            session.description = description[0] || '';
            session.instructions = instructions[0] || '';
            session.files = [
                ...user.sessions.id(sessionId).files.filter(f => parsedRemainingIds.includes(f.gridFsId)),
                ...gridfsFiles
            ];

            
            await user.save();

            return res.status(200).json({ message: 'Session updated successfully' });
        } catch (e) {
            console.error('Update error:', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
}
