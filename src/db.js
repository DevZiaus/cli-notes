import fs from 'node:fs/promises';

const DB_PATH = new URL('../db.json', import.meta.url).pathname;

export const getDB = async () => {
    let contents;

    try {
        contents = await fs.readFile(DB_PATH, 'utf-8');
    } catch (error) {
        // Create a fresh database if this is the first run
        if (error.code === 'ENOENT') {
            return { notes: [] };
        }

        throw new Error(
            `Could not read the notes database (db.json): ${error.message}`,
            { cause: error },
        );
    }

    try {
        return JSON.parse(contents);
    } catch (error) {
        throw new Error(
            'The notes database (db.json) is corrupted (it contains invalid ' +
                'JSON). Fix the file by hand, or delete it to start fresh ' +
                '(this removes all notes).',
            { cause: error },
        );
    }
};

export const saveDB = async (db) => {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
        return db;
    } catch (error) {
        throw new Error(
            `Could not save your notes to db.json: ${error.message}`,
            { cause: error },
        );
    }
};

export const insert = async (data) => {
    const db = await getDB();
    db.notes.push(data);
    await saveDB(db);
    return data;
};
