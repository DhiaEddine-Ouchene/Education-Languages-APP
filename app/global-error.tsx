"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError] Uncaught root exception:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Une erreur inattendue est survenue
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Le serveur rencontre temporairement des difficultés de connexion. Veuillez réessayer.
          </p>
          {error.digest && (
            <p className="text-xs font-mono bg-slate-100 text-slate-500 rounded px-2 py-1 mb-6 break-all">
              Code de référence : {error.digest}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
            >
              🔄 Réessayer
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              🏠 Retour à l'accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
