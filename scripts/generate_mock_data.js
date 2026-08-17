const fs = require('fs');
const path = require('path');

const packages = ['log4j', 'openssl', 'react', 'lodash', 'express', 'spring-boot', 'django', 'flask', 'nginx', 'apache'];
const cves = ['CVE-2021-44228', 'CVE-2014-0160', 'CVE-2023-1234', 'CVE-2023-5678', 'CVE-2022-9999'];
const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const environments = ['prod', 'staging', 'dev'];
const statuses = ['open', 'resolved'];

const findings = [];
let idCounter = 1;

for (let i = 0; i < 150; i++) {
  const pkg = packages[Math.floor(Math.random() * packages.length)];
  const cve = cves[Math.floor(Math.random() * cves.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const env = environments[Math.floor(Math.random() * environments.length)];
  const isInternetFacing = Math.random() > 0.5;
  const hasExploit = Math.random() > 0.8;
  const isRunning = Math.random() > 0.3; // Is the vulnerable package actually loaded in memory

  // Create intentional duplicates (same CVE, same pkg, maybe different container or scanner)
  const baseFinding = {
    id: `FND-${idCounter++}`,
    cve,
    package: pkg,
    severity,
    cvss: (Math.random() * 5 + 5).toFixed(1), // 5.0 to 10.0
    environment: env,
    context: {
      internetFacing: isInternetFacing,
      publicExploitAvailable: hasExploit,
      loadedAtRuntime: isRunning
    },
    scanner: i % 2 === 0 ? 'Trivy' : 'Wiz',
    resource: `deployment/app-${Math.floor(Math.random() * 20)}`,
  };

  findings.push(baseFinding);

  // 30% chance to create a duplicate finding from another scanner
  if (Math.random() > 0.7) {
    findings.push({
      ...baseFinding,
      id: `FND-${idCounter++}`,
      scanner: baseFinding.scanner === 'Trivy' ? 'Wiz' : 'Trivy'
    });
  }
}

fs.writeFileSync(
  path.join(__dirname, '../backend/data/mock_findings.json'), 
  JSON.stringify(findings, null, 2)
);
console.log(`Generated ${findings.length} mock findings.`);
