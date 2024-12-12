'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('Users', 'roleType', {
        type: Sequelize.STRING,
        defaultValue: 'User',
      }),
    ]);
  },

  async down(queryInterface) {
    return Promise.all([queryInterface.removeColumn('Users', 'roleType')]);
  },
};
