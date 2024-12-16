'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex(
      'communityPosts',
      ['title', 'description', 'tags'],
      {
        type: 'FULLTEXT',
        name: 'post_search_idx',
      },
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('communityPosts', 'post_search_idx');
  },
};
