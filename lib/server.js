import http from 'node:http';
import config from '../config.js';
import { utils } from './utils.js';
import { file } from './file.js';

import { PageHome } from '../pages/home.js';
import { Page404 } from '../pages/404.js';
import { PageAbout } from '../pages/about.js';
import { PageServices } from '../pages/services.js';
import { PageContact } from '../pages/contact.js';

const server = {};

server.httpServer = http.createServer((req, res) => {
    const ssl = req.socket.encryption ? 's' : '';
    const baseURL = `http${ssl}://${req.headers.host}`;
    const parsedURL = new URL(req.url, baseURL);
    const trimmedPath = parsedURL.pathname
        .replace(/^\/+|\/+$/g, '')
        .replace(/\/\/+/g, '/');

    const extension = utils.fileExtension(trimmedPath);

    const textFileExtensions = ['css', 'js', 'txt', 'svg', 'xml', 'webmanifest', 'md', 'markdown'];
    const textBinaryExtensions = ['jpg', 'png', 'ico', 'webp', 'mp3', 'woff2', 'woff', 'ttf'];

    const isTextFile = textFileExtensions.includes(extension);
    const isBinaryFile = textBinaryExtensions.includes(extension);
    const isAPI = trimmedPath.startsWith('api/');
    const isPage = !isTextFile && !isBinaryFile && !isAPI;

    req.on('data', () => {
        console.log('gaunami duomenys...');
    })

    req.on('end', async () => {
        if (isTextFile) {
            const [err, content] = await file.readPublic(trimmedPath);
            if (err) {
                res.writeHead(404);
                return res.end('Sorry, tokiu failo nera...');
            } else {
                res.writeHead(200, {
                    // 'Content-Type': '',
                    'cache-control': `max-age=${config.cache}`,
                    // 'Set-Cookie': 'user_session_id=5regr4g5f2re5; path=/; max-age=60; HttpOnly; SameSite=Strict',
                });
                return res.end(content);
            }
        }

        if (isBinaryFile) {
            const [err, content] = await file.readPublicBinary(trimmedPath);
            if (err) {
                res.writeHead(404);
                return res.end('Sorry, tokiu failo nera...');
            } else {
                res.writeHead(200, {
                    'cache-control': `max-age=${config.cache}`,
                });
                return res.end(content);
            }
        }

        if (isAPI) {
            // ar turiu norima API
            // jeigu turiu -> dirba
            // jeigu NEturiu -> klaida
            return res.end('STAI TAU API ATSAKYMAS...');
        }

        if (isPage) {
            let PageClass = server.routes[404];
            if (trimmedPath in server.routes) {
                PageClass = server.routes[trimmedPath];
            }

            const page = new PageClass();
            return res.end(page.render());
        }
    })
});

server.routes = {
    '': PageHome,
    'about': PageAbout,
    'services': PageServices,
    'contact': PageContact,
    '404': Page404,
};

server.init = () => {
    const { port } = config;
    server.httpServer.listen(port, () => {
        console.log(`Projekto nuoroda: http://localhost:${port}/`);
    });
};

export { server }