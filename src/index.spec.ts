import { MigratorEngine, MigrationVersion, DbState, MigrationVersionTable } from ".";
import * as path from 'path'
// import { DataTypes } from "sequelize";

const folderpath = path.join(__dirname, '..', '..', 'dist', 'migration');
const getMockMigrationEngine = (version: string) => {
    const sequelize = {
        transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() })),
        getQueryInterface: () => ({
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            sequelize: {},
            createTable: jest.fn()
        }),
        // runHooks: jest.fn(),
        // isDefined: jest.fn(),
        // normalizeAttribute: jest.fn(),
        options: {
            logging: false
        }
    } as any;
    // const promise = (): Promise<boolean> => Promise.resolve(shouldDbInit)
    MigrationVersionTable.init = jest.fn();
    const engine = new MigratorEngine(sequelize, folderpath, version);
    spyOn(engine, 'log');
    return engine;
}
describe('db inited  >> TARGET 001_video_task', () => {
    let engine: MigratorEngine;

    beforeEach(() => {
        engine = getMockMigrationEngine('001_video_task')
    })
    afterAll((done) => {
        done()
    })
    // it('table exist but table empty', async () => {
    //     spyOn(engine, 'hasMigrationTable').and.returnValue(true)
    //     spyOn(engine, 'getDbMigrations').and.returnValue([])
    //     spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
    //     spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
    //     spyOn(engine, 'getMigrationFromFolder').and.returnValue([
    //         new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //         new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //     ])
    //     await engine.init()
    //     expect(engine.hasMigrationTable).toBeCalledWith(engine.transaction)
    //     expect(engine.migrations[0].object.up).toBeCalledWith(engine.queryInterface, engine.transaction)
    //     expect(engine.migrations[1].object.up).toBeCalledWith(engine.queryInterface, engine.transaction)
    //     expect(engine.transaction.commit).toBeCalledWith()
    //     expect(engine.dbState).toBe(DbState.DB_IS_GENERATED_VERSION_TABLE_EMPTY)
    // })
    // it('table not exist, it should create table', async () => {
    //     spyOn(engine, 'hasMigrationTable').and.returnValue(false)
    //     spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
    //     spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
    //     spyOn(engine, 'getMigrationFromFolder').and.returnValue([
    //         new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //         new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //     ])
    //     await engine.init()
    //     expect(engine.queryInterface.createTable).toBeCalledWith(MIGRATION_VERSION_TABLE, {
    //         name: {
    //             type: DataTypes.STRING,
    //             primaryKey: true,
    //         }
    //     }, { transaction: engine.transaction })
    //     expect(engine.hasMigrationTable).toBeCalledWith(engine.transaction)
    //     expect(engine.migrations[0].object.up).toBeCalledTimes(0)
    //     expect(engine.migrations[1].object.up).toBeCalledTimes(0)

    //     expect(engine.transaction.commit).toBeCalledWith()
    //     expect(engine.dbState).toBe(DbState.DB_IS_GENERATED_BUT_NO_MIGRATION_TABLE_FOUND)
    // })
    it('should update, version is old', async () => {
        spyOn(engine, 'hasMigrationTable').and.returnValue(true)
        spyOn(engine, 'getDbMigrations').and.returnValue([
            { name: '000_user_phone' }
        ])
        spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
        spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
        spyOn(engine, 'getMigrationFromFolder').and.returnValue([
            new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
        ])
        await engine.init()
        expect(engine.dbState).toBe(DbState.DB_IS_GENERATED_BUT_VERSION_IS_OLD)
        expect(engine.migrations[0].object.up).toBeCalledTimes(0)

        expect(engine.migrations[1].object.up).toBeCalledWith(engine.queryInterface, engine.transaction)
        expect(engine.migrations[1].object.up).toBeCalledTimes(1)

        // expect(engine.queryInterface.commitTransaction).toBeCalledWith(engine.transaction)
        expect(engine.transaction.commit).toBeCalledWith()
        expect(engine.transaction.commit).toBeCalledTimes(1)
    })

})
describe('db inited >> TARGET 004', () => {
    let engine: MigratorEngine;
    const folderpath = path.join(__dirname, '..', '..', 'dist', 'migration');
    beforeEach(() => {
        engine = getMockMigrationEngine('004')
    })
    it('should update, version is old ', async () => {
        spyOn(engine, 'hasMigrationTable').and.returnValue(true)
        spyOn(engine, 'getDbMigrations').and.returnValue([
            { name: '000_user_phone' },
            { name: '001_video_task' },
            { name: '002' },
        ])
        spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
        spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
        spyOn(engine, 'getMigrationFromFolder').and.returnValue([
            new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '002.js'), '002.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '003.js'), '003.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '004.js'), '004.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '005.js'), '005.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
        ])
        await engine.init()
        expect(engine.dbState).toBe(DbState.DB_IS_GENERATED_BUT_VERSION_IS_OLD)
        expect(engine.migrations[0].object.up).toBeCalledTimes(0)
        expect(engine.migrations[1].object.up).toBeCalledTimes(0)
        expect(engine.migrations[2].object.up).toBeCalledTimes(0)
        expect(engine.migrations[3].object.up).toBeCalledTimes(1)
        expect(engine.migrations[4].object.up).toBeCalledTimes(1)
        expect(engine.migrations[5].object.up).toBeCalledTimes(0)

        expect(engine.migrations[3].object.up).toBeCalledWith(engine.queryInterface, engine.transaction)
        expect(engine.migrations[4].object.up).toBeCalledWith(engine.queryInterface, engine.transaction)

        // expect(engine.queryInterface.commitTransaction).toBeCalledWith(engine.transaction)
        expect(engine.transaction.commit).toBeCalledWith()
        expect(engine.transaction.commit).toBeCalledTimes(1)
    })
    it('should down, version is upper', async () => {
        spyOn(engine, 'hasMigrationTable').and.returnValue(true)
        spyOn(engine, 'getDbMigrations').and.returnValue([
            { name: '000_user_phone' },
            { name: '001_video_task' },
            { name: '002' },
            { name: '003' },
            { name: '004' },
            { name: '005' },
            { name: '006' },
            { name: '007' },
        ])
        spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
        spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
        spyOn(engine, 'getMigrationFromFolder').and.returnValue([
            new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '002.js'), '002.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '003.js'), '003.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '004.js'), '004.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '005.js'), '005.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '006.js'), '006.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '007.js'), '007.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
        ])
        await engine.init()
        expect(engine.dbState).toBe(DbState.DB_IS_GENERATED_AND_VERSION_IS_NEED_TO_DOWN)
        for (const m of engine.migrations) {
            expect(m.object.up).toBeCalledTimes(0)
        }
        expect(engine.migrations[0].object.down).toBeCalledTimes(0)
        expect(engine.migrations[1].object.down).toBeCalledTimes(0)
        expect(engine.migrations[2].object.down).toBeCalledTimes(0)
        expect(engine.migrations[3].object.down).toBeCalledTimes(0)
        expect(engine.migrations[4].object.down).toBeCalledTimes(0)
        expect(engine.migrations[5].object.down).toBeCalledTimes(1)
        expect(engine.migrations[6].object.down).toBeCalledTimes(1)
        expect(engine.migrations[7].object.down).toBeCalledTimes(1)

        expect(engine.migrations[5].object.down).toBeCalledWith(engine.queryInterface, engine.transaction)
        expect(engine.migrations[6].object.down).toBeCalledWith(engine.queryInterface, engine.transaction)
        expect(engine.migrations[7].object.down).toBeCalledWith(engine.queryInterface, engine.transaction)

        // expect(engine.queryInterface.commitTransaction).toBeCalledWith(engine.transaction)
        expect(engine.transaction.commit).toBeCalledWith()
        expect(engine.transaction.commit).toBeCalledTimes(1)
    })
    it('should not up or down, target is same with DB', async () => {
        spyOn(engine, 'hasMigrationTable').and.returnValue(true)
        spyOn(engine, 'getDbMigrations').and.returnValue([
            { name: '000_user_phone' },
            { name: '001_video_task' },
            { name: '002' },
            { name: '003' },
            { name: '004' },
        ])
        spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
        spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
        spyOn(engine, 'getMigrationFromFolder').and.returnValue([
            new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '002.js'), '002.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '003.js'), '003.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '004.js'), '004.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '005.js'), '005.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '006.js'), '006.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
            new MigrationVersion(path.join(folderpath, '007.js'), '007.js', {
                up: jest.fn(),
                down: jest.fn(),
            }),
        ])
        await engine.init()
        expect(engine.dbState).toBe(DbState.DB_IS_GENERATED_AND_VERSION_LAST)
        for (const m of engine.migrations) {
            expect(m.object.up).toBeCalledTimes(0)
            expect(m.object.down).toBeCalledTimes(0)
        }

        // expect(engine.queryInterface.rollbackTransaction).toBeCalledWith(engine.transaction)
        expect(engine.transaction.rollback).toBeCalledWith()
        expect(engine.transaction.rollback).toBeCalledTimes(1)
    })
})

describe('db is not inited >> TARGET 001_video_task', () => {
    let engine: MigratorEngine;
    beforeEach(() => {
        engine = getMockMigrationEngine('001_video_task')
    })
    // it('db not inited, it should init', async () => {
    //     spyOn(engine, 'hasMigrationTable').and.returnValue(true)
    //     spyOn(engine, 'getDbMigrations').and.returnValue([])
    //     spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
    //     spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
    //     spyOn(engine, 'getMigrationFromFolder').and.returnValue([
    //         new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //         new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //     ])
    //     await engine.init()
    //     // expect(engine.hasMigrationTable).toBeCalledTimes(0)
    //     expect(engine.getDbMigrations).toBeCalledTimes(0)
    //     expect(engine.deleteMigrationFromTable).toBeCalledTimes(1)
    //     expect(engine.insertMigrationToTable).toBeCalledTimes(2)

    //     for (const migration of engine.migrations) {
    //         expect(migration.object.up).toBeCalledTimes(0)
    //         expect(migration.object.down).toBeCalledTimes(0)
    //     }
    //     expect(engine.transaction.commit).toBeCalledTimes(1)
    //     expect(engine.transaction.commit).toBeCalledWith()
    //     expect(engine.dbState).toBe(DbState.DB_IS_NOT_GENERATED_YET)
    // })
    // it('db not inited, it should throw migration folder is not expected with target', async () => {
    //     spyOn(engine, 'hasMigrationTable').and.returnValue(true)
    //     spyOn(engine, 'getDbMigrations').and.returnValue([])
    //     spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
    //     spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
    //     spyOn(engine, 'getMigrationFromFolder').and.returnValue([
    //         new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //         new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //         new MigrationVersion(path.join(folderpath, '002.js'), '002.js', {
    //             up: jest.fn(),
    //             down: jest.fn(),
    //         }),
    //     ])
    //     await expect(engine.init()).rejects.toThrow('DB is not inited and targetMigration is diffrent with last Migration')
    //     // DB init değil ise ve target ile migration folderdakiler farklı ise hata vermeli
    //     // expect(engine.hasMigrationTable).toBeCalledTimes(0)
    //     expect(engine.getDbMigrations).toBeCalledTimes(0)
    //     expect(engine.deleteMigrationFromTable).toBeCalledTimes(0)
    //     expect(engine.insertMigrationToTable).toBeCalledTimes(0)

    //     for (const migration of engine.migrations) {
    //         expect(migration.object.up).toBeCalledTimes(0)
    //         expect(migration.object.down).toBeCalledTimes(0)
    //     }
    //     expect(engine.transaction.rollback).toBeCalledWith()
    //     expect(engine.transaction.rollback).toBeCalledTimes(1)
    //     expect(engine.dbState).toBe(DbState.DB_IS_NOT_GENERATED_YET)
    // })
})

// describe('db inited  >> TARGET 000_user_phone', () => {
//     let engine: MigratorEngine;
//     beforeEach(() => {
//         engine = getMockMigrationEngine('000_user_phone', true)
//     })
//     it('it should down 001_video_task to 000_user_phone', async () => {
//         spyOn(engine, 'hasMigrationTable').and.returnValue(true)
//         spyOn(engine, 'getDbMigrations').and.returnValue([
//             { name: '000_user_phone' },
//             { name: '001_video_task' },
//         ])
//         spyOn(engine, 'deleteMigrationFromTable').and.returnValue(true)
//         spyOn(engine, 'insertMigrationToTable').and.returnValue(true)
//         spyOn(engine, 'getMigrationFromFolder').and.returnValue([
//             new MigrationVersion(path.join(folderpath, '000_user_phone.js'), '000_user_phone.js', {
//                 up: jest.fn(),
//                 down: jest.fn(),
//             }),
//             new MigrationVersion(path.join(folderpath, '001_video_task.js'), '001_video_task.js', {
//                 up: jest.fn(),
//                 down: jest.fn(),
//             }),
//         ])
//         await engine.init()
//         // expect(engine.hasMigrationTable).toBeCalledTimes(0)
//         // expect(engine.getDbMigrations).toBeCalledTimes(1)
//         expect(engine.deleteMigrationFromTable).toBeCalledTimes(1)
//         expect(engine.insertMigrationToTable).toBeCalledTimes(1)

//         expect(engine.dbState).toBe(DbState.DB_IS_GENERATED_AND_VERSION_IS_NEED_TO_DOWN)
//         for (const migration of engine.migrations) {
//             expect(migration.object.up).toBeCalledTimes(0)
//         }
//         expect(engine.migrations[0].object.down).toBeCalledTimes(0)
//         expect(engine.migrations[1].object.down).toBeCalledTimes(1)

//         expect(engine.transaction.commit).toBeCalledTimes(1)
//         expect(engine.transaction.commit).toBeCalledWith()
//     })
// })