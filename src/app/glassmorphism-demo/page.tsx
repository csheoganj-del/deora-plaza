import { GlassmorphismCardDemo } from '@/components/ui/glassmorphism-card-sample'
import { GlassmorphismSystemDemo } from '@/components/ui/glassmorphism-system'
import { ExactGlassmorphismDemo } from '@/components/ui/exact-glassmorphism-card'

export default function GlassmorphismDemoPage() {
  return (
    <div className="min-h-screen">
      {/* Exact Match Demo - This is what you want */}
      <section>
        <ExactGlassmorphismDemo />
      </section>

      {/* Original Demos for comparison */}
      <section className="py-16 border-t border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Alternative Styles (for comparison)</h2>
        </div>
        <GlassmorphismCardDemo />
      </section>

      <section className="border-t border-white/10">
        <GlassmorphismSystemDemo />
      </section>
    </div>
  )
}
