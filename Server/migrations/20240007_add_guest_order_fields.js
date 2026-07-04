"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable("orders");

    if (!tableDesc.guest_email) {
      await queryInterface.addColumn("orders", "guest_email", {
        type: Sequelize.STRING,
        allowNull: true,
        after: "user_id",
      });
    }

    if (!tableDesc.guest_address) {
      await queryInterface.addColumn("orders", "guest_address", {
        type: Sequelize.TEXT,
        allowNull: true,
        after: "guest_email",
      });
    }

    // Make user_id nullable for guest orders
    await queryInterface.changeColumn("orders", "user_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Make shipping_address_id nullable for guest orders
    await queryInterface.changeColumn("orders", "shipping_address_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "addresses", key: "id" },
      onDelete: "RESTRICT",
    });
  },

  down: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable("orders");

    if (tableDesc.guest_email) {
      await queryInterface.removeColumn("orders", "guest_email");
    }
    if (tableDesc.guest_address) {
      await queryInterface.removeColumn("orders", "guest_address");
    }

    await queryInterface.changeColumn("orders", "user_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });

    await queryInterface.changeColumn("orders", "shipping_address_id", {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: "addresses", key: "id" },
      onDelete: "RESTRICT",
    });
  },
};
