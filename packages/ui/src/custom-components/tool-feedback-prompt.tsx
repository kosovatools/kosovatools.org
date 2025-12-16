"use client";

import * as React from "react";
import { ThumbsDown, ThumbsUp, X } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type FeedbackStatus = "hidden" | "visible";
type FeedbackResponse = "yes" | "no" | "dismissed";

type ToolFeedbackPromptProps = {
  toolId?: string;
  toolTitle?: string;
  className?: string;
};

const STORAGE_PREFIX = "ktools:tool-feedback";
const SHOW_DELAY_MS = 1200;
const POSITIVE_EVENT = "Tool feedback positive";
const NEGATIVE_EVENT = "Tool feedback negative";
const DISMISS_EVENT = "Tool feedback dismissed";

export function ToolFeedbackPrompt({
  toolId,
  toolTitle,
  className,
}: ToolFeedbackPromptProps) {
  const [resolvedToolId, setResolvedToolId] = React.useState<string | null>(
    toolId ?? null,
  );
  const [status, setStatus] = React.useState<FeedbackStatus>("hidden");
  const showTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (toolId && toolId !== resolvedToolId) {
      setResolvedToolId(toolId);
      return;
    }

    if (!resolvedToolId && typeof window !== "undefined") {
      setResolvedToolId(window.location.pathname || "unknown");
    }
  }, [resolvedToolId, toolId]);

  React.useEffect(() => {
    if (!resolvedToolId || typeof window === "undefined") return undefined;

    const storageKey = `${STORAGE_PREFIX}:${resolvedToolId}`;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        showTimeoutRef.current = window.setTimeout(() => {
          setStatus("visible");
        }, SHOW_DELAY_MS);
      }
    } catch {
      setStatus("visible");
    }

    return () => {
      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
    };
  }, [resolvedToolId]);

  const persistResponse = React.useCallback(
    (value: FeedbackResponse) => {
      if (!resolvedToolId || typeof window === "undefined") return;
      const storageKey = `${STORAGE_PREFIX}:${resolvedToolId}`;
      try {
        window.localStorage.setItem(storageKey, value);
      } catch {
        // Ignore write errors (e.g., private mode) to avoid blocking UI.
      }
    },
    [resolvedToolId],
  );

  const handleResponse = React.useCallback((value: FeedbackResponse) => {
    persistResponse(value);
    setStatus("hidden");
  }, [persistResponse]);

  if (status === "hidden") {
    return null;
  }

  const eventId = resolvedToolId ?? "unknown";
  const eventTool = toolTitle ?? eventId;

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-3 left-3 right-3 z-40 sm:bottom-4 sm:left-auto sm:right-4",
        className,
      )}
    >
      <div className="pointer-events-auto flex w-full items-center gap-2 rounded-xl border bg-background/95 px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-sm sm:w-auto sm:flex-nowrap sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col sm:mr-1">
          <span className="truncate text-sm font-medium leading-snug">
            A ju ndihmoi kjo vegel?
          </span>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Pergjigjet na ndihmojne te permiresohemi.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            className="rounded-full"
            variant="outline"
            aria-label="Po, vegla ishte e dobishme"
            type="button"
            onClick={() => handleResponse("yes")}
            data-umami-event={POSITIVE_EVENT}
            data-umami-event-id={eventId}
            data-umami-event-tool={eventTool}
            data-umami-event-response="yes"
          >
            <ThumbsUp className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            size="icon-sm"
            className="rounded-full"
            variant="outline"
            aria-label="Jo, vegla nuk ishte e dobishme"
            type="button"
            onClick={() => handleResponse("no")}
            data-umami-event={NEGATIVE_EVENT}
            data-umami-event-id={eventId}
            data-umami-event-tool={eventTool}
            data-umami-event-response="no"
          >
            <ThumbsDown className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Mbylle sugjerimin e komenteve"
            type="button"
            onClick={() => handleResponse("dismissed")}
            data-umami-event={DISMISS_EVENT}
            data-umami-event-id={eventId}
            data-umami-event-tool={eventTool}
            data-umami-event-response="dismissed"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
