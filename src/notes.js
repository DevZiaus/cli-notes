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

export const updateNote = async (id, updates) => {
    const notes = await getAllNotes();
    const match = notes.find((note) => note.id === id);

    if (!match) {
        return false;
    }

    const updated = {
        ...match,
        content: updates.content,
        tags: updates.tags,
    };

    await saveDB({
        notes: notes.map((note) => (note.id === id ? updated : note)),
    });
    return updated;
};

export const removeNote = async (id) => {
    const notes = await getAllNotes();
    const match = notes.find((note) => note.id === id);

    if (!match) {
        return false;
    }

    const newNotes = notes.filter((note) => note.id !== id);
    await saveDB({ notes: newNotes });
    return true;
};

export const removeAllNotes = async () => {
    const { notes } = await getDB();
    await saveDB({ notes: [] });
    return notes.length;
};
