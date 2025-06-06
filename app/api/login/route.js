import { NextResponse } from 'next/server';
import connect from "@/dbConfig";
import User from "@/models/userModel";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const POST = async (req) => {
    await connect();

    try {
        const {email, password} = await req.json();
        console.log("received email: ", email);
        console.log("received password: ", password);

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
        console.log("Login API Error: ",e);
        return NextResponse.error(NextResponse.json({ message: "Login API error" }, { status: 500 }));
    }
}