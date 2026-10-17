import fs from 'node:fs/promises';
import http from 'node:http';
import open from 'open';

const interpolate = (html, data) => {
    return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, placeholder) => {
        return data[placeholder] || '';
    });
};

const escapeHtml = (text) =>
    String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatNotes = (notes) => {
    if (notes.length === 0) {
        return `
      <div class="empty">
        <p class="empty-title">No notes yet</p>
        <p class="empty-hint">Create your first one with <code>note new "My first note"</code></p>
      </div>
    `;
    }

    return notes
        .map((note) => {
            const tags = (note.tags || [])
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
                .join('');

            const date = formatDate(note.id);

            return `
      <article class="note">
        <p class="note-content">${escapeHtml(note.content)}</p>
        <div class="note-meta">
          <div class="tags">${tags}</div>
          ${date ? `<time class="note-date">${date}</time>` : ''}
        </div>
      </article>
    `;
        })
        .join('\n');
};

const createServer = (notes) => {
    return http.createServer(async (req, res) => {
        const HTML_PATH = new URL('./template.html', import.meta.url).pathname;
        const template = await fs.readFile(HTML_PATH, 'utf-8');
        const html = interpolate(template, {
            notes: formatNotes(notes),
            count: `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`,
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    });
};

export const start = (notes, port) => {
    const server = createServer(notes);
    server.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
    open(`http://localhost:${port}`);
};
