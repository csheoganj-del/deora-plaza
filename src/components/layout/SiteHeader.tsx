"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "glass-panel frosted-texture border-b border-white/30 shadow-sm py-2" 
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-10 w-10 overflow-hidden transition-transform duration-500 group-hover:rotate-12">
                 <Image 
                   src="/assets/logo-deora.svg" 
                   alt="Deora Plaza" 
                   width={40} 
                   height={40} 
                   className="object-contain"
                 />
              </div>
              <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${scrolled ? 'text-[#111827]' : 'text-[#111827]'}`}>
                DEORA <span className="text-[hsl(var(--soft-gold))]">PLAZA</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {[
              { label: 'Experiences', href: '#experiences' },
              { label: 'Destinations', href: '#units' },
              { label: 'Innovation', href: '#innovation' },
              { label: 'Stories', href: '#testimonials' },
            ].map((item) => (
              <Link 
                key={item.label}
                href={item.href} 
                className="relative text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors group py-2"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[hsl(var(--soft-gold))] transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/customer">
              <Button 
                variant="ghost" 
                className="text-[#111827] hover:text-[hsl(var(--rajasthani-teal))] hover:bg-[hsl(var(--rajasthani-teal))/5] font-medium"
              >
                Order Online
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-[hsl(var(--soft-gold))] hover:bg-[hsl(var(--rajasthani-gold))] text-white border-0 shadow-lg shadow-[hsl(var(--soft-gold))/20] hover:shadow-[hsl(var(--soft-gold))/40] transition-all hover:-translate-y-0.5 rounded-full px-6">
                Dashboard Access
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-full hover:bg-[#F1F5F9] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6 text-[#111827]" /> : <Menu className="h-6 w-6 text-[#111827]" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 frosted-glass-heavy frosted-texture transition-transform duration-300 ease-in-out md:hidden flex flex-col pt-24 px-6 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-6 text-2xl font-semibold text-[#111827]">
          <Link href="#experiences" onClick={() => setMobileOpen(false)} className="hover:text-[hsl(var(--soft-gold))]">Experiences</Link>
          <Link href="#units" onClick={() => setMobileOpen(false)} className="hover:text-[hsl(var(--soft-gold))]">Destinations</Link>
          <Link href="#innovation" onClick={() => setMobileOpen(false)} className="hover:text-[hsl(var(--soft-gold))]">Innovation</Link>
          <Link href="#testimonials" onClick={() => setMobileOpen(false)} className="hover:text-[hsl(var(--soft-gold))]">Stories</Link>
        </div>
        
        <div className="mt-auto mb-10 flex flex-col gap-4">
          <Link href="/customer" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" size="lg" className="w-full border-[#E5E7EB] h-12 text-lg">Order Online</Button>
          </Link>
          <Link href="/login" onClick={() => setMobileOpen(false)}>
            <Button size="lg" className="w-full bg-[hsl(var(--soft-gold))] hover:bg-[hsl(var(--rajasthani-gold))] text-white h-12 text-lg">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

