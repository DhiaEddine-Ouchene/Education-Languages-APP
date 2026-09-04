"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, LogIn, AlertCircle } from "lucide-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AuthError] Authentication error:", {
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
            Erreur d'authentification
          </h2>
          <p className="text-sm text-txt-secondary mb-5">
            Une erreur de session ou de connexion au serveur s'est produite lors de la validation de votre compte.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => reset()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <LogIn className="w-4 h-4" />
                Page de connexion
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
