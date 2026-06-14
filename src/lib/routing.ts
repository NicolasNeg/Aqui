import type { Venue, RouteResult } from './types';

/**
 * Build adjacency map from venue.paths for graph traversal.
 */
function buildGraph(venue: Venue): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  Object.keys(venue.points).forEach((id) => {
    graph[id] = [];
  });
  venue.paths.forEach(([a, b]) => {
    if (graph[a] && graph[b]) {
      graph[a].push(b);
      graph[b].push(a);
    }
  });
  return graph;
}

/**
 * Find the shortest path (by number of hops) between two points.
 * Uses BFS since most venue graphs are small.
 *
 * For larger venues, swap to Dijkstra with edge weights (distance).
 */
export function findRoute(venue: Venue, fromId: string, toId: string): string[] | null {
  if (fromId === toId) return [fromId];
  if (!venue.points[fromId] || !venue.points[toId]) return null;

  const graph = buildGraph(venue);
  const queue: string[][] = [[fromId]];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    if (node === toId) return path;

    for (const next of graph[node] || []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return null;
}

/**
 * Compute total walking distance along a route (in floor-plan units ≈ meters).
 */
export function routeDistance(venue: Venue, route: string[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = venue.points[route[i]];
    const b = venue.points[route[i + 1]];
    if (a && b) {
      total += Math.hypot(b.x - a.x, b.y - a.y);
    }
  }
  return Math.round(total);
}

/**
 * Full route computation with distance + ETA.
 * Assumes ~70 m/min walking pace.
 */
export function computeRoute(venue: Venue, fromId: string, toId: string): RouteResult | null {
  const path = findRoute(venue, fromId, toId);
  if (!path) return null;
  const distance = routeDistance(venue, path);
  const estimatedMinutes = Math.max(1, Math.round(distance / 70));
  return { path, distance, estimatedMinutes };
}

/**
 * Compute bearing (degrees, 0 = North) from one point to another
 * using floor-plan coordinates (up = -y).
 */
export function bearingBetween(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  const dx = to.x - from.x;
  const dy = -(to.y - from.y); // flip y because up is north
  let deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

/**
 * Describe a turn between two consecutive route segments.
 */
export function describeTurn(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { text: string; arrow: 'up' | 'down' | 'left' | 'right' } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (Math.abs(dy) > Math.abs(dx)) {
    return dy < 0
      ? { text: 'Sigue al norte', arrow: 'up' }
      : { text: 'Sigue al sur', arrow: 'down' };
  } else {
    return dx > 0
      ? { text: 'Gira a la derecha', arrow: 'right' }
      : { text: 'Gira a la izquierda', arrow: 'left' };
  }
}
