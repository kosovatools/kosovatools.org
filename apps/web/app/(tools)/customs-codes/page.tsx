import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CustomsExplorer } from "@workspace/customs-codes";
import { AlertTriangle } from "lucide-react";

const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? "—";

export default function CustomsCodesPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Shfletuesi i Tarifave Doganore të Republikës së Kosovës
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
          Kërkoni dhe shfletoni tarifat doganore sipas kodit, përshkrimit ose
          llogaritni detyrimet për një vlerë të caktuar. Rezultatet përditësohen
          në çast ndërsa filtroni.
        </p>
      </header>

      <section>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start">
          <Card className="rounded-2xl border border-border/70 bg-card/70 px-6">
            <CardHeader className="px-0">
              <CardTitle className="flex justify-between items-start text-base">
                <span className="font-semibold uppercase tracking-wide">
                  Përditësuar / Last updated
                </span>
                <time
                  title={buildTime}
                  dateTime={buildTime}
                  className="font-normal"
                >
                  {buildTime}
                </time>
              </CardTitle>
              <CardDescription className="text-xs">
                Të dhënat rifreskohen periodikisht nga burimet publike të
                Doganës së Kosovës.
              </CardDescription>
            </CardHeader>
          </Card>

          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle aria-hidden className="h-4 w-4" />
              Informacion i rëndësishëm
            </AlertTitle>
            <AlertDescription className="space-y-2 text-xs text-amber-900 sm:text-sm">
              <p>
                Ky aplikacion është jo-zyrtar dhe
                <strong> nuk përfaqëson Doganën e Kosovës</strong>. Të dhënat
                ngarkohen nga burime publike dhe mund të jenë të papërditësuara.
                Për informata zyrtare, referojuni publikimeve zyrtare.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <CustomsExplorer />
    </article>
  );
}
