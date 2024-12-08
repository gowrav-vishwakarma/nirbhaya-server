'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     *
     */
    await queryInterface.createTable('q_role_permissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      entity_action_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'q_entity_actions',
          key: 'id',
        },
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'q_roles',
          key: 'id',
        },
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      from_ips: {
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
    });
  },

  async down(queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     */
    await queryInterface.dropTable('q_role_permissions');
  },
};
