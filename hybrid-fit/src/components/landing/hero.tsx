'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
	heading?: string;
	subheading?: string;
	buttonText?: string;
	buttonRoute?: string;
}

export function HeroSection({
	heading = 'Effortless Workout Planning',
	subheading = 'HybridFit helps you train toward your hybrid goal, integrating sport, running, and strength training seamlessly.',
	buttonText = 'Sign Up',
	buttonRoute = '/signup'
}: HeroSectionProps) {
	const router = useRouter();

	const handleButtonClick = () => {
		router.push(buttonRoute);
	};

	return (
		<section className="relative min-h-[600px] lg:min-h-[700px] bg-[#2c3e50] overflow-hidden">
			<div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[55%] opacity-30">
				<ImageGrid />
			</div>

			<div className="lg:hidden absolute inset-0 opacity-20">
				<ImageGrid />
			</div>

			<div className="relative z-10 container mx-auto px-6 lg:px-8 py-20 lg:py-32">
				<div className="max-w-xl">
					<h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
						{heading}
					</h1>

					<p className="text-lg lg:text-xl text-gray-300 mb-6 leading-relaxed">
						{subheading}
					</p>

					<p className="text-sm lg:text-base text-gray-400 mb-8">
						Available on Web only.
					</p>

					<Button
						onClick={handleButtonClick}
						className="bg-[#ff6b35] hover:bg-[#ff5722] text-white px-8 py-6 text-lg rounded-md font-medium transition-colors"
						size="lg"
					>
						{buttonText}
					</Button>
				</div>
			</div>
		</section>
	);
}

function ImageGrid() {
	const images = [
		{ id: 1, src: '/images/workout-1.jpg', height: 'h-[280px]' },
		{ id: 2, src: '/images/workout-2.jpg', height: 'h-[320px]' },
		{ id: 3, src: '/images/workout-3.jpg', height: 'h-[240px]' },
		{ id: 4, src: '/images/workout-4.jpg', height: 'h-[200px]' },
		{ id: 5, src: '/images/workout-5.jpg', height: 'h-[260px]' },
		{ id: 6, src: '/images/workout-6.jpg', height: 'h-[220px]' },
		{ id: 7, src: '/images/workout-7.jpg', height: 'h-[280px]' },
		{ id: 8, src: '/images/workout-8.jpg', height: 'h-[200px]' },
		{ id: 9, src: '/images/workout-9.jpg', height: 'h-[240px]' },
		{ id: 10, src: '/images/workout-10.jpg', height: 'h-[300px]' },
		{ id: 11, src: '/images/workout-11.jpg', height: 'h-[260px]' },
	];

	return (
		<div className="flex gap-4 h-full items-end justify-end pr-0 overflow-visible">
			<div className="flex flex-col gap-4 justify-end w-[180px]">
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[0].height}`}>
					<img src={images[0].src} alt="Workout 1" className="w-full h-full object-cover" />
				</div>
			</div>

			<div className="flex flex-col gap-4 justify-end w-[180px]">
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[1].height}`}>
					<img src={images[1].src} alt="Workout 2" className="w-full h-full object-cover" />
				</div>
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[4].height}`}>
					<img src={images[4].src} alt="Workout 5" className="w-full h-full object-cover" />
				</div>
			</div>

			<div className="flex flex-col gap-4 justify-end w-[180px]">
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[2].height}`}>
					<img src={images[2].src} alt="Workout 3" className="w-full h-full object-cover" />
				</div>
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[5].height}`}>
					<img src={images[5].src} alt="Workout 6" className="w-full h-full object-cover" />
				</div>
			</div>

			<div className="flex flex-col gap-4 justify-end w-[180px]">
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[3].height}`}>
					<img src={images[3].src} alt="Workout 4" className="w-full h-full object-cover" />
				</div>
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[6].height}`}>
					<img src={images[6].src} alt="Workout 7" className="w-full h-full object-cover" />
				</div>
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[8].height}`}>
					<img src={images[8].src} alt="Workout 9" className="w-full h-full object-cover" />
				</div>
			</div>

			<div className="flex flex-col gap-4 justify-end w-[220px] -mr-16">
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[7].height}`}>
					<img src={images[7].src} alt="Workout 8" className="w-full h-full object-cover" />
				</div>
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[9].height}`}>
					<img src={images[9].src} alt="Workout 10" className="w-full h-full object-cover" />
				</div>
				<div className={`relative rounded-2xl overflow-hidden bg-gray-700 ${images[10].height}`}>
					<img src={images[10].src} alt="Workout 11" className="w-full h-full object-cover" />
				</div>
			</div>
		</div>
	);
}