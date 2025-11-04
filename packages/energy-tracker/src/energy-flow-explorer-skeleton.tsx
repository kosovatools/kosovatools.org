import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Separator } from "@workspace/ui/components/separator";

export function EnergyFlowExplorerSkeleton() {
  return (
    <article className="space-y-8">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-72" />
              <Skeleton className="h-4 w-96 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="w-full max-w-xs space-y-2 lg:text-right">
              <Skeleton className="h-3 w-16 lg:ml-auto" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-3 w-32 lg:ml-auto" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`summary-${index}`}
                className="rounded-lg border border-border/60 p-4"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-7 w-28" />
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-muted-foreground">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`detail-${index}`}
                className="space-y-3 rounded-lg border border-border/60 p-4"
              >
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-4 w-60" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-64" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-56" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-[4/3] w-full rounded-lg border border-dashed border-border/60" />
          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`daily-${index}`}
                className="space-y-2 rounded-lg border border-border/60 p-4"
              >
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-72" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-[3/2] w-full rounded-lg border border-dashed border-border/60" />
          <Separator />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <tbody>
                {Array.from({ length: 4 }).map((_, index) => (
                  <tr
                    key={`row-${index}`}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="mt-2 h-3 w-16" />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Skeleton className="ml-auto h-4 w-24" />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Skeleton className="ml-auto h-4 w-24" />
                    </td>
                    <td className="py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-28" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
