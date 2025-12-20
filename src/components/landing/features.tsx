'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Feature {
	id: number;
	title: string;
	description: string;
	image: string;
	buttonText?: string;
	buttonLink: string;
	colorHex: string;
}

interface FeaturesSectionProps {
	sectionTitle?: string;
	sectionSubtitle?: string;
	features: Feature[];
	autoRotateInterval?: number;
	pauseDuration?: number;
}

export function FeaturesSection({
	sectionTitle = 'Solutions for All Fitness Freaks',
	sectionSubtitle = 'How Fitness Freaks use HybridFit',
	features,
	autoRotateInterval = 5000,
	pauseDuration = 5000
}: FeaturesSectionProps) {
	const [activeIndex, setActiveIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const [direction, setDirection] = useState<'left' | 'right'>('right');
	const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const router = useRouter();

	useEffect(() => {
		if (isPaused || features.length <= 1) return;

		const interval = setInterval(() => {
			setDirection('right');
			setActiveIndex((prev) => (prev + 1) % features.length);
		}, autoRotateInterval);

		return () => clearInterval(interval);
	}, [isPaused, features.length, autoRotateInterval]);

	const handleTabClick = (index: number) => {
		if (index === activeIndex) return;

		setDirection(index > activeIndex ? 'right' : 'left');
		setActiveIndex(index);
		setIsPaused(true);

		if (pauseTimeoutRef.current) {
			clearTimeout(pauseTimeoutRef.current);
		}

		pauseTimeoutRef.current = setTimeout(() => {
			setIsPaused(false);
		}, pauseDuration);
	};

	const handleClick = (linkText: string) => {
		router.push(linkText);
	}

	useEffect(() => {
		return () => {
			if (pauseTimeoutRef.current) {
				clearTimeout(pauseTimeoutRef.current);
			}
		};
	}, []);

	return (
		<section className="py-20 bg-black text-white">
			<div className="container mx-auto px-6">
				<div className="text-center mb-12">
					<p className="text-sm text-white-400 mb-2">{sectionTitle}</p>
					<h2 className="text-4xl lg:text-5xl font-bold">{sectionSubtitle}</h2>
				</div>

				<div className="hidden lg:flex justify-center gap-4 mb-16 flex-wrap">
					{features.map((feature, index) => (
						<button
							key={feature.id}
							onClick={() => handleTabClick(index)}
							className={`px-8 py-3 rounded-full border transition-all ${activeIndex === index
								? 'border-white bg-white/10'
								: 'border-gray-600 hover:border-gray-400'
								}`}
						>
							{ feature.title }
						</button>
					))}
				</div>

				<div className="hidden lg:block relative overflow-hidden">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div className="relative h-[600px]">
							{features.map((feature, index) => (
								<div
									key={feature.id}
									className={`absolute inset-0 transition-all duration-500 ease-in-out ${index === activeIndex
										? 'opacity-100 translate-x-0'
										: index < activeIndex
											? 'opacity-0 -translate-x-full'
											: 'opacity-0 translate-x-full'
										}`}
								>
									<div className="relative w-full h-full rounded-xl overflow-hidden" style={{
										backgroundColor: feature.colorHex,
									}}>
										<Image
											src={feature.image}
											alt={feature.title}
											fill
											className="object-contain"
											priority={index === 0}
										/>
									</div>
								</div>
							))}
						</div>

						<div className="relative min-h-[300px]">
							{features.map((feature, index) => (
								<div
									key={feature.id}
									className={`transition-all duration-500 ease-in-out ${index === activeIndex
										? 'opacity-100 translate-x-0 relative'
										: 'opacity-0 absolute inset-0 pointer-events-none' +
										(direction === 'right' ? ' -translate-x-full' : ' translate-x-full')
										}`}
								>
									<h3 className="text-3xl lg:text-4xl font-bold mb-6">
										{ feature.title }
									</h3>
									<p className="text-lg text-gray-300 mb-8">{feature.description}</p>
									{feature.buttonText && (
										<Button
											className="bg-transparent border border-white hover:bg-white hover:text-black transition-colors px-6 py-6"
											size="lg"
											onClick={() => handleClick(feature.buttonLink)}
										>
											{feature.buttonText}
											<span className="ml-2">→</span>
										</Button>
									)}
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="lg:hidden space-y-16">
					{features.map((feature, index) => (
						<div key={feature.id} className="space-y-6">
							<div className="relative h-[500px] rounded-2xl overflow-hidden bg-gray-900">
								<Image
									src={feature.image}
									alt={feature.title}
									fill
									className="object-contain"
								/>
							</div>
							<div>
								<h3 className="text-2xl font-bold mb-4">Feature {index + 1}</h3>
								<p className="text-base text-gray-300 mb-6">{feature.description}</p>
								{feature.buttonText && (
									<Button
										className="bg-transparent border border-white hover:bg-white hover:text-black transition-colors px-6 py-6"
										size="lg"
									>
										{feature.buttonText}
										<span className="ml-2">→</span>
									</Button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}