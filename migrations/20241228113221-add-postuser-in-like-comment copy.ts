'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // add index on postUserId in postLikes table
    await queryInterface.addIndex('post_likes', ['postUserId']);
    // // add index on postUserId in postComments table
    await queryInterface.addIndex('postComments', ['postUserId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('post_likes', ['postUserId']);
    await queryInterface.removeIndex('postComments', ['postUserId']);
  },
};
