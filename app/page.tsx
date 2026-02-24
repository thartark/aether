import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Demo } from "@/components/landing/demo"
import { Providers } from "@/components/landing/providers"
import { Install } from "@/components/landing/install"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Demo />
      <Providers />
      <Install />
      <Footer />
    </main>
  )
}
