import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import connect from "@/dbConfig";

let gfs;
let bucket;

export const connectToGridFS = async () => {
  if (!mongoose.connection.readyState) {
    await connect();
  }

  const db = mongoose.connection.db;
  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  gfs = bucket;
};

export const getBucket = () => bucket;
