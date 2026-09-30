import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Op } from 'sequelize';
import { SystemConfig } from '../models/SystemConfig';
import { setMediaCdnOverride } from '../utils/media-url.util';

/**
 * Public, non-secret runtime settings the clients may override without a release.
 *
 * Resolution order for every key:  system_configs row  >  env var(s)  >  default.
 * DB keys are `app.<KEY>` (e.g. `app.IMAGE_CDN_URL`) and `app.version.<field>`.
 * NEVER add secrets here: this is served to unauthenticated clients.
 */
type Kind = 'string' | 'boolean' | 'number';

interface KeyDef {
  key: string;
  kind: Kind;
  /** env vars checked in order when no DB row exists */
  env?: string[];
  default?: string;
}

const DB_PREFIX = 'app.';
const VERSION_PREFIX = 'app.version.';

export const PUBLIC_CONFIG_KEYS: KeyDef[] = [
  { key: 'IMAGE_CDN_URL', kind: 'string', env: ['PUBLIC_IMAGE_CDN_URL', 'S3_IMAGE_CDN'] },
  { key: 'GOOGLE_MAPS_API_KEY', kind: 'string', env: ['PUBLIC_GOOGLE_MAPS_API_KEY'] },
  {
    key: 'JITSI_MEET_URL',
    kind: 'string',
    env: ['PUBLIC_JITSI_MEET_URL'],
    default: 'https://meeting.sosbharat.com',
  },
  { key: 'ASTRO_API_BASE_URL', kind: 'string', env: ['PUBLIC_ASTRO_API_BASE_URL'] },
  { key: 'CAPGO_BUNDLE_BASE_URL', kind: 'string', env: ['PUBLIC_CAPGO_BUNDLE_BASE_URL'] },
  { key: 'ENABLE_ASTRO_APP', kind: 'boolean', default: 'false' },
  { key: 'SHOW_INSTALL_PROMPT', kind: 'boolean', default: 'true' },
  { key: 'STREAM_SAVE', kind: 'boolean', default: 'true' },
  { key: 'SOS_CANCEL_SECONDS', kind: 'number', default: '10' },
  { key: 'SOS_VOLUNTEER_DELAY_SECONDS', kind: 'number', default: '180' },
];

const VERSION_KEYS: KeyDef[] = [
  { key: 'latestVersion', kind: 'string', default: '0.0.227' },
  { key: 'latestIosVersion', kind: 'string', default: '0.0.227' },
  { key: 'latestAndroidVersion', kind: 'string', default: '0.0.226' },
  { key: 'minimumVersion', kind: 'string', default: '0.0.227' },
  { key: 'testerMinimumVersion', kind: 'string', default: '0.0.213' },
  { key: 'forceUpdate', kind: 'boolean', default: 'false' },
  { key: 'skipUpdate', kind: 'boolean', default: 'true' },
  {
    key: 'androidUpdateUrl',
    kind: 'string',
    default: 'https://play.google.com/store/apps/details?id=com.xavoc.shoutout',
  },
  { key: 'iosUpdateUrl', kind: 'string', default: 'https://apps.apple.com/app/6738719612' },
];

export type PublicConfigValues = Record<string, string | boolean | number>;

export interface VersionInfo {
  skipUpdate: boolean;
  latestVersion: string;
  latestIosVersion: string;
  latestAndroidVersion: string;
  forceUpdate: boolean;
  minimumVersion: string;
  androidUpdateUrl: string;
  iosUpdateUrl: string;
}

@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);
  private overrides = new Map<string, string>();
  private loadedAt = 0;

  async onModuleInit() {
    await this.refresh().catch((e) =>
      this.logger.warn(`Initial app-config load failed: ${e?.message ?? e}`),
    );
  }

  /** Keep the in-memory copy fresh so edits in system_configs apply without a redeploy. */
  @Interval(60_000)
  async refresh() {
    const rows = await SystemConfig.findAll({
      where: { key: { [Op.like]: `${DB_PREFIX}%` } },
      attributes: ['key', 'value'],
      raw: true,
    });
    const next = new Map<string, string>();
    for (const r of rows as unknown as { key: string; value: string | null }[]) {
      const v = (r.value ?? '').trim();
      if (v !== '') next.set(r.key, v);
    }
    this.overrides = next;
    this.loadedAt = Date.now();
    // Make server-built media URLs (resolveMediaUrl) follow the same CDN setting.
    setMediaCdnOverride(this.overrides.get(`${DB_PREFIX}IMAGE_CDN_URL`));
  }

  private raw(def: KeyDef, dbKey: string): string | undefined {
    const fromDb = this.overrides.get(dbKey);
    if (fromDb !== undefined) return fromDb;
    for (const name of def.env ?? []) {
      const v = process.env[name]?.trim();
      if (v) return v;
    }
    return def.default;
  }

  private coerce(def: KeyDef, value: string): string | boolean | number {
    if (def.kind === 'boolean') return value === 'true' || value === '1';
    if (def.kind === 'number') {
      const n = Number(value);
      return Number.isFinite(n) ? n : Number(def.default ?? '0');
    }
    return value;
  }

  async getPublicConfig(): Promise<PublicConfigValues> {
    if (Date.now() - this.loadedAt > 120_000) await this.refresh().catch(() => undefined);
    const out: PublicConfigValues = {};
    for (const def of PUBLIC_CONFIG_KEYS) {
      const v = this.raw(def, `${DB_PREFIX}${def.key}`);
      if (v !== undefined) out[def.key] = this.coerce(def, v);
    }
    return out;
  }

  async getVersionInfo(deviceId?: string): Promise<VersionInfo> {
    if (Date.now() - this.loadedAt > 120_000) await this.refresh().catch(() => undefined);
    const v: Record<string, string | boolean> = {};
    for (const def of VERSION_KEYS) {
      const raw = this.raw(def, `${VERSION_PREFIX}${def.key}`);
      if (raw !== undefined) v[def.key] = this.coerce(def, raw) as string | boolean;
    }

    // Tester devices (TESTER_DEVICE_IDS) get a relaxed minimum version, as before.
    const testerIds = process.env.TESTER_DEVICE_IDS || '';
    const isTester = !!deviceId && testerIds.includes(deviceId);

    return {
      skipUpdate: v.skipUpdate as boolean,
      latestVersion: v.latestVersion as string,
      latestIosVersion: v.latestIosVersion as string,
      latestAndroidVersion: v.latestAndroidVersion as string,
      forceUpdate: isTester ? true : (v.forceUpdate as boolean),
      minimumVersion: (isTester ? v.testerMinimumVersion : v.minimumVersion) as string,
      androidUpdateUrl: v.androidUpdateUrl as string,
      iosUpdateUrl: v.iosUpdateUrl as string,
    };
  }
}
