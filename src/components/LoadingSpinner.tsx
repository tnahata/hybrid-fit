import React from "react";

interface LoadingSpinnerProps {
	spinnerText?: string;
	className?: string;
}

export default function LoadingSpinner({ spinnerText = "Loading...", className = "" }: LoadingSpinnerProps) {
	return (
		<div className={`min-h-screen bg-background flex items-center justify-center ${className}`}>
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
				<p className="text-muted-foreground">{spinnerText}</p>
			</div>
		</div>
	);
}