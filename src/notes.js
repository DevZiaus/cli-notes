import { insert, getDB, saveDB } from './db.js';

export const newNote = async (note, tags) => {
    const data = {
        tags,
        content: note,
        id: Date.now(),
    };
    await insert(data);
    return data;
};
export const getAllNotes = async () => {
    const db = await getDB();
    return db.notes;
};

export const findNotes = async (filter) => {
    const notes = await getAllNotes();
    const query = filter.toLowerCase();
    return notes.filter(
        (note) =>
            note.content.toLowerCase().includes(query) ||
            (note.tags || []).some((tag) => tag.toLowerCase().includes(query)),
    );
};

export const removeNote = async (id) => {
    const notes = await getAllNotes();
    const match = notes.find((note) => note.id === id);

    if (match) {
        const newNotes = notes.filter((note) => note.id !== id);
        await saveDB({ notes: newNotes });
        return id;
    }
};

export const removeAllNotes = async () => {
    await saveDB({ notes: [] });
};
