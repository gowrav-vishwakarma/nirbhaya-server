'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('system_configs', ['key'], {
      unique: true,
      name: 'idx_system_configs_key',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'system_configs',
      'idx_system_configs_key',
    );
  },
};
