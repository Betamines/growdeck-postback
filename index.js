const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

const FIREBASE_DB_URL = "https://cash-jitau-default-rtdb.firebaseio.com/users";
const POSTBACK_SECRET = "e4574240c62e6c2db436ca744c949e";

// Home route
app.get('/', (req, res) => {
    res.send("Server running 🚀");
});

// Postback route
app.get('/postback', async (req, res) => {
    try {
        console.log("Incoming:", req.query);

        const { user_id, reward, signature } = req.query;

        if (!user_id || !reward) {
            return res.status(400).send("Missing params");
        }

        if (signature !== POSTBACK_SECRET) {
            return res.status(401).send("Unauthorized");
        }

        const rewardAmount = parseFloat(reward) || 0;

        const getUser = await fetch(`${FIREBASE_DB_URL}/${user_id}.json`);
        const userData = await getUser.json();

        let currentCoins = 0;
        if (userData) {
            currentCoins = Number(userData.coins || userData.balance || 0);
        }

        const newCoins = currentCoins + rewardAmount;

        const update = await fetch(`${FIREBASE_DB_URL}/${user_id}.json`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coins: newCoins,
                balance: newCoins
            })
        });

        if (!update.ok) {
            throw new Error("Firebase update failed");
        }

        console.log(`Updated: ${user_id} → ${newCoins}`);

        res.status(200).send("OK");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
