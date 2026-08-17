import { Finding } from '../ingestion/parser';

export interface DedupedFinding extends Finding {
  duplicateCount: number;
  scanners: string[];
}

export function deduplicate(findings: Finding[]): DedupedFinding[] {
  const map = new Map<string, DedupedFinding>();

  for (const finding of findings) {
    // Generate a unique fingerprint for the underlying issue
    const key = `${finding.cve}-${finding.package}-${finding.resource}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.duplicateCount++;
      if (!existing.scanners.includes(finding.scanner)) {
        existing.scanners.push(finding.scanner);
      }
      // If one scanner reports it as running, take the worst case
      if (finding.context.loadedAtRuntime) {
        existing.context.loadedAtRuntime = true;
      }
    } else {
      map.set(key, {
        ...finding,
        duplicateCount: 1,
        scanners: [finding.scanner]
      });
    }
  }

  return Array.from(map.values());
}
