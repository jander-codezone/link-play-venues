import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SugerenciasIABanner() {
  return (
    <div className="rounded-xl bg-primary/10 border border-primary/20 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground">
              ¿Necesitas programar la semana?
            </p>
            <p className="text-sm text-muted-foreground">
              Deja que nuestra IA te sugiera los mejores artistas para tus eventos
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Sparkles className="h-4 w-4" />
          Generar propuestas
        </Button>
      </div>
    </div>
  );
}
