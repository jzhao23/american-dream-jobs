/**
 * Extract DWAs (Detailed Work Activities) from O*NET Database
 *
 * Parses the O*NET DWA Reference and Tasks to DWAs files to create:
 * 1. A complete DWA taxonomy with IWA/GWA hierarchy
 * 2. A mapping of careers to their DWAs
 *
 * Run: npx tsx scripts/extract-dwas.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ONET_DIR = path.join(process.cwd(), 'data/sources/onet/db_30_1_text');
const OUTPUT_DIR = path.join(process.cwd(), 'data/compass');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Parse tab-separated file
function parseTSV<T>(filename: string): T[] {
  const filepath = path.join(ONET_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split('\t');

  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = values[i]?.trim() || '';
    });
    return obj as T;
  });
}

// Interfaces for O*NET DWA data
interface DWAReferenceRaw {
  'Element ID': string;      // GWA (e.g., 4.A.1.a.1)
  'IWA ID': string;          // IWA (e.g., 4.A.1.a.1.I01)
  'DWA ID': string;          // DWA (e.g., 4.A.1.a.1.I01.D01)
  'DWA Title': string;       // e.g., "Review art or design materials."
}

interface IWAReferenceRaw {
  'Element ID': string;      // GWA (e.g., 4.A.1.a.1)
  'IWA ID': string;          // IWA (e.g., 4.A.1.a.1.I01)
  'IWA Title': string;       // e.g., "Study details of artistic productions."
}

interface TaskToDWARaw {
  'O*NET-SOC Code': string;  // e.g., 11-1011.00
  'Task ID': string;         // e.g., 20461
  'DWA ID': string;          // e.g., 4.A.2.a.4.I09.D03
  'Date': string;
  'Domain Source': string;
}

interface ContentModelRaw {
  'Element ID': string;
  'Element Name': string;
  'Description': string;
}

// Output interfaces
interface DWA {
  id: string;
  title: string;
  iwa_id: string;
  iwa_title: string;
  gwa_id: string;
  gwa_title: string;
}

interface CareerDWAMapping {
  onet_code: string;
  dwa_ids: string[];
  dwa_count: number;
}

interface DWATaxonomy {
  metadata: {
    source: string;
    generated_at: string;
    total_dwas: number;
    total_iwas: number;
    total_gwas: number;
  };
  gwas: Record<string, { id: string; title: string; iwas: string[] }>;
  iwas: Record<string, { id: string; title: string; gwa_id: string; dwas: string[] }>;
  dwas: Record<string, DWA>;
}

interface CareerDWAMappings {
  metadata: {
    source: string;
    generated_at: string;
    total_careers: number;
    total_mappings: number;
  };
  careers: Record<string, CareerDWAMapping>;
}

async function main() {
  console.log('\n=== Extracting DWAs from O*NET Database ===\n');

  // Load all data files
  console.log('Loading O*NET files...');
  const dwaReference = parseTSV<DWAReferenceRaw>('DWA Reference.txt');
  const iwaReference = parseTSV<IWAReferenceRaw>('IWA Reference.txt');
  const taskToDwas = parseTSV<TaskToDWARaw>('Tasks to DWAs.txt');
  const contentModel = parseTSV<ContentModelRaw>('Content Model Reference.txt');

  console.log(`  DWA Reference: ${dwaReference.length} entries`);
  console.log(`  IWA Reference: ${iwaReference.length} entries`);
  console.log(`  Tasks to DWAs: ${taskToDwas.length} mappings`);

  // Build GWA title lookup from Content Model Reference
  const gwaLookup = new Map<string, string>();
  contentModel.forEach(item => {
    // GWAs start with 4.A. (Work Activities)
    if (item['Element ID'].startsWith('4.A.')) {
      gwaLookup.set(item['Element ID'], item['Element Name']);
    }
  });
  console.log(`  GWA titles found: ${gwaLookup.size}`);

  // Build IWA lookup
  const iwaLookup = new Map<string, { id: string; title: string; gwa_id: string }>();
  iwaReference.forEach(iwa => {
    iwaLookup.set(iwa['IWA ID'], {
      id: iwa['IWA ID'],
      title: iwa['IWA Title'],
      gwa_id: iwa['Element ID']
    });
  });

  // Build complete DWA taxonomy
  console.log('\nBuilding DWA taxonomy...');
  const dwas: Record<string, DWA> = {};
  const iwas: Record<string, { id: string; title: string; gwa_id: string; dwas: string[] }> = {};
  const gwas: Record<string, { id: string; title: string; iwas: string[] }> = {};

  dwaReference.forEach(dwa => {
    const dwaId = dwa['DWA ID'];
    const iwaId = dwa['IWA ID'];
    const gwaId = dwa['Element ID'];

    // Get IWA info
    const iwaInfo = iwaLookup.get(iwaId);
    const iwaTitle = iwaInfo?.title || `IWA ${iwaId}`;

    // Get GWA title
    const gwaTitle = gwaLookup.get(gwaId) || `GWA ${gwaId}`;

    // Add DWA
    dwas[dwaId] = {
      id: dwaId,
      title: dwa['DWA Title'],
      iwa_id: iwaId,
      iwa_title: iwaTitle,
      gwa_id: gwaId,
      gwa_title: gwaTitle
    };

    // Track IWA
    if (!iwas[iwaId]) {
      iwas[iwaId] = {
        id: iwaId,
        title: iwaTitle,
        gwa_id: gwaId,
        dwas: []
      };
    }
    if (!iwas[iwaId].dwas.includes(dwaId)) {
      iwas[iwaId].dwas.push(dwaId);
    }

    // Track GWA
    if (!gwas[gwaId]) {
      gwas[gwaId] = {
        id: gwaId,
        title: gwaTitle,
        iwas: []
      };
    }
    if (!gwas[gwaId].iwas.includes(iwaId)) {
      gwas[gwaId].iwas.push(iwaId);
    }
  });

  const taxonomy: DWATaxonomy = {
    metadata: {
      source: 'O*NET 30.1',
      generated_at: new Date().toISOString(),
      total_dwas: Object.keys(dwas).length,
      total_iwas: Object.keys(iwas).length,
      total_gwas: Object.keys(gwas).length
    },
    gwas,
    iwas,
    dwas
  };

  console.log(`  Total GWAs: ${taxonomy.metadata.total_gwas}`);
  console.log(`  Total IWAs: ${taxonomy.metadata.total_iwas}`);
  console.log(`  Total DWAs: ${taxonomy.metadata.total_dwas}`);

  // Build career to DWA mappings
  console.log('\nBuilding career-to-DWA mappings...');
  const careerDWAs = new Map<string, Set<string>>();

  taskToDwas.forEach(mapping => {
    const onetCode = mapping['O*NET-SOC Code'];
    const dwaId = mapping['DWA ID'];

    if (!careerDWAs.has(onetCode)) {
      careerDWAs.set(onetCode, new Set());
    }
    careerDWAs.get(onetCode)!.add(dwaId);
  });

  const careerMappings: Record<string, CareerDWAMapping> = {};
  let totalMappings = 0;

  careerDWAs.forEach((dwaSet, onetCode) => {
    const dwaIds = Array.from(dwaSet);
    careerMappings[onetCode] = {
      onet_code: onetCode,
      dwa_ids: dwaIds,
      dwa_count: dwaIds.length
    };
    totalMappings += dwaIds.length;
  });

  const mappingsOutput: CareerDWAMappings = {
    metadata: {
      source: 'O*NET 30.1 Tasks to DWAs',
      generated_at: new Date().toISOString(),
      total_careers: Object.keys(careerMappings).length,
      total_mappings: totalMappings
    },
    careers: careerMappings
  };

  console.log(`  Careers with DWAs: ${mappingsOutput.metadata.total_careers}`);
  console.log(`  Total career-DWA mappings: ${mappingsOutput.metadata.total_mappings}`);

  // Calculate statistics
  const dwaCounts = Object.values(careerMappings).map(c => c.dwa_count);
  const avgDWAs = dwaCounts.reduce((a, b) => a + b, 0) / dwaCounts.length;
  const minDWAs = Math.min(...dwaCounts);
  const maxDWAs = Math.max(...dwaCounts);

  console.log(`  Avg DWAs per career: ${avgDWAs.toFixed(1)}`);
  console.log(`  Min DWAs per career: ${minDWAs}`);
  console.log(`  Max DWAs per career: ${maxDWAs}`);

  // Write output files
  console.log('\nWriting output files...');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'dwa-taxonomy.json'),
    JSON.stringify(taxonomy, null, 2)
  );
  console.log(`  Written: data/compass/dwa-taxonomy.json`);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'career-dwas.json'),
    JSON.stringify(mappingsOutput, null, 2)
  );
  console.log(`  Written: data/compass/career-dwas.json`);

  // Create a simpler DWA list for embedding generation
  const dwaList = Object.values(dwas).map(dwa => ({
    id: dwa.id,
    title: dwa.title,
    iwa_title: dwa.iwa_title,
    gwa_title: dwa.gwa_title,
    // Combined text for embedding
    embedding_text: `${dwa.title} (${dwa.iwa_title})`
  }));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'dwa-list.json'),
    JSON.stringify({
      metadata: {
        source: 'O*NET 30.1',
        generated_at: new Date().toISOString(),
        total: dwaList.length
      },
      dwas: dwaList
    }, null, 2)
  );
  console.log(`  Written: data/compass/dwa-list.json`);

  // Show sample DWAs
  console.log('\nSample DWAs:');
  Object.values(dwas).slice(0, 5).forEach(dwa => {
    console.log(`  ${dwa.id}: ${dwa.title}`);
    console.log(`    IWA: ${dwa.iwa_title}`);
    console.log(`    GWA: ${dwa.gwa_title}`);
  });

  // Show sample career mapping
  console.log('\nSample career DWA mapping (Registered Nurses 29-1141.00):');
  const nurseMapping = careerMappings['29-1141.00'];
  if (nurseMapping) {
    console.log(`  Total DWAs: ${nurseMapping.dwa_count}`);
    console.log(`  First 5 DWAs:`);
    nurseMapping.dwa_ids.slice(0, 5).forEach(dwaId => {
      const dwa = dwas[dwaId];
      if (dwa) {
        console.log(`    - ${dwa.title}`);
      }
    });
  }

  console.log('\n=== DWA Extraction Complete ===\n');
}

main().catch(console.error);
