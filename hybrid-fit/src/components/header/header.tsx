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

	const handleSignOut = async () => {
		await signOut({
			callbackUrl: '/',
			redirect: true,
		});
	};

	return (
		<header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black sticky top-0 z-50">
			<Link href="/" className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
				Hybrid Fit
			</Link>

			<div className="flex items-center gap-4">
				{pathname !== '/' && <ModeToggle />}
				{status === 'loading' || status === 'unauthenticated' ? (
					<Link href="/signin">
						<Button>Sign In</Button>
					</Link>
				) : (
					<Button onClick={handleSignOut}>
						Sign Out
					</Button>
				)}
			</div>
		</header>
	);
}