import type { Custom } from '@/lib/types/core';

export class CircularDependencyError extends Error {
  constructor(public cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

export function buildDependencyGraph(customs: Custom[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const custom of customs) {
    const deps: string[] = [];
    for (const field of custom.fields) {
      if (field.type === 'reference' && field.referenceId) {
        deps.push(field.referenceId);
      }
    }
    graph.set(custom.id, deps);
  }

  detectCycles(graph, customs);

  return graph;
}

function detectCycles(graph: Map<string, string[]>, customs: Custom[]): void {
  const customMap = new Map(customs.map((c) => [c.id, c]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        dfs(neighborId);
      } else if (recursionStack.has(neighborId)) {
        const cycleStart = path.indexOf(neighborId);
        const cyclePath = path.slice(cycleStart);
        cyclePath.push(neighborId);
        const cycleNames = cyclePath.map((id) => customMap.get(id)?.name || id);
        throw new CircularDependencyError(cycleNames);
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
  }

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }
}

export function getDependencies(
  customId: string,
  graph: Map<string, string[]>
): string[] {
  return graph.get(customId) || [];
}

export function getDependents(
  customId: string,
  graph: Map<string, string[]>
): string[] {
  const dependents: string[] = [];
  for (const [id, deps] of graph.entries()) {
    if (deps.includes(customId)) {
      dependents.push(id);
    }
  }
  return dependents;
}

export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  graph: Map<string, string[]>
): boolean {
  if (sourceId === targetId) {
    return true;
  }

  const visited = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceId) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const deps = graph.get(current) || [];
    queue.push(...deps);
  }

  return false;
}

export function topologicalSort(graph: Map<string, string[]>): string[] {
  const inDegree = new Map<string, number>();

  for (const nodeId of graph.keys()) {
    if (!inDegree.has(nodeId)) {
      inDegree.set(nodeId, 0);
    }
  }

  for (const deps of graph.values()) {
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const deps = graph.get(current) || [];
    for (const dep of deps) {
      const newDegree = (inDegree.get(dep) || 1) - 1;
      inDegree.set(dep, newDegree);
      if (newDegree === 0) {
        queue.push(dep);
      }
    }
  }

  return result.reverse();
}

export function getResolutionOrder(customs: Custom[]): Custom[] {
  const graph = buildDependencyGraph(customs);
  const orderedIds = topologicalSort(graph);
  const customMap = new Map(customs.map((c) => [c.id, c]));

  return orderedIds
    .map((id) => customMap.get(id))
    .filter((c): c is Custom => c !== undefined);
}
