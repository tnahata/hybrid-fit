import { CTASection } from "@/components/landing/cta-section";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <CTASection /> 
    </div>
  );
}
