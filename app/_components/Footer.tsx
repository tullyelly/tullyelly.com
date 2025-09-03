import { getBuildInfo } from '@/lib/build-info';

export default async function Footer() {
  const info = await getBuildInfo();
  const YEAR = (info.builtAt ?? '').slice(0, 4) || '';
  return (
    <footer id="footer-zone" role="contentinfo" className="on-blue text-white py-6 text-sm text-center">
      © {YEAR} tullyelly. All rights reserved.
    </footer>
  );
}
