'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface CTASectionProps {
	tagline?: string;
	heading?: string;
	description?: string;
	buttonText?: string;
	buttonLink?: string;
	backgroundImage?: string;
}

export function CTASection({
	tagline = 'Got a moment?',
	heading = "Let's build your personalized workout plan.",
	description = 'Join thousands of athletes tracking progress, staying consistent, and achieving their fitness goals with intelligent training tools.',
	buttonText = 'START NOW',
	buttonLink = '/signup',
	backgroundImage = '/images/cta-athlete.png'
}: CTASectionProps) {
	return (
		<section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
			<div className="min-h-screen grid lg:grid-cols-2">
				<div className="container mx-auto">
					<div className="flex items-center justify-start min-h-screen p-12 lg:p-20">
						<div className="max-w-xl text-white">
							<p className="text-[#ff6b35] text-sm font-semibold mb-4 uppercase tracking-wider">
								{tagline}
							</p>

							<h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
								{heading}
							</h2>

							<p className="text-lg text-gray-300 mb-8 leading-relaxed">
								{description}
							</p>

							<Button
								asChild
								className="bg-[#ff6b35] hover:bg-[#ff5722] text-white px-8 py-6 text-lg rounded-lg font-semibold"
								size="lg"
							>
								<Link href={buttonLink}>{buttonText}</Link>
							</Button>
						</div>
					</div>
				</div>

				<div className="relative min-h-screen">
					<Image
						src={backgroundImage}
						alt="Athlete"
						fill
						className="object-cover"
						priority
					/>

					<div className="absolute top-8 right-8 bg-white px-4 py-3 rounded-xl shadow-lg">
						<p className="text-xs text-gray-600 font-medium mb-1">
							Plan Progress
						</p>
						<p className="text-xl font-bold text-green-500">
							90% achieved
						</p>
					</div>

					<div className="absolute bottom-8 left-8 bg-white px-4 py-3 rounded-xl shadow-lg">
						<p className="text-xs text-gray-600 font-medium mb-1">
							Streaks Completed
						</p>
						<p className="text-xl font-bold text-green-500">
							80% achieved
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}