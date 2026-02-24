import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    step: "1",
    title: "Download the extension",
    description: "Click the download button above or clone the repo. The extension files are in the /aether-extension folder.",
    code: null,
  },
  {
    step: "2",
    title: "Load in Chrome",
    description: "Open chrome://extensions, enable Developer Mode, click \"Load unpacked\" and select the aether-extension folder.",
    code: "chrome://extensions",
  },
  {
    step: "3",
    title: "Add your API keys",
    description: "Click the extension icon, go to Settings, and enter your API keys for any providers you want to use.",
    code: null,
  },
  {
    step: "4",
    title: "Start using it",
    description: "Select text on any page, use Ctrl+Shift+A, or click the extension icon to start generating answers.",
    code: "Ctrl+Shift+A",
  },
]

export function Install() {
  return (
    <section id="install" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Up and running in 2 minutes
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            No store approval needed. Load it directly as a developer extension.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {steps.map((item) => (
            <Card key={item.step} className="border-border/50 bg-card/50">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  {item.code && (
                    <code className="mt-2 inline-block rounded-md bg-secondary px-2.5 py-1 font-mono text-xs text-foreground">
                      {item.code}
                    </code>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
