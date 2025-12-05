"use client";

import * as React from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

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

  const handleResponse = React.useCallback(
    (value: FeedbackResponse) => {
      persistResponse(value);
      setStatus("hidden");
    },
    [persistResponse],
  );

  if (status === "hidden") {
    return null;
  }

  const eventId = resolvedToolId ?? "unknown";
  const eventTool = toolTitle ?? eventId;

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-4 right-4 z-40",
        className,
      )}
    >
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border bg-background/95 p-2 shadow-lg shadow-black/5 backdrop-blur-sm">
        <Button
          size="icon-sm"
          className="rounded-full"
          aria-label="Po, vegla ishte e dobishme"
          onClick={() => handleResponse("yes")}
          data-umami-event="Tool feedback"
          data-umami-event-id={eventId}
          data-umami-event-tool={eventTool}
          data-umami-event-response="yes"
        >
          <ThumbsUp className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          size="icon-sm"
          className="rounded-full"
          variant="ghost"
          aria-label="Jo, vegla nuk ishte e dobishme"
          onClick={() => handleResponse("no")}
          data-umami-event="Tool feedback"
          data-umami-event-id={eventId}
          data-umami-event-tool={eventTool}
          data-umami-event-response="no"
        >
          <ThumbsDown className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
