"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-[#9CA3AF] pt-24 pb-12 border-t border-[#111827]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image src="/assets/logo-deora.svg" alt="Deora Plaza" width={140} height={50} className="h-14 w-auto brightness-0 invert" />
              <span className="text-2xl font-bold tracking-tight text-white">DEORA <span className="text-[hsl(var(--soft-gold))]">PLAZA</span></span>
            </div>
            <p className="text-[#9CA3AF] leading-relaxed max-w-sm">
              Redefining luxury hospitality through innovative technology, sustainable practices, and exceptional service.
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-10 w-10 rounded-full bg-[#111827] border border-[#111827] flex items-center justify-center hover:bg-[hsl(var(--soft-gold))] hover:text-white hover:border-[hsl(var(--soft-gold))] transition-all duration-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">Quick Links</h3>
            <ul className="space-y-4">
              {["Experiences", "Destinations", "Innovation", "Stories", "Order Online"].map((link) => (
                <li key={link}>
                  <Link href="#" className="hover:text-[hsl(var(--soft-gold))] transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 rounded-full bg-[hsl(var(--soft-gold))] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[hsl(var(--soft-gold))] flex-shrink-0 mt-1" />
                <span>123 Main Road, <br />Udaipur, Rajasthan, 313001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[hsl(var(--soft-gold))] flex-shrink-0" />
                <span>+91 123 456 7890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[hsl(var(--soft-gold))] flex-shrink-0" />
                <span>concierge@deoraplaza.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">Newsletter</h3>
            <p className="text-sm mb-4">Subscribe for exclusive offers and updates.</p>
            <div className="flex bg-[#111827] p-1 rounded-full border border-[#111827] focus-within:border-[hsl(var(--soft-gold))] transition-colors">
              <input
                type="email"
                placeholder="Your email address"
                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-[#6B7280] px-4 w-full outline-none"
              />
              <button className="bg-[hsl(var(--soft-gold))] text-[#111827] rounded-full px-6 py-2 font-bold text-sm hover:bg-[hsl(var(--rajasthani-gold))] transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#111827] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[#9CA3AF] text-sm">© {new Date().getFullYear()} Deora Plaza. All rights reserved.</div>
          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>
          <div className="text-[#6B7280] text-xs">
            Designed by <a href="#" className="text-[#9CA3AF] hover:text-[hsl(var(--soft-gold))] transition-colors">PixnCraft Studio</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

