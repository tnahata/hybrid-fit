"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export function CTASection() {
    return (
        <section className="py-24 bg-primary text-primary-foreground text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl mx-auto px-6"
            >
                <h2 className="text-4xl font-bold mb-4">Start Training Smarter Today</h2>
                <p className="text-lg mb-8 text-primary-foreground/90">
                    Join thousands of athletes using our intelligent training tools to track, plan, and improve.
                </p>
                <div className="flex justify-center gap-4">
                    <Button size="lg" asChild variant="secondary">
                        <Link href="/signup">Get Started</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="bg-transparent text-primary-foreground border-white">
                        <Link href="/plans">Explore Plans</Link>
                    </Button>
                </div>
            </motion.div>

            <footer className="mt-16 text-sm text-primary-foreground/70">
                © {new Date().getFullYear()} HybridFit •{" "}
                <Link href="/privacy" className="underline hover:text-white">Privacy</Link> •{" "}
                <Link href="/terms" className="underline hover:text-white">Terms</Link>
            </footer>
        </section>
    );
}
