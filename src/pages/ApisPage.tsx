import { apiEndpoints } from "@/data/constants";
import { cn } from "@/lib/utils";

export default function ApisPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">APIs Abertas</h1>
          <p className="text-muted-foreground">Integre o CreativeFlow AI ao seu stack com nossa API REST.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">Autenticação</h2>
          <p className="text-sm text-muted-foreground mb-3">Todas as requisições devem incluir o header de autenticação:</p>
          <pre className="p-4 rounded-lg bg-secondary text-xs overflow-x-auto font-mono">
            Authorization: Bearer sk_live_sua_api_key
          </pre>
        </div>

        <div className="space-y-4">
          {apiEndpoints.map((ep, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className={cn(
                  "text-xs font-mono font-bold px-2 py-0.5 rounded",
                  ep.method === "POST" ? "bg-primary/20 text-primary" : "bg-info/20 text-info"
                )}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono">{ep.path}</code>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{ep.description}</p>
              {ep.body && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Body:</span>
                  <pre className="mt-1 p-3 rounded-lg bg-secondary text-xs overflow-x-auto font-mono">{ep.body}</pre>
                </div>
              )}
              {ep.response && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Response:</span>
                  <pre className="mt-1 p-3 rounded-lg bg-secondary text-xs overflow-x-auto font-mono">{ep.response}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-xl border border-border bg-card text-center">
          <p className="text-sm text-muted-foreground">
            Documentação completa disponível no plano <span className="font-semibold text-foreground">Business</span>.
            Sandbox de testes incluído.
          </p>
        </div>
      </div>
    </div>
  );
}
