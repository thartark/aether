"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const providers = ["ChatGPT", "Claude", "Groq", "Gemini"]

function AetherIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" rx="28" className="fill-primary/20" />
      <path d="M64 24 L72 56 L96 64 L72 72 L64 104 L56 72 L32 64 L56 56 Z" className="fill-primary" />
      <circle cx="88" cy="38" r="4" className="fill-primary/70" />
      <circle cx="42" cy="90" r="3" className="fill-primary/50" />
    </svg>
  )
}

export function Hero() {
  const [currentProvider, setCurrentProvider] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProvider((prev) => (prev + 1) % providers.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-24 text-center">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)/0.08,transparent_70%)]" />

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <AetherIcon className="h-12 w-12" />
          <Badge variant="secondary" className="text-sm font-medium">
            Chrome Extension v1.0
          </Badge>
        </div>

        <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
          Your AI answer engine,{" "}
          <span className="text-primary">everywhere</span>
        </h1>

        <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          Select any text, fill any form, write anything better. Powered by{" "}
          <span
            key={currentProvider}
            className="inline-block font-semibold text-foreground transition-all duration-300"
          >
            {providers[currentProvider]}
          </span>{" "}
          and more.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button size="lg" className="gap-2 px-8 text-base font-semibold" asChild>
            <a href="#install">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Extension
            </a>
          </Button>
          <Button variant="outline" size="lg" className="px-8 text-base" asChild>
            <a href="#features">See Features</a>
          </Button>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Free & open source
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Your API keys
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            100% private
          </span>
        </div>
      </div>
    </section>
  )
}
