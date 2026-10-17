import fs from 'node:fs/promises';

const DB_PATH = new URL('../db.json', import.meta.url).pathname;

export const getDB = async () => {
    try {
        const db = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(db);
    } catch (error) {
        // Create a fresh database if this is the first run
        if (error.code === 'ENOENT') {
            return { notes: [] };
        }
        throw error;
    }
};

export const saveDB = async (db) => {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    return db;
};

export const insert = async (data) => {
    const db = await getDB();
    db.notes.push(data);
    await saveDB(db);
    return data;
};
