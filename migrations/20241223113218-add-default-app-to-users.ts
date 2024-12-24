'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the column
    await queryInterface.addColumn('Users', 'defaultApp', {
      type: Sequelize.ENUM('sos', 'news', 'community', 'astroai'),
      allowNull: false,
      defaultValue: 'sos',
    });
  },

  async down(queryInterface) {
    // Remove the column first
    await queryInterface.removeColumn('Users', 'defaultApp');

    // Then drop the enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Users_defaultApp";
    `);
  },
};
