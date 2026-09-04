"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, BookOpen, AlertCircle } from "lucide-react";

export default function LearnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[LearnError] Student route exception:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="py-12 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full border-border/80 shadow-md text-center">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-bold text-lg text-txt mb-2">
            Impossible de charger vos données d'apprentissage
          </h2>
          <p className="text-sm text-txt-secondary mb-5">
            Une erreur de connexion à la base de données s'est produite. Vos progrès sont bien sauvegardés.
          </p>

          {error.digest && (
            <p className="text-[11px] font-mono text-txt-muted bg-bg-subtle/80 rounded px-2 py-1 mb-5 break-all">
              Réf : {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => reset()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>
            <Link href="/learn">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <BookOpen className="w-4 h-4" />
                Mon Espace
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
