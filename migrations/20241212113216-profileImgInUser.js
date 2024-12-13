'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('Users', 'profileImage', {
        type: Sequelize.STRING,
      }),
    ]);
  },

  async down(queryInterface) {
    return Promise.all([queryInterface.removeColumn('Users', 'profileImage')]);
  },
};
