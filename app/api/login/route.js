import { NextResponse } from 'next/server';
import User from "@/models/userModel";
import connect from "@/dbConfig";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const POST = async (req) => {
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
            {expiresIn: "1h"}
        );

        const res = NextResponse.json({message: "Login successfull"}, {status: 200});
        res.cookies.set("token", tokenData, {httpOnly: true});

        return res;
        
    } catch (e) {
        console.log(e);
        return NextResponse.error();
    }
}