import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="px-6 pb-12 pt-24">
      <div className="mx-auto max-w-4xl">
        <Separator className="mb-8 bg-border/50" />
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 128 128" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="128" height="128" rx="28" className="fill-primary/20" />
              <path d="M64 24 L72 56 L96 64 L72 72 L64 104 L56 72 L32 64 L56 56 Z" className="fill-primary" />
            </svg>
            <span className="font-medium text-foreground">Aether</span>
            <span>{"- AI Answer Engine"}</span>
          </div>
          <div className="flex items-center gap-6">
            <span>MIT License</span>
            <span>{"Built with your privacy in mind"}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
