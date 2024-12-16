'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex(
      'communityPosts',
      ['title', 'description', 'tags'],
      {
        type: 'FULLTEXT',
        name: 'post_search_idx',
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('communityPosts', 'post_search_idx');
  },
};
