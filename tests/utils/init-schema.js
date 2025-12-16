const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('./db-setup');

const initSchema = async () => {
    const db = getPool();
    const initSqlPath = path.join(__dirname, '../../database/init.sql');

    try {
        console.log('Reading init.sql...');
        const initSql = fs.readFileSync(initSqlPath, 'utf8');

        console.log('Executing schema initialization...');
        await db.query(initSql);

        console.log('Database schema initialized successfully.');
    } catch (error) {
        console.error('Error initializing database schema:', error);
        process.exit(1);
    } finally {
        await closePool();
    }
};

if (require.main === module) {
    initSchema();
}

module.exports = { initSchema };
