"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BusinessUnit } from "@/lib/business-units";
import SiteHeader from "@/components/layout/SiteHeader";
import { HolographicLogo, HolographicWordmark } from "@/components/ui/holographic-logo";
import { EtherealCard, EtherealGrid } from "@/components/ui/ethereal-card";
import { MagneticButton } from "@/components/ui/magnetic-button";
import {
  Coffee,
  Wine,
  Hotel,
  Flower2,
  ArrowRight,
  Shield,
  Play,
  CheckCircle,
  Award,
  Target,
  Rocket,
  Crown,
  Gem,
  Sparkles,
  BarChart3,
  Smartphone,
  CreditCard,
  Zap,
  Globe,
  Calendar
} from "lucide-react";

interface HomePageClientProps {
  businessUnits: BusinessUnit[];
}

export default function HomePageClient({ businessUnits }: HomePageClientProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const cookies = document.cookie;
        const hasToken = cookies.includes('supabase-auth-token');

        if (hasToken && window.location.pathname !== '/dashboard') {
          const response = await fetch('/api/auth/verify');
          if (response.ok) {
            router.push("/dashboard");
            return;
          }
        }
        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-4">
          <HolographicLogo size="xl" />
          <motion.div
            className="mt-4 text-[#9CA3AF]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading your world-class experience...
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-hidden">
      <SiteHeader />

      {/* HERO SECTION - WORLD-CLASS */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6D5DFB]/20 via-[#C084FC]/20 to-[#EC4899]/20" />

        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[#6D5DFB]/30 to-[#C084FC]/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-[#EC4899]/30 to-[#6D5DFB]/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            className="max-w-5xl mx-auto space-y-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Premium Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism border border-white/20 text-sm font-medium text-[#111827] shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Crown className="h-5 w-5" />
              <span>World's Most Advanced Restaurant Platform</span>
              <Sparkles className="h-4 w-4" />
            </motion.div>

            {/* Holographic Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <HolographicWordmark className="justify-center" />
            </motion.div>

            {/* MASSIVE Headline */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold holographic-text">
                The Future of
              </h1>
              <div className="text-2xl md:text-3xl lg:text-5xl font-bold text-[#111827]">
                <span className="holographic-text">
                  Hospitality Management
                </span>
              </div>
            </motion.div>

            {/* Powerful Description */}
            <motion.p
              className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Transform your restaurant, hotel, and hospitality business with our{' '}
              <span className="text-[#6D5DFB] font-semibold">world-class platform</span>{' '}
              featuring real-time sync, spatial audio notifications, and enterprise-grade reliability.
            </motion.p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <MagneticButton
                variant="primary"
                size="xl"
                onClick={() => router.push('/login')}
                soundEffect
                glowColor="rgba(99, 102, 241, 0.4)"
              >
                <Rocket className="h-5 w-5" />
                Start Your Journey
                <ArrowRight className="h-5 w-5" />
              </MagneticButton>
            </div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-6 text-[#6B7280]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-[#22C55E]" />
                <span>99.99% Uptime</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                <Shield className="h-4 md:h-5 w-4 md:w-5 text-[#6D5DFB]" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                <Award className="h-4 md:h-5 w-4 md:w-5 text-[#F59E0B]" />
                <span>Industry Leading</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BUSINESS UNITS SECTION */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-12 md:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism-light border border-white/10 text-sm font-medium text-[#6D5DFB] mb-6">
              <Target className="h-4 w-4" />
              <span>Business Solutions</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#111827] mb-6">
              Built for Every
              <span className="holographic-text block">
                Hospitality Business
              </span>
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-2xl mx-auto">
              From quick-service cafes to luxury hotels, our platform adapts to your unique needs.
            </p>
          </motion.div>

          <EtherealGrid cols={businessUnits.length > 3 ? 4 : 3}>
            {businessUnits.map((unit, i) => {
              const getIcon = (unitType: string) => {
                switch (unitType) {
                  case 'cafe': return Coffee;
                  case 'restaurant': return Wine;
                  case 'bar': return Wine;
                  case 'hotel': return Hotel;
                  case 'marriage_garden': return Flower2;
                  default: return Coffee;
                }
              };

              const IconComponent = getIcon(unit.type);

              const getGradient = (unitType: string) => {
                const gradients = [
                  'from-[#6D5DFB] to-[#C084FC]',
                  'from-[#C084FC] to-[#EC4899]',
                  'from-[#EC4899] to-[#EF4444]',
                  'from-[#6D5DFB] to-[#3B82F6]',
                  'from-[#22C55E] to-[#14B8A6]'
                ];
                return gradients[i % gradients.length];
              };

              return (
                <EtherealCard
                  key={unit.id}
                  variant={['glass', 'holographic', 'liquid', 'ambient'][i % 4] as any}
                  intensity="medium"
                  className="p-8 group cursor-pointer"
                  onClick={() => router.push(`/dashboard/${unit.type}`)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${getGradient(unit.type)} flex items-center justify-center`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowRight className="h-6 w-6 text-[#6D5DFB]" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-[#111827] mb-3 group-hover:holographic-text transition-all duration-300">
                    {unit.name}
                  </h3>

                  <p className="text-[#6B7280] leading-relaxed mb-6">
                    {unit.description}
                  </p>

                  <div className="flex items-center text-[#6D5DFB] font-semibold text-sm group-hover:gap-3 gap-2 transition-all duration-300">
                    <span>Explore Features</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </EtherealCard>
              );
            })}
          </EtherealGrid>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6D5DFB]/10 via-[#C084FC]/10 to-[#EC4899]/10" />

        <div className="container mx-auto relative z-10">
          <motion.div
            className="text-center mb-12 md:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism-light border border-white/10 text-sm font-medium text-[#C084FC] mb-6">
              <Gem className="h-4 w-4" />
              <span>Premium Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#111827] mb-6">
              Everything You Need to
              <span className="holographic-text block">
                Dominate Your Market
              </span>
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with intuitive design for unmatched performance.
            </p>
          </motion.div>

          <EtherealGrid cols={3}>
            {[
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                description: 'Advanced reporting with live data visualization and predictive insights.',
                variant: 'glass'
              },
              {
                icon: Smartphone,
                title: 'Mobile-First Design',
                description: 'Responsive interface optimized for all devices with native app experience.',
                variant: 'holographic'
              },
              {
                icon: CreditCard,
                title: 'Secure Payments',
                description: 'Enterprise-grade payment processing with fraud protection and compliance.',
                variant: 'liquid'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Sub-second response times with intelligent caching and optimization.',
                variant: 'ambient'
              },
              {
                icon: Globe,
                title: 'Global Scale',
                description: 'Multi-location support with centralized management and local customization.',
                variant: 'glass'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-level security with encryption, audit trails, and compliance certifications.',
                variant: 'holographic'
              },
            ].map((feature, i) => (
              <EtherealCard key={i} variant={feature.variant as any} intensity="medium" className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#6D5DFB] to-[#C084FC] flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:holographic-text transition-all duration-300 text-[#111827]">{feature.title}</h3>
                <p className="text-[#6B7280] leading-relaxed">{feature.description}</p>
              </EtherealCard>
            ))}
          </EtherealGrid>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-[#C084FC]/20 to-transparent" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            className="max-w-4xl mx-auto space-y-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism-light border border-white/10 text-sm font-medium text-[#22C55E] mb-6">
              <Rocket className="h-4 w-4" />
              <span>Ready to Launch</span>
            </div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#111827] mb-8">
              Join the
              <span className="holographic-text block">
                Hospitality Revolution
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-[#6B7280] max-w-3xl mx-auto leading-relaxed mb-12">
              Don't let outdated systems hold you back. Experience the future of hospitality management today.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <MagneticButton
                variant="primary"
                size="xl"
                onClick={() => router.push('/login')}
                soundEffect
                glowColor="rgba(99, 102, 241, 0.4)"
              >
                <Crown className="h-5 w-5" />
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </MagneticButton>
            </div>

            {/* Final Trust Elements */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-[#6B7280] pt-8">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                <span>No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                <span>30-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}