'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
	question: string;
	answer: string;
}

const faqs: FAQItem[] = [
	{
		question: 'What is HybridFit?',
		answer: 'HybridFit is a comprehensive fitness platform that combines sport and strength trainig, AI-powered coaching, and progress tracking to help you achieve your hybrid fitness goals. Our intelligent system adapts to your experience level, available equipment, and schedule to create the perfect training program for you.'
	},
	{
		question: 'Who is HybridFit for?',
		answer: 'HybridFit is designed for hybrid athletes - from beginners wanting to train for sport and strength to advanced athletes looking to optimize their training. Our adaptive programs work for all fitness levels, goals, and schedules.'
	},
	{
		question: 'How is the HybridFit app different from other fitness apps?',
		answer: 'HybridFit stands out with its AI-powered personalization that adapts to your progress in real-time, comprehensive workout tracking with detailed analytics, an intelligent coach that learns from your history, and flexible programming that works for hybrid atheletes. We combine the best of strength training, sport drills, and recovery into one cohesive platform.'
	},
	{
		question: 'What types of training plans does HybridFit offer?',
		answer: 'HybridFit offers specialized training plans for strength training, running, soccer performance, and hybrid programs that combine multiple other disciplines. Whether you\'re training for a 5K, building strength for your sport, or becoming a well-rounded hybrid athlete, we have plans for beginners, intermediate, and advanced levels. Each plan includes detailed workouts, drills, and recovery protocols tailored to your goals.'
	},
	{
		question: 'What new sports are coming to HybridFit?',
		answer: 'Currently, HybridFit offers strength training, running, and soccer-focused exercises, along with hybrid training plans that combine all three disciplines. We\'re continuously expanding our platform to support athletes across all sports. Stay tuned for upcoming additions including tennis, golf, cycling, and sport-specific conditioning programs designed to help you excel in your chosen activity.'
	}
];

export function FAQSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const toggleFAQ = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	return (
		<section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			<div className="container mx-auto px-6 max-w-4xl">
				<h2 className="text-4xl lg:text-5xl font-bold text-center text-white mb-16">
					FAQ
				</h2>

				<div className="space-y-4">
					{faqs.map((faq, index) => (
						<div
							key={index}
							className="border-b border-gray-700"
						>
							<button
								onClick={() => toggleFAQ(index)}
								className="w-full flex items-center justify-between py-6 text-left hover:opacity-80 transition-opacity"
							>
								<span className="text-lg font-medium text-gray-300 pr-8">
									{faq.question}
								</span>
								<span className="text-2xl text-gray-400 flex-shrink-0">
									{openIndex === index ? '−' : '+'}
								</span>
							</button>

							<div
								className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 pb-6' : 'max-h-0'
									}`}
							>
								<p className="text-gray-400 leading-relaxed">
									{faq.answer}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
			<footer className="mt-16 text-sm text-primary-foreground/70 text-center">
				© {new Date().getFullYear()} HybridFit •{" "}
				<Link href="/privacy" className="underline hover:text-white">Privacy</Link> •{" "}
				<Link href="/terms" className="underline hover:text-white">Terms</Link>
			</footer>
		</section>
	);
}