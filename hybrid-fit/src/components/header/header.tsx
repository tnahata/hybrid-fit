"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/dark-mode-toggle/toggle";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react"; 

export function Header() {

	const { status } = useSession();

	const handleSignOut = async () => {
		await signOut({
			callbackUrl: '/',
			redirect: true,
		});
	};

	return (
		<header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black sticky top-0 z-50">
			<Link href="/" className="text-2xl text-white font-bold tracking-tight hover:opacity-80 transition-opacity">
				Hybrid Fit
			</Link>

			<div className="flex items-center gap-4">
				<ModeToggle />
				{status === 'loading' || status === 'unauthenticated' ?
					<Link href="/signin">
						<Button className="bg-[#ff6b35] hover:bg-[#ff5722] text-white">Sign In</Button>
					</Link>
					:
				<Button onClick={handleSignOut} variant="outline" className="border-gray-700 hover:bg-gray-900">
					Sign Out
				</Button>
				}
				
			</div>
		</header>
	);
}