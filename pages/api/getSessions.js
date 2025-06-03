import { getUserID } from "@/dbConfig";
import connect from "@/dbConfig";
import User from "@/models/userModel"; 

export default async function handler(req, res) {
    await connect();
    const userID = await getUserID(req);
    if (!userID) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const user = await User.findById(userID).populate('sessions');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const sessions = await user.sessions;
        res.status(200).json(sessions);
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
