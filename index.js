const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 Firebase DB
const FIREBASE_DB_URL = "https://cash-jitau-default-rtdb.firebaseio.com/users";

// 🔐 Growdeck secret (तिमीले dashboard मा राखेको)
const POSTBACK_SECRET = "e4574240c62e6c2db436ca744c949e";

// ✅ Home route (test)
app.get('/', (req, res) => {
    res.send("Server running 🚀");
});

// 🔐 Signature generator
function generateSignature(user_id, reward) {
    return crypto
        .createHash('sha256')
        .update(user_id + reward + POSTBACK_SECRET)
        .digest('hex');
}

// 🎯 Postback route
app.get('/postback', async (req, res) => {
    try {
        console.log("Incoming:", req.query);

        const { user_id, reward, signature, transaction_id } = req.query;

        // ❌ Missing params
        if (!user_id || !reward || !signature) {
            return res.status(400).send("Missing parameters");
        }

        // 🔐 Verify signature
        const expectedSignature = generateSignature(user_id, reward);

        if (signature !== expectedSignature) {
            console.log("❌ Invalid signature");
            return res.status(401).send("Unauthorized");
        }

        const rewardAmount = parseFloat(reward) || 0;

        // 🔽 Firebase user fetch
        const userRes = await fetch(`${FIREBASE_DB_URL}/${user_id}.json`);
        const userData = await userRes.json();

        let currentCoins = 0;

        if (userData) {
            currentCoins = Number(userData.coins || userData.balance || 0);
        }

        // 💰 New balance
        const newCoins = currentCoins + rewardAmount;

        // 🔄 Update Firebase
        const updateRes = await fetch(`${FIREBASE_DB_URL}/${user_id}.json`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coins: newCoins,
                balance: newCoins,
                last_transaction: transaction_id || null
            })
        });

        if (!updateRes.ok) {
            throw new Error("Firebase update failed");
        }

        console.log(`✅ User ${user_id} → ${newCoins}`);

        return res.status(200).send("OK");

    } catch (error) {
        console.error("🔥 ERROR:", error);
        return res.status(500).send("Server Error");
    }
});

// 🚀 Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
