import { Badge } from "@/components/ui/badge"

const providers = [
  {
    name: "OpenAI / ChatGPT",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    description: "Industry-leading reasoning and code generation",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    name: "Anthropic / Claude",
    models: ["claude-3.5-sonnet", "claude-3-haiku", "claude-3-opus"],
    description: "Best-in-class for nuanced writing and analysis",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
  {
    name: "Groq",
    models: ["llama-3.3-70b", "mixtral-8x7b", "gemma2-9b"],
    description: "Blazing fast inference for instant responses",
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
  },
  {
    name: "Google / Gemini",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
    description: "Multimodal understanding with broad knowledge",
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
  },
]

export function Providers() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Your favorite AI, your choice
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Bring your own API keys. Switch providers anytime. Compare results side by side.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <div
              key={provider.name}
              className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-6 transition-colors hover:border-primary/20"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-3 w-3 rounded-full ${provider.bgColor}`}>
                  <div className={`m-auto h-1.5 w-1.5 rounded-full ${provider.color} bg-current`} />
                </div>
                <h3 className="font-semibold text-foreground">{provider.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{provider.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {provider.models.map((model) => (
                  <Badge
                    key={model}
                    variant="secondary"
                    className="text-xs font-mono"
                  >
                    {model}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
