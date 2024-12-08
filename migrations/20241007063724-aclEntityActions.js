'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('q_entity_actions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      BaseModel: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      appName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'default',
      },
      // createdAt: {
      //   type: Sequelize.DATE,
      //   allowNull: false,
      //   defaultValue: new Date(),
      // },
      // updatedAt: {
      //   type: Sequelize.DATE,
      //   allowNull: false,
      //   defaultValue: new Date(),
      // },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('q_entity_actions');
  },
};
