import { QueryTypes } from "sequelize";
import { MigratorEngine, MigrationVersionTable } from "../src"
import { getInitialEntities } from "./entities/initial.entities";
import { getMigrationEngineInstance, clearDatabase } from "./helper";

describe('START', () => {
    let engine: MigratorEngine;
    beforeAll(async () => {
        const entities = getInitialEntities();
        engine = getMigrationEngineInstance(entities.sequelize, '2021_01_01');
    });
    beforeEach(async () => {
        await clearDatabase(engine.sequelize.getQueryInterface())
    })
    afterAll(async () => {
        await engine.sequelize.close();
    })
    it('udpated to 2021_01_01', async () => {
        await engine.init();
        let migrations = await MigrationVersionTable.findAll()
        expect(migrations.length).toEqual(1);
        expect(migrations[0].toJSON()).toEqual({ name: '2021_01_01' });
    });

    it('should update to 2021_01_02, 2021_01_01, 2021_01_03', async () => {
        engine.targetMigrationName = '2021_01_02';
        await engine.init();
        let migrations = await MigrationVersionTable.findAll()
        expect(migrations.length).toEqual(2);

        engine.targetMigrationName = '2021_01_01';
        await engine.init();
        migrations = await MigrationVersionTable.findAll();
        expect(migrations.length).toEqual(1);
        // engine.eventCallback = (val) => {
        //     console.log('HOP', val);
        // }
        engine.targetMigrationName = '2021_01_03';
        await engine.init();
        migrations = await MigrationVersionTable.findAll();
        expect(migrations.length).toEqual(3);
    });
    it('should have relations now', async () => {
        engine.targetMigrationName = '2021_01_03';
        await engine.init();


        const insertATerrainWithProjectId = async (): Promise<any> => {
            return engine.sequelize.query(`
                INSERT INTO "terrain" ("ProjectId") VALUES (1) RETURNING *;
            `, { type: QueryTypes.SELECT });
        }
        expect(insertATerrainWithProjectId).rejects.toThrow();

        const projectRes = await engine.sequelize.query(`
            INSERT INTO "project" (name, "createdAt", "updatedAt") VALUES ('p1', NOW(), NOW()) RETURNING *;
        `, { type: QueryTypes.SELECT }) as any[];
        expect(projectRes[0]).toHaveProperty('id');
        expect(projectRes[0].id).toEqual(1);

        
        let terrains = await engine.sequelize.query(`SELECT * FROM "terrain";`, { type: QueryTypes.SELECT });
        expect(terrains.length).toEqual(0);
        await insertATerrainWithProjectId();


        terrains = await engine.sequelize.query(`SELECT * FROM "terrain";`, { type: QueryTypes.SELECT });
        expect(terrains.length).toEqual(1);
    })

})