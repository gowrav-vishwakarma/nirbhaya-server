'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'deletionReason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'deletionRequestedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'scheduledDeletionAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'deletionReason');
    await queryInterface.removeColumn('Users', 'deletionRequestedAt');
    await queryInterface.removeColumn('Users', 'scheduledDeletionAt');
  },
};
