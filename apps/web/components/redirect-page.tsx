"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type RedirectPageProps = {
  to: string;
};

export function RedirectPage({ to }: RedirectPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Try client-side navigation first for smoother UX
    router.replace(to);
    // Fallback to hard navigation in case the router can't handle the path
    if (window.location.pathname !== to) {
      window.location.replace(to);
    }
  }, [router, to]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Duke ju ridrejtuar…</p>
        <p className="font-medium">
          Nëse nuk ndodh automatikisht, hapni{" "}
          <a className="text-primary underline" href={to}>
            {to}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
