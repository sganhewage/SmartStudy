import { NextResponse } from 'next/server';
import User from "@/models/userModel";
import connect from "@/dbConfig";

export const POST = async (req) => {
    await connect();
    try {
        const {files} = await req.json();
        if (!files || !Array.isArray(files)) {
            return NextResponse.json({message: "Invalid files data"}, {status: 400});
        }

        const updatedUsers = await User.updateMany({}, { $set: { files } });
        if (updatedUsers.modifiedCount === 0) {
            return NextResponse.json({message: "No users updated"}, {status: 404});
        }

        return NextResponse.json({message: "Files updated successfully"}, {status: 200});
        
    } catch (e) {
        console.log(e);
        return NextResponse.error();
    }
}