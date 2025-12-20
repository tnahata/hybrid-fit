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
		<div className="grid md:grid-cols-2 h-full w-full">

			<div className="p-8 flex flex-col justify-between w-full overflow-x-hidden">
				<div className="mb-8 flex-shrink-0">
					<h2 className="text-xl font-bold mb-1">HYBRID FIT</h2>
				</div>

				<div className="flex-1 flex flex-col justify-center space-y-6">
					<h1 className="text-2xl font-bold">{title}</h1>
					<p>{content}</p>
				</div>

				<div className="mt-8 flex gap-3 flex-shrink-0 max-w-full">
					<Button
						onClick={onBack}
						variant="outline"
						className="flex-1 px-4 md:px-8 whitespace-nowrap min-w-0"
						disabled={disabled}
					>
						Back
					</Button>
					<Button
						onClick={onNext}
						className="flex-1 px-4 md:px-8 whitespace-nowrap min-w-0"
						disabled={disabled}
					>
						{buttonLabel}
					</Button>
				</div>
			</div>

			<div className="hidden md:block relative bg-gradient-to-br from-orange-400 via-orange-300 to-teal-400 w-full">
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
