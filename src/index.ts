
import { QueryTypes, QueryInterface, Transaction, Sequelize, DataTypes, Model } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationFileObject {
    up: (queryInterface: QueryInterface, transaction: Transaction) => Promise<any>;
    down: (queryInterface: QueryInterface, transaction: Transaction) => Promise<any>;
}
export enum DbState {
    DB_IS_NOT_GENERATED_YET = 'DB_IS_NOT_GENERATED_YET', // yeni server'a ilk defa kuruluyor ise
    DB_IS_GENERATED_BUT_VERSION_IS_OLD = 'DB_IS_GENERATED_BUT_VERSION_IS_OLD',
    DB_IS_GENERATED_AND_VERSION_IS_NEED_TO_DOWN = 'DB_IS_GENERATED_AND_VERSION_IS_NEED_TO_DOWN',
    DB_IS_GENERATED_AND_VERSION_LAST = 'DB_IS_GENERATED_AND_VERSION_LAST',
}
enum TRANSACTION_SHOULD {
    COMMIT = 'COMMIT',
    ROLLBACK = 'ROLLBACK'
}

export class MigrationVersionTable extends Model { }
const getMigrationTableClass = (sequelize: Sequelize) => {
    MigrationVersionTable.init({
        name: {
            type: DataTypes.STRING,
            primaryKey: true
        }
    }, { sequelize, tableName: 'MIGRATION_VERSION_TABLE', timestamps: false });
    return MigrationVersionTable;
}

export class MigrationVersion {
    public readonly pureFileName: string;
    constructor(
        public fullFilePath: string,
        public fileName: string,
        public object: MigrationFileObject,
    ) {
        const fileNameParts = fileName.split('.');
        if (fileNameParts.length !== 2) {
            throw new Error(`filename is not valid ${fileName}`)
        }
        this.pureFileName = fileNameParts[0];
        if (this.pureFileName.includes(' ')) {
            throw new Error(`filename is not valid ${fileName}, this has whitespace`)
        }
    }
    toJson() {
        const { fullFilePath, fileName, pureFileName } = this
        return JSON.stringify({
            fullFilePath, fileName, pureFileName
        }, null, 2)
    }
}
type MigrationFileSuffix = '.js' | '.ts' | string;
interface Options {
    migrationFileSuffix?: MigrationFileSuffix;
    eventCallback?: (str: String) => void;
}
export class MigratorEngine {
    static async init(sequelize: Sequelize,
        migrationFolder: string,
        targetMigrationName: string,
        opt: Options = {}
    ) {
        const engine = new MigratorEngine(sequelize, migrationFolder, targetMigrationName, opt);
        await engine.init();
        return engine;
    }
    MigrationVersionTable!: typeof MigrationVersionTable;
    migrations!: MigrationVersion[];
    targetMigration!: MigrationVersion;
    dbState!: DbState;
    queryInterface!: QueryInterface;
    transaction!: Transaction;
    private migrationFileSuffix: MigrationFileSuffix;
    public eventCallback?: (str: String) => void;
    constructor(
        public sequelize: Sequelize,
        public migrationFolder: string,
        public targetMigrationName: string,
        public opt: Options = {}
    ) {
        this.migrationFileSuffix = opt.migrationFileSuffix || '.ts';
        if(opt.eventCallback) {
            this.eventCallback = opt.eventCallback;
        }
    }
    log = (...msg: any[]) => {
        if(!this.eventCallback) {
            return;
        }
        for (const m of msg) {
            this.eventCallback(m);
        }
    }
    async init() {
        this.MigrationVersionTable = getMigrationTableClass(this.sequelize)

        this.transaction = await this.sequelize.transaction({ autocommit: false })
        this.queryInterface = this.sequelize.getQueryInterface()
        try {
            this.log('Transaction BEGIN')
            this.migrations = await this.getMigrationFromFolder();
            const targetMigration = this.migrations.find(m => m.pureFileName === this.targetMigrationName);
            if (!targetMigration) {
                throw new Error(`targetMigrationName is not valid we could not found ${this.targetMigrationName}`)
            }
            this.targetMigration = targetMigration;
            this.dbState = await this.getDbState(this.transaction);
            this.log('DB STATE', this.dbState)
            const transactionResult = await this.start(this.transaction)
            if (transactionResult === TRANSACTION_SHOULD.COMMIT) {
                this.log('Transaction COMMITTING')
                await this.transaction.commit();
                this.log('Transaction COMMITTED')
            } else if (transactionResult === TRANSACTION_SHOULD.ROLLBACK) {
                this.log('Transaction ROLLBACKING')
                await this.transaction.rollback();
                this.log('Transaction ROLLBACKED')
            }

        } catch (error) {
            this.log('Transaction ERROR ROLLBACK', error)
            await this.transaction.rollback();
            throw error;
        } finally {
        }
    }
    async getMigrationFromFolder() {
        const isExist = fs.existsSync(this.migrationFolder);
        if (!isExist) {
            throw new Error(`migration folder not exist`)
        }
        // nestjs kullandığımız için bu folder aslında dist'in içerisini görüyor.
        // burada da map.js .d.ts .ts gibi dosyalar da var o yüzden burada filter yapıyoruz.
        // main-backend/dist/migration/* içerisinde
        const files = fs.readdirSync(this.migrationFolder).filter((name: string) => name.endsWith(this.migrationFileSuffix)).sort();
        this.log('files', files)
        if (files.length === 0) {
            throw new Error(`migration folder is empty`)
        }
        const migrations: MigrationVersion[] = [];
        for (const fileName of files) {
            const filePath = path.join(this.migrationFolder, fileName)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const migrationFileObject: MigrationFileObject = require(filePath);
            if (!migrationFileObject.down) {
                throw new Error(`${filePath} has not exported down function`)
            }
            if (!migrationFileObject.up) {
                throw new Error(`${filePath} has not exported up function`)
            }
            migrations.push(new MigrationVersion(filePath, fileName, migrationFileObject));
        }
        return migrations;
    }
    async createMigrationTableIfNotExist(transaction: Transaction) {
        const queryInterface = this.queryInterface
        const hasTable = await this.hasMigrationTable(transaction)
        if (hasTable) {
            return;
        }

        await queryInterface.createTable(this.MigrationVersionTable.tableName, {
            name: {
                type: DataTypes.STRING,
                primaryKey: true,
            }
        }, { transaction })

    }
    async getDbState(transaction: Transaction): Promise<DbState> {
        // const queryInterface = this.queryInterface;
        const hasMigrationTable = await this.hasMigrationTable(transaction)
        if (typeof hasMigrationTable !== 'boolean') {
            throw new Error('checkDbInitPromise should be a function and it should return Promise<boolean>')
        }
        if (!hasMigrationTable) {
            return DbState.DB_IS_NOT_GENERATED_YET;
        }
        return this.getDbMigrationVersionState();
    }
    public async hasMigrationTable(transaction: Transaction): Promise<boolean> {
        // check MIGRATION_VERSION_TABLE exist
        const MIGRATION_VERSION_TABLE = this.MigrationVersionTable.tableName;
        // const queryInterface = this.queryInterface;
        try {
            await this.MigrationVersionTable.findAll();
            this.log(`${MIGRATION_VERSION_TABLE} table exist`)
            return true;
        } catch (error) {
            this.log(`${MIGRATION_VERSION_TABLE} table NOT exist`)
            return false;
        }
    }
    public async getDbMigrations(): Promise<{ name: string }[]> {
        const transaction = this.transaction;
        return await this.MigrationVersionTable.findAll({ where: {}, transaction })
            .then(arr => arr.map((item) => item.toJSON() as any))
    }
    public async getActiveMigrationInDb(): Promise<MigrationVersion> {
        const migrations = await this.getDbMigrations();
        const dbM = migrations[migrations.length - 1]
        const mm = this.migrations.find(m => m.pureFileName === dbM.name)
        if (mm) {
            return mm;
        }
        throw new Error(`active migration in db not found: ${dbM}`)
    }
    public async getDbMigrationVersionState() {
        const dbMigrations = await this.getDbMigrations();
        if (dbMigrations.length === this.migrations.length) {
            if (dbMigrations.length === 0) {
                throw new Error(`dbMigrations.length 0`)
            }
        }
        const activeStateInDb = await this.getActiveMigrationInDb()
        this.log('targetMigration NAME', this.targetMigration.pureFileName)
        this.log('activeStateInDb NAME', activeStateInDb.pureFileName)
        if (this.targetMigration === activeStateInDb) {
            return DbState.DB_IS_GENERATED_AND_VERSION_LAST;
        }
        if (this.migrations.indexOf(this.targetMigration) < this.migrations.indexOf(activeStateInDb)) {
            return DbState.DB_IS_GENERATED_AND_VERSION_IS_NEED_TO_DOWN;
        }
        return DbState.DB_IS_GENERATED_BUT_VERSION_IS_OLD
    }
    public async setDbMigrationVersion(version: MigrationVersion) {
        const index = this.migrations.indexOf(version);
        if (index === -1) {
            throw new Error(`migration not found`)
        }
        await this.deleteMigrationFromTable()
        for (const migration of this.migrations) {
            await this.insertMigrationToTable(migration);
            if (migration === version) {
                return;
            }
        }
    }
    public async deleteMigrationFromTable() {
        const transaction = this.transaction;
        await this.MigrationVersionTable.destroy({ where: {}, transaction });
    }
    public async insertMigrationToTable(migration: MigrationVersion) {
        const transaction = this.transaction;
        await this.MigrationVersionTable.create({ name: migration.pureFileName }, { transaction });
    }
    public async executeMigration(from: MigrationVersion | null, to: MigrationVersion) {
        const transaction = this.transaction;
        if (from === null) {
            from = this.migrations[0];
        }
        const startIndex = this.migrations.indexOf(from);
        const endIndex = this.migrations.indexOf(to);
        this.log(`executeMigration endIndex: ${endIndex} startIndex: ${startIndex}`)
        if (endIndex > startIndex) {
            this.log('executeMigration UP started')
            for (let i = startIndex; i <= endIndex; i++) {
                const m = this.migrations[i];
                await m.object.up(this.queryInterface, transaction);
            }
            this.log('executeMigration UP end')
        } else if (from === to) {
            await from.object.up(this.queryInterface, transaction);
        } else {
            this.log('executeMigration DOWN started')
            for (let i = endIndex; i <= startIndex; i--) {
                const m = this.migrations[i];
                await m.object.down(this.queryInterface, transaction);
            }
            this.log('executeMigration DOWN end')
        }
    }

    public async executeMigrationUpdate(from: MigrationVersion, to: MigrationVersion) {

        const startIndex = this.migrations.indexOf(from);
        const endIndex = this.migrations.indexOf(to);
        let now = startIndex + 1;
        let next = this.getNextMigrationVersion(from);
        while (endIndex - now >= 0) {
            // this.log('endIndex - now', endIndex - now)
            await next.object.up(this.queryInterface, this.transaction)
            if (endIndex - now === 0) {
                return
            }
            next = this.getNextMigrationVersion(next)
            now++;
        }
    }
    public async executeMigrationDown(from: MigrationVersion, to: MigrationVersion) {

        const fromIndex = this.migrations.indexOf(from);
        const toIndex = this.migrations.indexOf(to);
        for (let index = this.migrations.length - 1; index >= 0; index--) {
            if (index <= fromIndex && index > toIndex) {
                const migration = this.migrations[index];
                await migration.object.down(this.queryInterface, this.transaction)
            }
        }
    }
    public async start(transaction: Transaction): Promise<TRANSACTION_SHOULD> {
        if (this.dbState === DbState.DB_IS_NOT_GENERATED_YET) {
            await this.createMigrationTableIfNotExist(transaction);
            await this.setDbMigrationVersion(this.targetMigration);
            await this.executeMigration(null, this.targetMigration);
            return TRANSACTION_SHOULD.COMMIT;
        }
        if (this.dbState === DbState.DB_IS_GENERATED_AND_VERSION_LAST) {
            return TRANSACTION_SHOULD.ROLLBACK;
        }
        if (this.dbState === DbState.DB_IS_GENERATED_BUT_VERSION_IS_OLD) {
            const activeMigration = await this.getActiveMigrationInDb()
            await this.setDbMigrationVersion(this.targetMigration)
            await this.executeMigrationUpdate(activeMigration, this.targetMigration);
            return TRANSACTION_SHOULD.COMMIT;
        }
        if (this.dbState === DbState.DB_IS_GENERATED_AND_VERSION_IS_NEED_TO_DOWN) {
            const activeMigration = await this.getActiveMigrationInDb()
            await this.setDbMigrationVersion(this.targetMigration)
            await this.executeMigrationDown(activeMigration, this.targetMigration);
            return TRANSACTION_SHOULD.COMMIT;
        }
        throw new Error(`this.dbState not found: ${this.dbState}`)
    }
    public getNextMigrationVersion(migration: MigrationVersion): MigrationVersion {
        const i = this.migrations.indexOf(migration)
        if (i === -1) {
            throw new Error(`migration index is -1 ${migration.toJson()}`)
        }
        const next = this.migrations[i + 1]
        if (!next) {
            throw new Error(`next migration not found i: ${i}`)
        }
        return next;
    }
}