import { buildInfo } from '@/lib/build-info';

const YEAR = buildInfo.buildYear || (buildInfo.buildIso ?? '').slice(0, 4) || '';

export default function Footer() {
  return (
    <footer id="footer-zone" role="contentinfo" className="py-6 text-sm opacity-80 text-center">
      © {YEAR} tullyelly. All rights reserved.
    </footer>
  );
}

