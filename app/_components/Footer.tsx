import { buildInfo } from '@/lib/build-info';

export default function Footer() {
  const YEAR = (buildInfo.buildTime ?? '').slice(0, 4) || '';
  return (
    <footer id="footer-zone" role="contentinfo" className="bg-blue text-text-on-blue py-6 text-sm text-center">
      © {YEAR} tullyelly. All rights reserved.
    </footer>
  );
}
