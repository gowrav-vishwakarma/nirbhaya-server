'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('Users', 'hasCatalog', {
      type: 'BOOLEAN',
      defaultValue: false,
    });
    await queryInterface.addColumn('Users', 'doesDelivery', {
      type: 'BOOLEAN',
      defaultValue: false,
    });
    await queryInterface.addColumn('Users', 'deliveryText', {
      type: 'VARCHAR(255)',
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'hasCatalog');
    await queryInterface.removeColumn('Users', 'doesDelivery');
    await queryInterface.removeColumn('Users', 'deliveryText');
  },
};
