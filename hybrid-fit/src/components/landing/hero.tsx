"use client";

import { Button } from "../ui/button";
import Link from "next/link";

export function Hero() {
    return (
        <section className="flex flex-col items-center justify-center text-center py-24">
            <h1 className="text-5xl font-bold tracking-tight">
                Smarter Training Starts Here
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Discover drills, exercises, and training plans personalized to your sport goals.
            </p>
            <div className="mt-8 flex gap-4">
                <Link href="/signup">
                    <Button size="lg">Get Started</Button>
                </Link>
                <Link href="/exercises">
                    <Button variant="outline" size="lg">Browse Exercises</Button>
                </Link>
            </div>
        </section>
    );
}