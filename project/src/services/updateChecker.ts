import { GITHUB_REPO } from '../lib/config';

export interface UpdateInfo {
  latestVersion: string;
  downloadUrlApk: string;
  releaseUrl: string;
}

function isNewer(remote: string, local: string): boolean {
  const parse = (v: string) => v.split('.').map(p => parseInt(p, 10) || 0);
  const r = parse(remote);
  const l = parse(local);
  for (let i = 0; i < 3; i++) {
    const rv = r[i] ?? 0;
    const lv = l[i] ?? 0;
    if (rv !== lv) return rv > lv;
  }
  return false;
}

export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) return null;

  const data = await response.json();
  const tag = String(data.tag_name ?? '').replace('v', '');
  if (!tag || !isNewer(tag, currentVersion)) return null;

  const assets: any[] = data.assets ?? [];
  const apk = assets.find(a => String(a.name).endsWith('.apk'));
  const releaseUrl = data.html_url ?? `https://github.com/${GITHUB_REPO}/releases/latest`;

  return {
    latestVersion: tag,
    downloadUrlApk: apk?.browser_download_url ?? releaseUrl,
    releaseUrl,
  };
}
