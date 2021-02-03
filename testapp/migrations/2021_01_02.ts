
import { DataTypes } from 'sequelize';
import { QueryInterface, Transaction } from "sequelize/types";


export async function up(queryInterface: QueryInterface, transaction: Transaction) {
    await queryInterface.addColumn('project', 'description', {
        type: DataTypes.STRING,
    }, { transaction });
}

export async function down(queryInterface: QueryInterface, transaction: Transaction) {
    await queryInterface.removeColumn('project', 'description', { transaction })
}
