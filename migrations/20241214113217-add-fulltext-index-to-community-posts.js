'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE communityPosts 
      ADD FULLTEXT INDEX post_search_idx (title, description, tags)
      WITH PARSER ngram
      /*!50100 WITH PARSER ngram */
    `);

    await queryInterface.addIndex(
      'communityPosts',
      ['status', 'isDeleted', 'createdAt', 'priority'],
      {
        name: 'idx_posts_common_filters',
      },
    );

    await queryInterface.sequelize.query(`
      ALTER TABLE communityPosts 
      ADD SPATIAL INDEX spatial_location (location)
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE communityPosts 
      DROP INDEX post_search_idx,
      DROP INDEX idx_posts_common_filters,
      DROP INDEX spatial_location
    `);
  },
};
