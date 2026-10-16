// Builds the emergency card's Apple Wallet pass.json with the production layout code
// (veyagocloud supabase/functions/_shared/wallet-pass.ts, imported read-only) for the film's
// fictional sample card, then writes it beside the footage. Run:
//   node --experimental-strip-types tools/capture/wallet-pass/build-pass.mjs [lang]
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PASS_SOURCE = '/Users/cassiandrefke/Developer/Websites/veyagocloud/supabase/functions/_shared/wallet-pass.ts';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', '..', '..', 'public', 'footage');
// Fixed signing day so every build is identical.
const SIGNED_AT = new Date('2026-10-15T12:00:00Z');

// The app's own sample card ("Mom", made-up data from WatchDebugHooks / the service's test fixture).
const SAMPLE_REQUEST = {
  serial: '8b0a4f7e-2d3c-4e5f-9a1b-0c2d3e4f5a6b',
  name: 'Eleanor Hughes',
  bloodType: 'A+',
  dateOfBirth: '1946-03-14',
  allergies: ['Penicillin (hives)', 'Shellfish'],
  medications: ['Eliquis 5 mg', 'Metformin 500 mg', 'Lisinopril 10 mg'],
  conditions: [],
  contacts: [
    { name: 'David Hughes', relation: 'Son', phone: '(614) 555-0133' },
    { name: 'Linda Moreno', relation: 'Neighbor', phone: '(614) 555-0161' },
  ],
  hospital: 'Riverside Methodist Hospital',
  language: '',
  directive: '',
  dnr: '',
  notes: '',
  updatedOn: '2026-09-21',
};

async function main() {
  const lang = process.argv[2] ?? 'en';
  // The source has no package.json "type", so a scratch copy with an .mts extension is imported.
  const scratch = '/tmp/pv-film-pass';
  mkdirSync(scratch, { recursive: true });
  copyFileSync(PASS_SOURCE, join(scratch, 'wallet-pass.mts'));
  const pass = await import(join(scratch, 'wallet-pass.mts'));
  const parsed = pass.parseCardRequest({ ...SAMPLE_REQUEST, lang });
  if (!parsed.ok) throw new Error(`Sample card refused: ${parsed.error} (${parsed.field})`);
  const identity = { passTypeIdentifier: 'pass.example.film', teamIdentifier: 'FILM000000' };
  const json = pass.buildPassJson(parsed.value, identity, SIGNED_AT);
  const front = pass.frontLayout(parsed.value);
  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `wallet-pass${lang === 'en' ? '' : '-' + lang}.pass.json`);
  writeFileSync(file, JSON.stringify({ ...json, _film: { thumbnail: front.thumbnail, images: pass.passImageNames(parsed.value) } }, null, 2));
  console.log(file);
}

main().catch((error) => {
  console.error('build-pass failed:', error);
  process.exit(1);
});
