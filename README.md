# sequelize typescript migration engine


```ts
// Fist migration file in `migrations` directory. `2021_01_01.ts`
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
    await queryInterface.dropTable('project', { transaction });
}
```

```ts
// Second migration file in `migrations` directory. `2021_01_02.ts`
import { DataTypes } from 'sequelize';
import { QueryInterface, Transaction } from "sequelize/types";
export async function up(queryInterface: QueryInterface, transaction: Transaction) {
    await queryInterface.addColumn('project', 'description', {
        type: DataTypes.STRING,
    }, { transaction });
}
export async function down(queryInterface: QueryInterface, transaction: Transaction) {
    await queryInterface.removeColumn('project', 'description', { transaction });
}
```

```ts
import path from 'path';
import {MigrationEngine} from 'sequelize-typescript-migration-engine';

const migrationFolder = path.join(__dirname, 'migrations');
const engine = new MigratorEngine(sequelize, migrationFolder, '2021_01_02');

await engine.init();
```
