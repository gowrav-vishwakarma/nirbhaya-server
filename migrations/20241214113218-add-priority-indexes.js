'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('communityPosts', ['priority'], {
      name: 'priority_idx',
    });

    await queryInterface.addIndex('communityPosts', ['created_at'], {
      name: 'created_at_idx',
    });

    // Composite index for location-based queries
    await queryInterface.addIndex(
      'communityPosts',
      ['priority', 'created_at', 'status'],
      {
        name: 'priority_time_status_idx',
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('communityPosts', 'priority_idx');
    await queryInterface.removeIndex('communityPosts', 'created_at_idx');
    await queryInterface.removeIndex(
      'communityPosts',
      'priority_time_status_idx',
    );
  },
};
