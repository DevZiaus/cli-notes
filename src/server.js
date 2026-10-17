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

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use.`);
            const alternative = port >= 65535 ? 5000 : port + 1;
            console.error(`Try a different one, e.g.  note web ${alternative}`);
        } else if (error.code === 'EACCES') {
            console.error(`No permission to use port ${port}.`);
            console.error('Try a port above 1024, e.g.  note web 5000');
        } else {
            console.error(`Could not start the web viewer: ${error.message}`);
        }

        process.exit(1);
    });

    server.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`Serving your notes at ${url}`);
        console.log('Press Ctrl+C to stop the server.');

        open(url).catch(() => {
            console.warn('Could not open your browser automatically.');
            console.log(`Open ${url} manually to view your notes.`);
        });
    });
};
