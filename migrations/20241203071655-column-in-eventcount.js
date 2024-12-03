'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('EventCount', 'referralGiver', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('EventCount', 'referralAcceptor', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('EventCount', 'referAmbassador', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('EventCount', 'referralGiver');
    await queryInterface.removeColumn('EventCount', 'referralAcceptor');
    await queryInterface.removeColumn('EventCount', 'referAmbassador');
  },
};
