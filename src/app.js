const els = {
    count: document.querySelector('#count'),
    status: document.querySelector('#status'),
    form: document.querySelector('#note-form'),
    search: document.querySelector('#search'),
    notes: document.querySelector('#notes'),
};

let notes = [];
let editingId = null;
let statusTimer = null;
let query = '';

const request = async (url, options) => {
    const response = await fetch(url, options);

    if (!response.ok) {
        let message = `the request failed (${response.status})`;

        try {
            message = (await response.json()).error ?? message;
        } catch {
            // keep the generic message
        }

        throw new Error(message);
    }

    return response.status === 204 ? null : response.json();
};

const api = {
    list: () => request('/api/notes'),
    create: (note) =>
        request('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note),
        }),
    update: (id, note) =>
        request(`/api/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note),
        }),
    remove: (id) => request(`/api/notes/${id}`, { method: 'DELETE' }),
};

const el = (tag, className, text) => {
    const node = document.createElement(tag);

    if (className) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }

    return node;
};

const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

const splitTags = (value) =>
    value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

const matchesQuery = (note) => {
    if (!query) {
        return true;
    }

    const needle = query.toLowerCase();

    return (
        note.content.toLowerCase().includes(needle) ||
        note.tags.some((tag) => tag.toLowerCase().includes(needle))
    );
};

const showStatus = (message, type = 'error') => {
    els.status.textContent = message;
    els.status.className = `status ${type}`;

    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        els.status.textContent = '';
        els.status.className = 'status';
    }, 4000);
};

const noteCard = (note) => {
    const card = el('article', 'note');

    if (editingId === note.id) {
        const form = el('form', 'edit-form');
        const content = el('textarea', 'input');
        content.name = 'content';
        content.required = true;
        content.rows = 3;
        content.value = note.content;
        const tags = el('input', 'input');
        tags.name = 'tags';
        tags.placeholder = 'tags, comma, separated';
        tags.value = note.tags.join(', ');
        const actions = el('div', 'note-actions');
        const save = el('button', 'btn btn-primary', 'Save');
        save.type = 'submit';
        const cancel = el('button', 'btn', 'Cancel');
        cancel.type = 'button';

        cancel.addEventListener('click', () => {
            editingId = null;
            render();
        });

        form.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                editingId = null;
                render();
            }
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            save.disabled = true;

            try {
                const updated = await api.update(note.id, {
                    content: content.value.trim(),
                    tags: splitTags(tags.value),
                });

                notes = notes.map((item) =>
                    item.id === note.id ? updated : item,
                );
                editingId = null;
                render();
                showStatus('Note saved.', 'success');
            } catch (error) {
                save.disabled = false;
                showStatus(error.message);
            }
        });

        actions.append(save, cancel);
        form.append(content, tags, actions);
        card.append(form);

        requestAnimationFrame(() => content.focus());
        return card;
    }

    card.append(el('p', 'note-content', note.content));

    const meta = el('div', 'note-meta');
    const tagWrap = el('div', 'tags');
    note.tags.forEach((tag) => tagWrap.append(el('span', 'tag', tag)));
    meta.append(tagWrap, el('time', 'note-date', formatDate(note.id)));
    card.append(meta);

    const actions = el('div', 'note-actions');
    const edit = el('button', 'btn', 'Edit');
    edit.type = 'button';
    const remove = el('button', 'btn btn-danger', 'Delete');
    remove.type = 'button';

    edit.addEventListener('click', () => {
        editingId = note.id;
        render();
    });

    remove.addEventListener('click', async () => {
        if (!window.confirm('Delete this note?')) {
            return;
        }

        remove.disabled = true;

        try {
            await api.remove(note.id);
            notes = notes.filter((item) => item.id !== note.id);
            render();
            showStatus('Note deleted.', 'success');
        } catch (error) {
            remove.disabled = false;
            showStatus(error.message);
        }
    });

    actions.append(edit, remove);
    card.append(actions);

    return card;
};

const render = () => {
    const visible = notes.filter(matchesQuery);
    const noteWord = notes.length === 1 ? 'note' : 'notes';

    els.count.textContent = query
        ? `${visible.length} of ${notes.length} ${noteWord}`
        : `${notes.length} ${noteWord}`;

    if (notes.length === 0) {
        const empty = el('div', 'empty');
        empty.append(
            el('p', 'empty-title', 'No notes yet'),
            el('p', 'empty-hint', 'Write your first note in the box above.'),
        );
        els.notes.replaceChildren(empty);
        return;
    }

    if (visible.length === 0) {
        const empty = el('div', 'empty');
        empty.append(
            el('p', 'empty-title', `No notes match "${query}"`),
            el('p', 'empty-hint', 'Try a different search term.'),
        );
        els.notes.replaceChildren(empty);
        return;
    }

    els.notes.replaceChildren(...visible.map(noteCard));
};

els.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const contentInput = els.form.elements.content;
    const content = contentInput.value.trim();

    if (!content) {
        showStatus('A note needs some content.');
        contentInput.focus();
        return;
    }

    const submit = els.form.querySelector('button[type="submit"]');
    submit.disabled = true;

    try {
        const note = await api.create({
            content,
            tags: splitTags(els.form.elements.tags.value),
        });

        notes.unshift(note);
        els.form.reset();
        render();
        showStatus('Note added.', 'success');
        contentInput.focus();
    } catch (error) {
        showStatus(error.message);
    } finally {
        submit.disabled = false;
    }
});

els.search.addEventListener('input', () => {
    query = els.search.value.trim();
    render();
});

els.search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        els.search.value = '';
        query = '';
        render();
    }
});

const load = async () => {
    try {
        notes = await api.list();
        notes.sort((a, b) => b.id - a.id);
        render();
    } catch (error) {
        showStatus(error.message);
    }
};

load();
