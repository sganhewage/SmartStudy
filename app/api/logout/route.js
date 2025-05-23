import { NextResponse } from 'next/server';

export const POST = async (req) => {
    try {
        const res = NextResponse.json({message: "Logout successfull"}, {status: 200});
        res.cookies.set("token", "", {httpOnly: true, expires: new Date(0)});
        return res;
        
    } catch (e) {
        console.log(e);
        return NextResponse.error();
    }
}