import fs from 'node:fs/promises';
import http from 'node:http';
import open from 'open';

import { getAllNotes, newNote, removeNote, updateNote } from './notes.js';

const HTML_PATH = new URL('./template.html', import.meta.url).pathname;

const sendJson = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const httpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const readJsonBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        let tooLarge = false;

        req.on('data', (chunk) => {
            if (tooLarge) {
                return;
            }

            body += chunk;

            if (body.length > 100_000) {
                tooLarge = true;
                body = '';
            }
        });

        req.on('end', () => {
            if (tooLarge) {
                reject(httpError(413, 'the request body is too large'));
                return;
            }

            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch {
                reject(
                    httpError(400, 'the request body is not valid JSON'),
                );
            }
        });

        req.on('error', reject);
    });
};

const parseNotePayload = (body) => {
    const data = body && typeof body === 'object' ? body : {};
    const content =
        typeof data.content === 'string' ? data.content.trim() : '';

    if (!content) {
        return { error: 'note content is required' };
    }

    const tags = Array.isArray(data.tags)
        ? data.tags
              .filter((tag) => typeof tag === 'string')
              .map((tag) => tag.trim())
              .filter(Boolean)
        : [];

    return { note: { content, tags } };
};

const handleNotesApi = async (req, res, id) => {
    if (id === null && req.method === 'GET') {
        return sendJson(res, 200, await getAllNotes());
    }

    if (id === null && req.method === 'POST') {
        const payload = parseNotePayload(await readJsonBody(req));

        if (payload.error) {
            return sendJson(res, 400, payload);
        }

        const note = await newNote(payload.note.content, payload.note.tags);
        return sendJson(res, 201, note);
    }

    if (id !== null && req.method === 'PUT') {
        const payload = parseNotePayload(await readJsonBody(req));

        if (payload.error) {
            return sendJson(res, 400, payload);
        }

        const note = await updateNote(id, payload.note);

        if (!note) {
            return sendJson(res, 404, { error: `no note with id ${id}` });
        }

        return sendJson(res, 200, note);
    }

    if (id !== null && req.method === 'DELETE') {
        const removed = await removeNote(id);

        if (!removed) {
            return sendJson(res, 404, { error: `no note with id ${id}` });
        }

        res.writeHead(204);
        return res.end();
    }

    return sendJson(res, 405, {
        error: `${req.method} is not allowed on this endpoint`,
    });
};

const handleRequest = async (req, res) => {
    const { pathname } = new URL(
        req.url,
        `http://${req.headers.host ?? 'localhost'}`,
    );

    if (req.method === 'GET' && pathname === '/') {
        const template = await fs.readFile(HTML_PATH, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(template);
        return;
    }

    const notesApiMatch = pathname.match(/^\/api\/notes(?:\/(\d+))?$/);

    if (notesApiMatch) {
        const id = notesApiMatch[1] ? Number(notesApiMatch[1]) : null;
        await handleNotesApi(req, res, id);
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
};

const createServer = () => {
    return http.createServer(async (req, res) => {
        try {
            await handleRequest(req, res);
        } catch (error) {
            console.error(`Request failed: ${error.message}`);

            if (!res.headersSent) {
                sendJson(res, error.status ?? 500, {
                    error: error.message,
                });
            } else {
                res.end();
            }
        }
    });
};

export const start = (port) => {
    const server = createServer();

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
