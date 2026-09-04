"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError] Page error occurred:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/80 shadow-lg text-center">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="w-14 h-14 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-bold text-xl text-txt mb-2">
            Oups ! Un problème est survenu
          </h2>
          <p className="text-sm text-txt-secondary mb-5">
            Une erreur temporaire est survenue lors du chargement de la page. Nos services rétablissent la connexion.
          </p>

          {error.digest && (
            <div className="bg-bg-subtle/80 rounded-lg p-2.5 mb-6 text-left">
              <span className="text-[11px] font-mono text-txt-muted break-all">
                ID d'erreur : {error.digest}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => reset()} className="gap-2 shadow-sm">
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <Home className="w-4 h-4" />
                Accueil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
