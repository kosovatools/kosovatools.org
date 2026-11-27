"use client";

import * as React from "react";
import { ThumbsDown, ThumbsUp, X } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type FeedbackResponse = "yes" | "no" | "dismissed";

type ToolFeedbackPromptProps = {
  toolId?: string;
  toolTitle?: string;
  className?: string;
};

const STORAGE_PREFIX = "ktools:tool-feedback";
const SHOW_DELAY_MS = 1000 * 60; // 60 sec
const UMAMI_POLL_INTERVAL_MS = 250;
const UMAMI_POLL_TIMEOUT_MS = 5000;
const POSITIVE_EVENT = "Tool feedback positive";
const NEGATIVE_EVENT = "Tool feedback negative";
const DISMISS_EVENT = "Tool feedback dismissed";
const hasUmamiTracker = () => {
  if (typeof window === "undefined") return false;
  return (
    typeof (window as Window & { umami?: { track?: unknown } }).umami?.track ===
    "function"
  );
};

export function ToolFeedbackPrompt(props: ToolFeedbackPromptProps) {
  return (
    <ToolFeedbackPromptContent
      key={props.toolId ?? props.toolTitle}
      {...props}
    />
  );
}

function ToolFeedbackPromptContent({
  toolId,
  toolTitle,
  className,
}: ToolFeedbackPromptProps) {
  const [visibleToolId, setVisibleToolId] = React.useState<string | null>(null);
  const showTimeoutRef = React.useRef<number | null>(null);
  const umamiPollRef = React.useRef<number | null>(null);
  const umamiPollStartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const resolvedToolId = toolId || window.location.pathname || "unknown";
    const storageKey = `${STORAGE_PREFIX}:${resolvedToolId}`;
    const stopUmamiPoll = () => {
      if (umamiPollRef.current) {
        window.clearTimeout(umamiPollRef.current);
        umamiPollRef.current = null;
      }
      umamiPollStartRef.current = null;
    };
    const startUmamiPoll = () => {
      if (umamiPollRef.current) return;
      umamiPollStartRef.current =
        window.performance?.now?.() ?? window.Date.now();
      const poll = () => {
        if (hasUmamiTracker()) {
          stopUmamiPoll();
          setVisibleToolId(resolvedToolId);
          return;
        }
        const now = window.performance?.now?.() ?? window.Date.now();
        if (
          umamiPollStartRef.current &&
          now - umamiPollStartRef.current >= UMAMI_POLL_TIMEOUT_MS
        ) {
          stopUmamiPoll();
          return;
        }
        umamiPollRef.current = window.setTimeout(poll, UMAMI_POLL_INTERVAL_MS);
      };
      umamiPollRef.current = window.setTimeout(poll, UMAMI_POLL_INTERVAL_MS);
    };

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        showTimeoutRef.current = window.setTimeout(() => {
          if (hasUmamiTracker()) {
            setVisibleToolId(resolvedToolId);
          } else {
            startUmamiPoll();
          }
        }, SHOW_DELAY_MS);
      }
    } catch {
      startUmamiPoll();
    }

    return () => {
      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      stopUmamiPoll();
    };
  }, [toolId]);

  const persistResponse = React.useCallback(
    (value: FeedbackResponse) => {
      if (!visibleToolId || typeof window === "undefined") return;
      const storageKey = `${STORAGE_PREFIX}:${visibleToolId}`;
      try {
        window.localStorage.setItem(storageKey, value);
      } catch {
        // Ignore write errors (e.g., private mode) to avoid blocking UI.
      }
    },
    [visibleToolId],
  );

  const handleResponse = React.useCallback(
    (value: FeedbackResponse) => {
      persistResponse(value);
      setVisibleToolId(null);
    },
    [persistResponse],
  );

  if (visibleToolId === null) {
    return null;
  }

  const eventId = visibleToolId;
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
