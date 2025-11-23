import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Coffee, Wine, Hotel, Flower2, ArrowRight, Star, ShieldCheck, Zap } from "lucide-react"

export default async function Home() {
  const session = await getServerSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-900/20 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="font-bold text-black">D</span>
          </div>
          <span className="text-xl font-bold tracking-wider text-white">DEORA PLAZA</span>
        </div>
        <Link href="/login">
          <Button variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-300">
            Staff Login
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="text-center space-y-8 mb-24 animate-float">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm text-amber-400 mb-4">
            <Star className="h-4 w-4 fill-amber-400" />
            <span className="tracking-wide uppercase text-xs font-semibold">World Class Hospitality</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
            <span className="block text-white mb-2">Experience the</span>
            <span className="text-gradient-gold">Extraordinary</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Welcome to Deora Plaza, where luxury meets technology.
            A seamless ecosystem managing fine dining, premium beverages,
            luxury stays, and exquisite events.
          </p>

          <div className="flex justify-center gap-4 pt-8">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-700 text-black font-bold px-8 py-6 text-lg rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                Enter Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Experience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Cafe Card */}
          <div className="group relative h-96 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:-translate-y-2 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1947&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-20 h-full flex flex-col justify-end p-6">
              <div className="h-12 w-12 rounded-xl bg-orange-500/20 backdrop-blur-md flex items-center justify-center mb-4 border border-orange-500/30">
                <Coffee className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">The Cafe</h3>
              <p className="text-gray-400 text-sm mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                Artisan coffee and gourmet cuisine in a serene atmosphere.
              </p>
              <div className="w-full h-1 bg-gradient-to-r from-orange-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          </div>

          {/* Bar Card */}
          <div className="group relative h-96 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:-translate-y-2 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-20 h-full flex flex-col justify-end p-6">
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 backdrop-blur-md flex items-center justify-center mb-4 border border-purple-500/30">
                <Wine className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">The Bar</h3>
              <p className="text-gray-400 text-sm mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                Premium spirits and signature cocktails for the refined palate.
              </p>
              <div className="w-full h-1 bg-gradient-to-r from-purple-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          </div>

          {/* Hotel Card */}
          <div className="group relative h-96 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:-translate-y-2 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-20 h-full flex flex-col justify-end p-6">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 backdrop-blur-md flex items-center justify-center mb-4 border border-blue-500/30">
                <Hotel className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Luxury Stay</h3>
              <p className="text-gray-400 text-sm mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                Experience world-class comfort in our premium suites.
              </p>
              <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          </div>

          {/* Garden Card */}
          <div className="group relative h-96 rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:-translate-y-2 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-20 h-full flex flex-col justify-end p-6">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 backdrop-blur-md flex items-center justify-center mb-4 border border-green-500/30">
                <Flower2 className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">The Garden</h3>
              <p className="text-gray-400 text-sm mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                Host unforgettable events in nature's embrace.
              </p>
              <div className="w-full h-1 bg-gradient-to-r from-green-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <ShieldCheck className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Secure & Reliable</h3>
            <p className="text-gray-400">Enterprise-grade security ensuring your data and transactions are always protected.</p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <Zap className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-400">Optimized for speed and efficiency, keeping your operations running smoothly.</p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <Star className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Premium Experience</h3>
            <p className="text-gray-400">Designed for luxury, providing an unmatched experience for staff and guests.</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          <p>© 2024 Deora Plaza Management System. All rights reserved.</p>
          <p className="mt-2">Designed for Excellence.</p>
        </footer>
      </main>
    </div>
  )
}
