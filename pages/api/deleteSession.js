import { getUserID } from "@/dbConfig";
import connect from "@/dbConfig";
import User from "@/models/userModel";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

export default async function handler(req, res) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    await connect();
    const userID = await getUserID(req);
    if (!userID) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
    }

    try {
        const user = await User.findById(userID);
        const session = user.sessions.find(s => s._id.toString() === sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        // Remove files from GridFS
        const fileIds = session.files.map(f => f.gridFsId);
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        if (!bucket) {
            return res.status(500).json({ message: 'GridFS bucket not initialized' });
        }
        for (const fileId of fileIds) {
            try {
                await bucket.delete(new mongoose.Types.ObjectId(fileId));
            } catch (err) {
                console.warn(`Failed to delete file ${fileId} from GridFS`, err);
            }
        }
        user.sessions = user.sessions.filter(s => s._id.toString() !== sessionId);
        await user.save();
        res.status(200).json({ message: "Session deleted" });
    } catch (err) {
        console.error("Error deleting session:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}
