"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/dark-mode-toggle/toggle";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Header() {
	const { status } = useSession();
	const pathname = usePathname();
	const isLandingPage = pathname === '/';

	const handleSignOut = async () => {
		await signOut({
			callbackUrl: '/',
			redirect: true,
		});
	};

	return (
		<header className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 z-50 ${isLandingPage
				? 'bg-black border-gray-800 text-white'
				: 'bg-background border-border text-foreground'
			}`}>
			<Link href="/" className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
				Hybrid Fit
			</Link>

			<div className="flex items-center gap-4">
				{!isLandingPage && <ModeToggle />}
				{status === 'loading' || status === 'unauthenticated' ? (
					<Link href="/signin">
						<Button className={isLandingPage ? 'bg-[#ff6b35] hover:bg-[#ff5722] text-white' : ''}>
							Sign In
						</Button>
					</Link>
				) : (
					<Button
						onClick={handleSignOut}
						className={isLandingPage ? 'border-gray-700 text-white hover:bg-gray-900' : ''}
						variant={isLandingPage ? 'outline' : 'default'}
					>
						Sign Out
					</Button>
				)}
			</div>
		</header>
	);
}