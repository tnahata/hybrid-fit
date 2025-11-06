import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Service | HybridFit",
	description: "Understand the terms and conditions for using HybridFit.",
};

export default function TermsPage() {
	return (
		<>
			<main className="max-w-3xl mx-auto px-6 py-16">
				<h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
				<p className="text-gray-600 mb-8">
					Effective Date: November 2025
				</p>

				<div className="space-y-6 text-gray-800 leading-relaxed">
					<p>
						Welcome to <strong>HybridFit</strong>! These terms outline your rights and
						responsibilities when using our platform. Please read them carefully.
					</p>

					<h2 className="text-2xl font-semibold">1. Using HybridFit</h2>
					<p>
						HybridFit provides fitness tracking, training programs, and AI-based
						recommendations for your personal use. You must be at least 16 years old
						to create an account.
					</p>

					<h2 className="text-2xl font-semibold">2. Accounts & Security</h2>
					<p>
						You’re responsible for keeping your account credentials safe and for all
						activity under your account. Please notify us immediately of any
						unauthorized access.
					</p>

					<h2 className="text-2xl font-semibold">3. Content & Ownership</h2>
					<p>
						You retain ownership of your workout data. HybridFit owns its app,
						design, and intellectual property. Please don’t copy or redistribute our
						content without permission.
					</p>

					<h2 className="text-2xl font-semibold">4. Health Disclaimer</h2>
					<p>
						HybridFit is designed to support your training — not replace professional
						medical advice. Always consult your doctor before beginning a new
						exercise program.
					</p>

					<h2 className="text-2xl font-semibold">5. Termination</h2>
					<p>
						You may delete your account anytime. HybridFit reserves the right to
						suspend or terminate accounts that violate these terms or misuse the
						platform.
					</p>

					<p>
						Questions? Contact{" "}
						<a href="mailto:support@hybridfit.ai" className="text-blue-600 hover:underline">
							support@hybridfit.ai
						</a>.
					</p>
				</div>
			</main>
		</>
	);
}
