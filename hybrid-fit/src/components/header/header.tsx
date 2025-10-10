"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/dark-mode-toggle/toggle";

export function Header() {
    const pathname = usePathname();

    // const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/signup");
    // if (isAuthRoute) return null; // Hide header on auth pages if desired

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
                Hyrbid Fit
            </Link>

            <div className="flex items-center gap-4">
                <ModeToggle />

                <Link href="/login">
                    <Button variant="ghost">Log In</Button>
                </Link>
                <Link href="/signup">
                    <Button>Sign Up</Button>
                </Link>
            </div>
        </header>
    );
}
