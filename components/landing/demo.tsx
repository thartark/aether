"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const demoSteps = [
  {
    label: "Select Text",
    description: "Highlight any text on a webpage",
    preview: (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {"What are your greatest strengths and how do they align with this role?"}
        </div>
        <div className="rounded-md bg-primary/15 px-2 py-1 text-sm font-medium text-primary">
          {"greatest strengths"}
          <span className="ml-1 text-xs text-primary/60">{"(selected)"}</span>
        </div>
      </div>
    ),
  },
  {
    label: "Toolbar Appears",
    description: "Quick actions float near your selection",
    preview: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary px-3 py-2">
          {["Answer", "Summarize", "Improve", "Translate"].map((action) => (
            <button
              key={action}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                action === "Answer"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "Get AI Answer",
    description: "Instant, context-aware response",
    preview: (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-mono">
            gpt-4o
          </Badge>
          <span className="text-xs text-muted-foreground">Professional persona</span>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed text-foreground">
          {"My greatest strengths include analytical problem-solving and cross-functional collaboration. In my previous role, I led a team that reduced system downtime by 40%..."}
        </div>
      </div>
    ),
  },
]

export function Demo() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Three steps. Zero friction.
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            From text selection to perfect answer in under 2 seconds.
          </p>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col gap-2">
            {demoSteps.map((step, i) => (
              <button
                key={step.label}
                onClick={() => setActiveStep(i)}
                className={`flex items-start gap-4 rounded-xl p-4 text-left transition-all ${
                  activeStep === i
                    ? "border border-primary/30 bg-primary/5"
                    : "border border-transparent hover:bg-secondary/50"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    activeStep === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{step.label}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Card className="border-border/50 bg-card/80 p-6">
            <div className="min-h-[140px]">
              {demoSteps[activeStep].preview}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
