import { NextResponse } from 'next/server';
import connect from "@/dbConfig";
import User from "@/models/userModel";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const POST = async (req) => {
    console.log("Login API called");
    //log any and all env variables
    console.log("Environment Variables:");
    for (const [key, value] of Object.entries(process.env)) {
        console.log(`${key}: ${value}`);
    }
    // Ensure the database is connected
    if (!process.env.JWT_SECRET_KEY) {
        console.error("JWT_SECRET_KEY is not set in environment variables");
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
    if (!process.env.MONGODB_URL) {
        console.error("MONGODB_URL is not set in environment variables");
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }

    await connect();

    try {
        const {email, password} = await req.json();

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({email: normalizedEmail});
        console.log(user);
        if (!user) {return NextResponse.json({message: "User does not exist"}, {status: 400});}

        const validPassword = await bcryptjs.compare(password, user.password);
        if (!validPassword) {return NextResponse.json({message: "Invalid password"}, {status: 401});}

        const tokenData = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET_KEY,
            {expiresIn: "1d"}
        );

        const res = NextResponse.json({message: "Login successfull"}, {status: 200});
        res.cookies.set("token", tokenData, {httpOnly: true});

        return res;
        
    } catch (e) {
        console.log(e);
        return NextResponse.error();
    }
}