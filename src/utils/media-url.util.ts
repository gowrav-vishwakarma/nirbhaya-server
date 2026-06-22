export function resolveMediaUrl(
  path: string | null | undefined,
): string | null | undefined {
  if (!path || path.startsWith('http')) return path;
  if (process.env.USE_LOCAL_FILE_SYSTEM === 'true') return path;
  const cdn = process.env.S3_IMAGE_CDN;
  if (!cdn) return path;
  return `${cdn.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function resolveMediaUrls(
  urls: string[] | null | undefined,
): string[] {
  return (urls ?? []).map((u) => resolveMediaUrl(u) as string);
}
