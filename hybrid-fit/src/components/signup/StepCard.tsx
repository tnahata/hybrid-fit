import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface StepCardProps {
	title: string;
	content: string;
	image: string;
	onNext: () => void;
	onBack: () => void;
	buttonLabel?: string;
	disabled?: boolean;
}

export function StepCard({ title, content, image, onNext, onBack, buttonLabel = 'Next', disabled = false }: StepCardProps) {
	return (
		<div className="grid md:grid-cols-2 h-full">
			{/* Left side - Content */}
			<div className="p-8 flex flex-col justify-between">
				<div className="mb-8">
					<h2 className="text-xl font-bold mb-1">HYBRID FIT</h2>
				</div>

				<div className="flex-1 flex flex-col justify-center space-y-6">
					<h1 className="text-2xl font-bold">{title}</h1>
					<p className="text-gray-600">{content}</p>
				</div>

				<div className="mt-8 flex gap-3">
					<Button
						onClick={onBack}
						variant="outline"
						className="w-full md:w-auto px-8"
						disabled={disabled}
					>
						Back
					</Button>
					<Button
						onClick={onNext}
						className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8"
						disabled={disabled}
					>
						{buttonLabel}
					</Button>
				</div>
			</div>

			{/* Right side - Image */}
			<div className="hidden md:block relative bg-gradient-to-br from-orange-400 via-orange-300 to-teal-400">
				<Image
					src={image}
					alt={title}
					fill
					className="object-cover"
					priority
				/>
			</div>
		</div>
	);
}
