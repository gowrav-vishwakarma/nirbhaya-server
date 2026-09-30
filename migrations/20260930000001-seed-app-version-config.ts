'use strict';

/**
 * Seeds the version rows that POST /check-version and GET /app-config used to
 * hardcode, so they can now be edited in `system_configs` without a deploy.
 * Existing rows are never overwritten (INSERT IGNORE on the unique `key`).
 *
 * Other overridable keys (all optional, env is used when a row is absent):
 *   app.IMAGE_CDN_URL, app.GOOGLE_MAPS_API_KEY, app.JITSI_MEET_URL,
 *   app.ASTRO_API_BASE_URL, app.CAPGO_BUNDLE_BASE_URL,
 *   app.ENABLE_ASTRO_APP, app.SHOW_INSTALL_PROMPT, app.STREAM_SAVE
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [
      ['app.version.latestVersion', '0.0.227'],
      ['app.version.latestIosVersion', '0.0.227'],
      ['app.version.latestAndroidVersion', '0.0.226'],
      ['app.version.minimumVersion', '0.0.227'],
      ['app.version.testerMinimumVersion', '0.0.213'],
      ['app.version.forceUpdate', 'false'],
      ['app.version.skipUpdate', 'true'],
      [
        'app.version.androidUpdateUrl',
        'https://play.google.com/store/apps/details?id=com.xavoc.shoutout',
      ],
      ['app.version.iosUpdateUrl', 'https://apps.apple.com/app/6738719612'],
    ].map(([key, value]) => ({ key, value, createdAt: now, updatedAt: now }));

    await queryInterface.bulkInsert('system_configs', rows, {
      ignoreDuplicates: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('system_configs', {
      key: { [Sequelize.Op.like]: 'app.version.%' },
    });
  },
};
