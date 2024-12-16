'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('communityPosts', 'showLocation', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'location',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('communityPosts', 'showLocation');
  },
};
