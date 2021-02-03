
import { DataTypes } from 'sequelize';
import { QueryInterface, Transaction } from "sequelize/types";


export async function up(queryInterface: QueryInterface, transaction: Transaction) {
    await queryInterface.createTable('terrain', {
        name: DataTypes.STRING,
        'ProjectId': {
            type: DataTypes.INTEGER,
            references: {
                model: 'project',
            }
        }
    }, { transaction });

}

export async function down(queryInterface: QueryInterface, transaction: Transaction) {
    await queryInterface.dropTable('terrain', { transaction })
}
