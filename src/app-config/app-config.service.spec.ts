import { AppConfigService } from './app-config.service';
import { SystemConfig } from '../models/SystemConfig';
import { resolveMediaUrl, setMediaCdnOverride } from '../utils/media-url.util';

jest.mock('../models/SystemConfig', () => ({
  SystemConfig: { findAll: jest.fn() },
}));

const findAll = SystemConfig.findAll as unknown as jest.Mock;

function rows(map: Record<string, string>) {
  return Object.entries(map).map(([key, value]) => ({ key, value }));
}

describe('AppConfigService', () => {
  const env = { ...process.env };
  let service: AppConfigService;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.S3_IMAGE_CDN;
    delete process.env.PUBLIC_IMAGE_CDN_URL;
    delete process.env.TESTER_DEVICE_IDS;
    setMediaCdnOverride(undefined);
    service = new AppConfigService();
    findAll.mockReset();
  });

  afterAll(() => {
    process.env = env;
  });

  it('falls back to defaults when nothing is configured', async () => {
    findAll.mockResolvedValue([]);
    await service.refresh();
    const cfg = await service.getPublicConfig();
    expect(cfg.JITSI_MEET_URL).toBe('https://meeting.sosbharat.com');
    expect(cfg.SHOW_INSTALL_PROMPT).toBe(true);
    expect(cfg.ENABLE_ASTRO_APP).toBe(false);
    expect(cfg.IMAGE_CDN_URL).toBeUndefined();
  });

  it('prefers env over defaults and DB over env', async () => {
    process.env.S3_IMAGE_CDN = 'https://env-cdn.example/';
    findAll.mockResolvedValue([]);
    await service.refresh();
    expect((await service.getPublicConfig()).IMAGE_CDN_URL).toBe('https://env-cdn.example/');

    findAll.mockResolvedValue(rows({ 'app.IMAGE_CDN_URL': 'https://db-cdn.example/' }));
    await service.refresh();
    expect((await service.getPublicConfig()).IMAGE_CDN_URL).toBe('https://db-cdn.example/');
  });

  it('ignores blank DB values and coerces booleans', async () => {
    findAll.mockResolvedValue(
      rows({ 'app.JITSI_MEET_URL': '   ', 'app.ENABLE_ASTRO_APP': 'true' }),
    );
    await service.refresh();
    const cfg = await service.getPublicConfig();
    expect(cfg.JITSI_MEET_URL).toBe('https://meeting.sosbharat.com');
    expect(cfg.ENABLE_ASTRO_APP).toBe(true);
  });

  it('makes server-built media URLs follow the DB CDN', async () => {
    findAll.mockResolvedValue(rows({ 'app.IMAGE_CDN_URL': 'https://db-cdn.example/' }));
    await service.refresh();
    expect(resolveMediaUrl('/a/b.jpg')).toBe('https://db-cdn.example/a/b.jpg');
    expect(resolveMediaUrl('https://x.test/y.jpg')).toBe('https://x.test/y.jpg');
  });

  it('serves version info from system_configs and relaxes testers', async () => {
    findAll.mockResolvedValue(
      rows({
        'app.version.minimumVersion': '1.0.0',
        'app.version.forceUpdate': 'true',
      }),
    );
    await service.refresh();
    const normal = await service.getVersionInfo('device-a');
    expect(normal.minimumVersion).toBe('1.0.0');
    expect(normal.forceUpdate).toBe(true);
    expect(normal.androidUpdateUrl).toContain('play.google.com');

    process.env.TESTER_DEVICE_IDS = 'device-t';
    const tester = await service.getVersionInfo('device-t');
    expect(tester.minimumVersion).toBe('0.0.213');
  });
});
