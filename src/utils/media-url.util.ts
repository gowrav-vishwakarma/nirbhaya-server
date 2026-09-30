// Optional CDN base set at runtime from system_configs (see AppConfigService).
// Falls back to the S3_IMAGE_CDN env var when unset.
let cdnOverride: string | undefined;

export function setMediaCdnOverride(url: string | undefined) {
  cdnOverride = url?.trim() || undefined;
}

export function resolveMediaUrl(
  path: string | null | undefined,
): string | null | undefined {
  if (!path || path.startsWith('http')) return path;
  if (process.env.USE_LOCAL_FILE_SYSTEM === 'true') return path;
  const cdn = cdnOverride || process.env.S3_IMAGE_CDN;
  if (!cdn) return path;
  return `${cdn.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function resolveMediaUrls(
  urls: string[] | null | undefined,
): string[] {
  return (urls ?? []).map((u) => resolveMediaUrl(u) as string);
}
