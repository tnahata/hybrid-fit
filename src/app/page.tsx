'use client';

import { useEffect } from "react";
import { CTASection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features";
import { FAQSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Home() {
	const { status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "authenticated") {
			router.push("/dashboard");
		}
	}, [status, router]);

	const features = [
		{
			id: 1,
			title: 'Browse exercises',
			description: 'Explore over 1000 curated exercises and drills for all sports.',
			image: '/images/feature-1.png',
			buttonText: 'See Exercises',
			buttonLink: '/exercises',
			colorHex: '#9aa9ab',
		},
		{
			id: 2,
			title: 'Follow Training Plans',
			description: 'Access structured training plans that help you progress toward your goal, whatever they might be.',
			image: '/images/feature-2.png',
			buttonText: 'See Plans',
			buttonLink: '/training-plans',
			colorHex: '#f2f0e1'
		},
		{
			id: 3,
			title: 'Track your progress',
			description: 'Save workouts, mark completions, and visualize improvements over time!',
			image: '/images/feature-3.png',
			buttonText: 'See Dashboard',
			buttonLink: '/dashboard',
			colorHex: '#d4d4cb'
		},
		{
			id: 4,
			title: 'Your Personal AI Coach',
			description: 'Get instant, personalized workout recommendations powered by AI. Our intelligent coach analyzes your workout history, fitness goals, and progress to provide tailored advice whenever you need it.',
			image: '/images/feature-4.png',
			buttonText: 'Try AI Coach',
			buttonLink: '/signup',
			colorHex: '#fff2f3'
		}
	];

	return (
		<div>
			<HeroSection />
			<FeaturesSection features={features} />
			<CTASection />
			<FAQSection />
		</div>
	);
}
