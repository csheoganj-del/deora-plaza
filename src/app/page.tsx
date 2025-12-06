import { getServerSession } from "next-auth"
export const dynamic = "force-dynamic"
// Futuristic 3D landing without external libs
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Coffee, Wine, Hotel, Flower2, ArrowRight, Star, Users, Calendar, CheckCircle, Clock, Shield } from "lucide-react"

export default async function Home() {
    const session = await getServerSession()

    if (session) {
        redirect("/dashboard")
    }

    return (
        <div className="min-h-screen futuristic-bg text-[hsl(var(--charcoal-text))]">
            <section className="relative h-[92vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[hsl(var(--soft-gold))/12] blur-3xl" />
                </div>
                <div className="relative z-20 container mx-auto px-4 text-center space-y-8 max-w-5xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card-soft text-sm text-[hsl(var(--rajasthani-teal))]">
                        <Star className="h-3.5 w-3.5 text-[hsl(var(--rajasthani-teal))]" />
                        <span className="tracking-wider uppercase text-xs font-medium">Premium Hospitality Management</span>
                    </div>

                    <div className="mx-auto max-w-4xl tilt-3d glass-3d rounded-3xl px-10 py-12 elevation-2">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight depth-layer">
                            Elevate Your <br />
                            <span className="text-gradient-royal">Guest Experience</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mt-6 depth-layer-sm">
                            Deora Plaza unifies luxury stays, fine dining, and breathtaking events into a seamless experience.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 depth-layer-sm">
                            <Link href="/login">
                                <Button size="lg" className="h-14 px-8">
                                    Enter Dashboard
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Button variant="secondary" size="lg" className="h-14 px-8">
                                Explore Services
                            </Button>
                        </div>
                    </div>

                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-white border-b border-slate-100 relative z-20 -mt-24 mx-4 md:mx-20 rounded-2xl shadow-xl tilt-3d">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
                    {[
                        { label: "Hospitality", value: "Premium", icon: Star },
                        { label: "Service", value: "24/7", icon: Clock },
                        { label: "Security", value: "Top-Tier", icon: Shield },
                        { label: "Ambiance", value: "Luxury", icon: Hotel },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center text-center px-4 interactive-scale-sm">
                            <stat.icon className="h-6 w-6 text-amber-500 mb-2" />
                            <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                            <span className="text-sm text-slate-500 font-medium uppercase tracking-wide mt-1">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-24 bg-[hsl(var(--sandstone-cream))]">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">World-Class Facilities</h2>
                        <p className="text-slate-600 text-lg">Discover our comprehensive range of premium services designed for the modern traveler.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: Hotel,
                                title: "Luxury Hotel",
                                desc: "Elegant suites designed for ultimate comfort and relaxation.",
                                image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop"
                            },
                            {
                                icon: Wine,
                                title: "Signature Bar",
                                desc: "Expertly crafted cocktails in a sophisticated atmosphere.",
                                image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"
                            },
                            {
                                icon: Flower2,
                                title: "Garden Events",
                                desc: "Breathtaking outdoor venues for unforgettable celebrations.",
                                image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop"
                            },
                            {
                                icon: Coffee,
                                title: "Artisan Cafe",
                                desc: "Gourmet coffee and culinary delights served daily.",
                                image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2157&auto=format&fit=crop"
                            }
                        ].map((service, i) => (
                            <div key={i} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer h-[400px]">
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors z-10"></div>
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 text-white">
                                            <service.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{service.title}</h3>
                                        <p className="text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 leading-relaxed">
                                            {service.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust/CTA Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="bg-slate-900 rounded-3xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

                        <div className="relative z-10 px-8 py-20 md:p-20 text-center">
                            <h2 className="text-3xl md:text-5xl font-bold text-gradient-royal mb-6">Ready to Experience Deora Plaza?</h2>
                            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
                                Join thousands of satisfied guests who have made us their preferred destination for luxury and comfort.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <div className="flex items-center gap-2 text-white/80">
                                    <CheckCircle className="h-5 w-5 text-amber-500" />
                                    <span>Best Rate Guarantee</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/80">
                                    <CheckCircle className="h-5 w-5 text-amber-500" />
                                    <span>24/7 Concierge</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/80">
                                    <CheckCircle className="h-5 w-5 text-amber-500" />
                                    <span>Premium Amenities</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                            <span className="font-bold text-white text-xl">D</span>
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">DEORA PLAZA</span>
                    </div>
                    <div className="text-slate-500 text-sm">
                        © 2024 Deora Plaza Management System. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-slate-500 text-sm font-medium">
                        <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
                        <a href="https://instagram.com/pixncraftstudio" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 transition-colors flex items-center gap-1">
                            <span>Website by PixnCraft Studio</span>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
