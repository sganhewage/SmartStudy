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
        if (user) {return NextResponse.json({message: "User already exists"}, {status: 400});}

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
        });

        await newUser.save();

        const tokenData = jwt.sign(
            {id: newUser._id},
            process.env.JWT_SECRET_KEY,
            {expiresIn: "1d"}
        );

        const res = NextResponse.json({message: "User created successfully"}, {status: 200});
        res.cookies.set("token", tokenData, {httpOnly: true});

        return res;
    } catch (e) {
        console.log(e);
        return NextResponse.error();
    }
}