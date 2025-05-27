'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface NavbarProps {
    scrollHide?: boolean;
}

const Navbar = ({ scrollHide }: NavbarProps) => {
    const pathname = usePathname();

    var navItems = [
        { name: 'Home', href: '/' },
        { name: 'New Project', href: '/new' },
        { name: 'Projects', href: '/projects' },
        { name: 'Contact Us', href: '/contact' },
    ];

    const loginPage:boolean = pathname === '/login' || pathname === '/signup';
    if (loginPage) {
        navItems = [
            { name: 'Home', href: '/' },
            { name: 'About', href: '/about' },
            { name: 'Contact Us', href: '/contact' },
        ];
    }


    const colorPickerLogin = pathname === '/signup' ? 'bg-brand' : 'bg-gray-300'; 
    const colorPickerLoginHover = pathname === '/signup' ? 'bg-accent' : 'bg-gray-600'; 
    const colorPickerSignup = pathname === '/login' ? 'bg-brand' : 'bg-gray-300';
    const colorPickerSignupHover = pathname === '/login' ? 'bg-accent' : 'bg-gray-600';

    const signOutButton = () => {
        return (
            <button className="ml-4 px-4 py-2 rounded-md bg-brand text-white hover:bg-accent transition"
                    onClick={() => handleSignout()}>
                Sign out
            </button>
        );
    }

    const loginButtons = () => {
        return (
            <>
                <button className={`ml-4 px-4 py-2 rounded-md ${colorPickerLogin} text-white hover:${colorPickerLoginHover} transition`}
                        onClick={() => router.push('/login')}>
                    Log in
                </button>
                <button className={`ml-4 px-4 py-2 rounded-md ${colorPickerSignup} text-white hover:${colorPickerSignupHover} transition`}
                        onClick={() => router.push('/signup')}>
                    Sign up
                </button>
            </>
        );
    }

    const router = useRouter();
    const handleSignout = async () => {
        try {
            const res = await axios.post("/api/logout");
            if (res.status === 200) {
            router.push("/");
            }
        } catch (error) {
            console.error("Logout failed", error);
        }
    }

    const enableScrollHide = (pathname === '/login' || pathname === '/signup')
        ? false // Disable scroll hide on login/signup pages
        : (scrollHide !== undefined ? scrollHide : false); // Default to false if not provided

    const [scrollVisible, setScrollVisible] = useState(false);
    const [mouseVisible, setMouseVisible] = useState(false);

    const visible = enableScrollHide ? (scrollVisible || mouseVisible) : true;

    useEffect(() => {
        if (!enableScrollHide) return; // Don't run effect unless it's needed

        const handleScroll = () => {
        setScrollVisible(window.scrollY > 50);
        };

        const handleMouseMove = (e: MouseEvent) => {
        setMouseVisible(e.clientY < 60);
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);

        handleScroll(); // run once

        return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [enableScrollHide]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 transform ${
        enableScrollHide
          ? visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-10'
          : 'opacity-100 translate-y-0'
      } bg-white shadow-sm px-6 py-4 flex items-center justify-between`}
    >
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="h-8 w-8" />
        <span className="font-semibold text-lg text-brand">SmartStudy</span>
      </div>
      <div className="flex items-center space-x-6">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`text-gray-700 hover:text-brand transition ${
              pathname === item.href ? 'font-semibold text-brand' : ''
            }`}
          >
            {item.name}
          </Link>
        ))}
        {loginPage ? loginButtons() : signOutButton()}
      </div>
    </nav>
  );
};

export default Navbar;
