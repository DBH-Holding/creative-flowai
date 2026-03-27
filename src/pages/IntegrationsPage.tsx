import { integrations } from "@/data/constants";

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Integrações</h1>
          <p className="text-muted-foreground">Conecte o CreativeFlow AI às ferramentas que seu time já usa.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((int) => (
            <div key={int.name} className="rounded-xl border border-border bg-card p-6 text-center hover:border-primary/30 transition-colors">
              <div className="text-4xl mb-3">{int.icon}</div>
              <h3 className="font-semibold mb-1">{int.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{int.status}</span>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 rounded-xl border border-dashed border-border text-center">
          <h3 className="text-lg font-semibold mb-2">Precisa de uma integração específica?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Nosso roadmap é guiado por clientes. Se sua ferramenta não está listada, entre em contato e priorizamos para você.
          </p>
        </div>
      </div>
    </div>
  );
}
