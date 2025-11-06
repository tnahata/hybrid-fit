import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy | HybridFit",
	description: "Learn how HybridFit collects, uses, and protects your data.",
};

export default function PrivacyPage() {
	return (
		<>
			<main className="max-w-3xl mx-auto px-6 py-16">
				<h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
				<p className="text-gray-600 mb-8">
					Effective Date: November 2025
				</p>

				<div className="space-y-6 text-gray-800 leading-relaxed">
					<p>
						At <strong>HybridFit</strong>, we take your privacy seriously. Our goal is
						to help you train smarter — not to sell or misuse your information.
					</p>

					<h2 className="text-2xl font-semibold">1. Information We Collect</h2>
					<p>
						We collect basic account information (like your name and email), your
						logged workouts, and app usage data. This helps us personalize your
						training experience and provide AI-driven recommendations.
					</p>

					<h2 className="text-2xl font-semibold">2. How We Use Your Data</h2>
					<p>
						Your data powers your experience. We use it to generate insights,
						track progress, and improve our smart recommendations. Occasionally,
						anonymized analytics help us understand trends to make HybridFit even
						better.
					</p>

					<h2 className="text-2xl font-semibold">3. Sharing & Security</h2>
					<p>
						We never sell your data. Limited, secure sharing may occur with
						third-party analytics and infrastructure providers (like hosting and
						performance monitoring) — always under strict privacy agreements.
					</p>

					<h2 className="text-2xl font-semibold">4. Your Control</h2>
					<p>
						You can request to delete your account and data anytime. To make a
						request or ask a privacy question, contact us at{" "}
						<a href="mailto:support@hybridfit.ai" className="text-blue-600 hover:underline">
							support@hybridfit.ai
						</a>.
					</p>

					<p>
						We may update this policy periodically. When we do, we’ll post a new
						effective date here so you’re always informed.
					</p>
				</div>
			</main>
		</>
	);
}
