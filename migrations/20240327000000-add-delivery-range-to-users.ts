'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'deliveryRange', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1000, // Default 1000 meters
      after: 'deliveryText',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'deliveryRange');
  },
};
