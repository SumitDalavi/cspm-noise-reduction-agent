import fs from 'fs';
import path from 'path';

export interface Finding {
  id: string;
  cve: string;
  package: string;
  severity: string;
  cvss: string;
  environment: string;
  context: {
    internetFacing: boolean;
    publicExploitAvailable: boolean;
    loadedAtRuntime: boolean;
  };
  scanner: string;
  resource: string;
}

export function loadFindings(): Finding[] {
  const dataPath = path.join(__dirname, '../../data/mock_findings.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found: ${dataPath}`);
  }
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(rawData);
}
