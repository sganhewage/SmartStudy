import { initGridFS } from '@/models/gridfsUtils';
import mongoose from 'mongoose';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  await initGridFS();

  const { id } = req.query;

  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });

    const _id = new mongoose.Types.ObjectId(id);
    const files = await bucket.find({ _id }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];
    res.setHeader('Content-Type', file.contentType);
    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.pipe(res);
  } catch (err) {
    console.error('Error fetching file from GridFS:', err);
    res.status(500).json({ message: 'Failed to stream file' });
  }
}
