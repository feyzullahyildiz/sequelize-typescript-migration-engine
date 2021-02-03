import { Sequelize, Model, DataTypes } from 'sequelize';


export const getInitialEntities = () => {
    const sequelize = new Sequelize({
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
        dialect: 'postgres',
        logging: false,
    });


    class Project extends Model { }
    Project.init({
        name: DataTypes.STRING
    }, { sequelize, tableName: 'project' });

    return {
        sequelize,
        Project,
    }
}