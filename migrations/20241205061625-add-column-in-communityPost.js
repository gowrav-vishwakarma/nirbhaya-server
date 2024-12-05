'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('communityPosts', 'isDeleted', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      }),
      queryInterface.addColumn('communityPosts', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      }),
    ]);
  },

  async down(queryInterface) {
    return Promise.all([
      queryInterface.removeColumn('communityPosts', 'isDeleted'),
      queryInterface.removeColumn('communityPosts', 'deletedAt'),
    ]);
  },
};
