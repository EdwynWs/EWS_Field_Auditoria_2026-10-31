"use client";
import { useEffect, useRef, useState } from "react";
import CommercialProof from "./CommercialProof";
import PremiumHeader from "./PremiumHeader";
import HeroSection from "./HeroSection";
import ProductShowcase from "./ProductShowcase";
import JourneySection from "./JourneySection";
import {
  TrustSection,
  IndustriesSection,
  FeaturesSection,
  SecuritySection,
  UseCasesSection,
  CtaBand,
  FaqSection,
  ContactSection,
  PremiumFooter,
} from "./LandingSections";

function PageEffects() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const nodes = document.querySelectorAll(".ef5-reveal");
    if (!("IntersectionObserver" in window)) return;
    document.querySelector(".ef5-root")?.classList.add("ef5-js-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.07, rootMargin: "0px 0px -25px 0px" },
    );
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - innerHeight;
        setProgress(total > 0 ? scrollY / total : 0);
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);
  return (
    <div
      className="ef5-reading-progress"
      style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress))})` }}
      aria-hidden="true"
      ref={ref}
    />
  );
}

export default function FieldLandingPremium({ signupEnabled = false }) {
  return (
    <div className="ef5-root">
      <PageEffects />
      <PremiumHeader />
      <main id="conteudo">
        <HeroSection />
        <TrustSection />
        <CommercialProof />
        <ProductShowcase />
        <IndustriesSection />
        <JourneySection />
        <FeaturesSection />
        <SecuritySection />
        <UseCasesSection />
        <CtaBand />
        <FaqSection />
        <ContactSection />
      </main>
      <PremiumFooter signupEnabled={signupEnabled} />
    </div>
  );
}
