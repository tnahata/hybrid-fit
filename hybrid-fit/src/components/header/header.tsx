"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/dark-mode-toggle/toggle";
import { signOut } from "next-auth/react";

export function Header() {

    const handleSignOut = async () => {
        await signOut({
            callbackUrl: '/',
            redirect: true,
        });
    };

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
                Hyrbid Fit
            </Link>

            <div className="flex items-center gap-4">
                <ModeToggle />
                    <Link href="/signup">
                        <Button>Sign Up</Button>
                    </Link>
                    <Button onClick={handleSignOut} variant="secondary">Sign Out</Button>    
            </div>
        </header>
    );
}
