process.env.DB_HOST = 'localhost';
process.env.DB_DATABASE = 'postgres';
process.env.DB_USER = 'testappuser';
process.env.DB_PASSWORD = 'testapppassword';
process.env.DB_PORT = '5401';

import { Sequelize } from "sequelize";
import { MigratorEngine, MigrationVersionTable } from "../src";
import path from 'path';
// import fs from 'fs';
import { QueryInterface } from "sequelize/types";


type MIGRATION_VERSION = '2021_01_01' | '2021_01_02' | '2021_01_03';
export const getMigrationEngineInstance = (sequelize: Sequelize, targetVersion: MIGRATION_VERSION) => {

    const migrationFolder = path.join(__dirname, 'migrations');
    // console.log('migrationFolder', fs.readdirSync(migrationFolder));
    const engine = new MigratorEngine(sequelize, migrationFolder, targetVersion);

    return engine;
}

export const clearDatabase = async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
        'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
    );
}
