
import { Sequelize, Model, DataTypes } from 'sequelize';
import { QueryInterface, Transaction } from "sequelize/types";



export async function up(queryInterface: QueryInterface, transaction: Transaction) {
    await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "project" (
            "id"   SERIAL,
            "name" VARCHAR(255),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            PRIMARY KEY ("id")
        );
    `, { transaction });
}

export async function down(queryInterface: QueryInterface, transaction: Transaction) {
    await queryInterface.dropTable('project', { transaction })
}

// module.exports = { up, down }