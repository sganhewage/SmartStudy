"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const [user, setUser] = useState({
            email: "",
            password: "",
        });
    
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        try{
            e.preventDefault();
            if (user.email && user.password) {
                setError('');
                const res = await axios.post("/api/login", user);
                
                if (res.status === 200) router.push("/");
            } else if (!user.email || !user.password) {
                setError("Please fill all fields");
            }
        } catch (err) {
            if (err.status === 400 || err.status === 401) {
                setError(err.response.data.message);
            }
            console.log(err.response.data);
        }
    }

    return (
        <>
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md bg-slate-50 shadow-lg rounded-lg p-8">
                <div className="">
                    <Image
                        width = {48}
                        height = {48}
                        alt="Your Company"
                        src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                        className="mx-auto h-10 w-auto"
                    />
                    <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Log in to your account
                    </h2>
                </div>

                <div className="mt-10">
                    <form action="#" method="POST" className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xl font-medium text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 text-xl"
                                value = {user.email}
                                onChange={(e) => setUser({...user, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-xl font-medium text-gray-900">
                                    Password
                                </label>
                                <div className="text-xl">
                                    <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                            <div className="mt-2">
                                <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 text-xl"
                                value = {user.password}
                                onChange={(e) => setUser({...user, password: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                        <button
                            type="submit"
                            className="mt-6 mb-4 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-xl font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={(e) => handleSubmit(e)}
                        >
                            Log in
                        </button>
                        </div>
                    </form>

                    <span className="text-lg text-red-600 font-bold">{error}</span>

                    <p className="mt-6 text-center text-md text-gray-500">
                        Don't have an account?{' '}
                        <a href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Sign up
                        </a>
                    </p>
                    </div>
                </div>
            </div>
        </>
    )
}
