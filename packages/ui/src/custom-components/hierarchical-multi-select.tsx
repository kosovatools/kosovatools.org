"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp } from "lucide-react";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export type HierarchicalNode = {
  id: string;
  label: string;
  description?: string;
  children?: HierarchicalNode[];
};

type InternalNode = HierarchicalNode & {
  children: InternalNode[];
};

type NodeMeta = {
  nodes: InternalNode[];
  descendants: Map<string, string[]>;
  idSet: Set<string>;
};

export type HierarchicalMultiSelectProps = {
  nodes: HierarchicalNode[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  defaultExpandedIds?: string[];
  title?: string;
  className?: string;
  nodeClassName?: string;
  emptyMessage?: string;
  scrollContainerClassName?: string;
  showCollapseAllButton?: boolean;
};

function buildMeta(nodes: HierarchicalNode[]): NodeMeta {
  const descendants = new Map<string, string[]>();
  const idSet = new Set<string>();

  const normalize = (list: HierarchicalNode[]): InternalNode[] => {
    return list.map((node) => {
      const normalizedChildren = normalize(node.children ?? []);
      const descendantList: string[] = [];
      for (const child of normalizedChildren) {
        descendantList.push(child.id);
        const childDescendants = descendants.get(child.id);
        if (childDescendants?.length) {
          descendantList.push(...childDescendants);
        }
      }
      descendants.set(node.id, descendantList);
      idSet.add(node.id);
      return {
        ...node,
        children: normalizedChildren,
      };
    });
  };

  const normalizedNodes = normalize(nodes);

  return {
    nodes: normalizedNodes,
    descendants,
    idSet,
  };
}

function withDefaultExpanded(
  nodes: InternalNode[],
  provided?: string[],
): Set<string> {
  if (provided && provided.length) {
    return new Set(provided);
  }
  const expanded = new Set<string>();
  const walk = (list: InternalNode[], depth: number) => {
    for (const node of list) {
      if (depth <= 1) {
        expanded.add(node.id);
      }
      if (node.children.length) {
        walk(node.children, depth + 1);
      }
    }
  };
  walk(nodes, 0);
  return expanded;
}

export function HierarchicalMultiSelect({
  nodes,
  selectedIds,
  onSelectionChange,
  defaultExpandedIds,
  title = "Opsionet",
  className,
  nodeClassName,
  emptyMessage = "Nuk ka elemente të disponueshme.",
  scrollContainerClassName = "max-h-[420px]",
  showCollapseAllButton = true,
}: HierarchicalMultiSelectProps) {
  const {
    nodes: normalizedNodes,
    descendants,
    idSet,
  } = React.useMemo(() => buildMeta(nodes), [nodes]);

  const defaultExpandedSet = React.useMemo(
    () => withDefaultExpanded(normalizedNodes, defaultExpandedIds),
    [normalizedNodes, defaultExpandedIds],
  );

  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(defaultExpandedSet),
  );

  const defaultSignature = React.useMemo(
    () => Array.from(defaultExpandedSet).sort().join("|"),
    [defaultExpandedSet],
  );
  const prevSignatureRef = React.useRef(defaultSignature);

  React.useEffect(() => {
    setExpanded((prev) => {
      const filtered = new Set<string>();
      for (const id of prev) {
        if (idSet.has(id)) {
          filtered.add(id);
        }
      }

      if (prevSignatureRef.current !== defaultSignature) {
        prevSignatureRef.current = defaultSignature;
        return new Set(defaultExpandedSet);
      }

      return filtered.size === prev.size ? prev : filtered;
    });
  }, [defaultExpandedSet, defaultSignature, idSet]);

  const selectedSet = React.useMemo(
    () => new Set(selectedIds.filter((id) => idSet.has(id))),
    [selectedIds, idSet],
  );

  const toggleExpand = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const updateSelection = React.useCallback(
    (id: string, checked: boolean) => {
      const next = new Set(selectedSet);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      onSelectionChange(Array.from(next));
    },
    [onSelectionChange, selectedSet],
  );

  const renderNodes = React.useCallback(
    (list: InternalNode[], depth: number): React.ReactNode => {
      if (!list.length) {
        return null;
      }

      return list.map((node) => {
        const isExpanded = expanded.has(node.id);
        const hasChildren = node.children.length > 0;
        const descendantIds = descendants.get(node.id) ?? [];

        const isChecked = selectedSet.has(node.id);
        let selectedCount = 0;
        if (descendantIds.length) {
          for (const descendant of descendantIds) {
            if (selectedSet.has(descendant)) {
              selectedCount += 1;
            }
          }
        }
        const isIndeterminate = !isChecked && selectedCount > 0;

        return (
          <li key={node.id} className="flex min-w-0 flex-col gap-1">
            <div
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md px-1 py-0.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60",
                isChecked
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/60 text-foreground",
                nodeClassName,
              )}
              style={{ paddingLeft: depth * 16 }}
              role="checkbox"
              aria-checked={isIndeterminate ? "mixed" : isChecked}
              aria-label={node.label}
              tabIndex={0}
              onClick={(event) => {
                const target = event.target as HTMLElement | null;
                if (target?.closest("[data-hms-stop]")) {
                  return;
                }
                updateSelection(node.id, !isChecked);
              }}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  updateSelection(node.id, !isChecked);
                }
              }}
            >
              {hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-5 w-5 text-muted-foreground"
                  data-hms-stop
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleExpand(node.id);
                  }}
                  aria-label={
                    isExpanded ? `Mbyll ${node.label}` : `Hap ${node.label}`
                  }
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              ) : (
                <span className="h-5 w-5" />
              )}
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <Checkbox
                  data-hms-stop
                  checked={isIndeterminate ? "indeterminate" : isChecked}
                  onCheckedChange={(value) =>
                    updateSelection(node.id, value === true)
                  }
                  className="h-3.5 w-3.5"
                  aria-label={`Zgjidh ${node.label}`}
                />
                <span className="truncate font-medium whitespace-nowrap">
                  {node.label}
                </span>
              </div>
            </div>
            {hasChildren && isExpanded ? (
              <ul className="flex min-w-0 flex-col gap-1">
                {renderNodes(node.children, depth + 1)}
              </ul>
            ) : null}
          </li>
        );
      });
    },
    [
      descendants,
      expanded,
      nodeClassName,
      selectedSet,
      toggleExpand,
      updateSelection,
    ],
  );

  const handleCollapseAll = React.useCallback(() => {
    setExpanded((prev) => {
      if (prev.size === 0) {
        return new Set(defaultExpandedSet);
      }
      return new Set();
    });
  }, [defaultExpandedSet]);

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 px-1 pb-1 text-muted-foreground">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px]">
            {selectedSet.size} të përzgjedhura
          </span>
          {showCollapseAllButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7"
              onClick={handleCollapseAll}
              title="Mbyll të gjitha degët"
              aria-label="Mbyll të gjitha degët"
            >
              <ChevronsDownUp className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className={cn("overflow-y-auto", scrollContainerClassName)}>
        {normalizedNodes.length ? (
          <ul className="flex max-w-full flex-col gap-1 p-1">
            {renderNodes(normalizedNodes, 0)}
          </ul>
        ) : (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
