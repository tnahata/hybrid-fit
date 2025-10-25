'use client';

import { CTASection } from "@/components/landing/cta-section";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'authenticated') {
    router.push("/dashboard");
  }

  return (
    <div>
      <Hero />
      <Features />
      <CTASection /> 
    </div>
  );
}
