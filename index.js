const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// १. तपाईंको नयाँ Firebase Realtime Database URL
const FIREBASE_DB_URL = "https://cash-jitau-default-rtdb.firebaseio.com/users";

// २. तपाईंको नयाँ पोस्टब्याक सिक्रेट कि
const POSTBACK_SECRET = "e4574240c62e6c2db436ca744c949e";

app.get('/postback', async (req, res) => {
    // लिङ्कबाट आउने विवरणहरू (user_id, reward र सुरक्षाको लागि secret)
    const { user_id, reward, secret } = req.query;

    // सबै आवश्यक विवरणहरू आएका छन् कि छैनन् चेक गर्ने
    if (!user_id || !reward) {
        return res.status(400).send("विवरण अपूर्ण छ (Missing user_id or reward)");
    }

    // सिक्रेट कि म्याच गराउने सुरक्षा जाँच
    // (यदि अफरवालले 'secret' को सट्टा अर्कै नाम प्रयोग गरेको छ भने 'secret' लाई परिवर्तन गर्नुहोला)
    if (secret !== POSTBACK_SECRET) {
        console.log(`सुरक्षा चेतावनी: गलत सिक्रेट कि प्रयोग भयो!`);
        return res.status(401).send("Unauthorized Request");
    }

    try {
        // क) Firebase बाट यो युजरको डेटा तान्ने
        const getUserResponse = await fetch(`${FIREBASE_DB_URL}/${user_id}.json`);
        const userData = await getUserResponse.json();
        
        let currentCoins = 0;
        if (userData) {
            currentCoins = Number(userData.coins || userData.balance || 0);
        }

        // ख) पुरानो कोइनमा नयाँ रिवार्ड थप्ने
        const newCoins = currentCoins + Number(reward);

        // ग) Firebase मा डेटा अपडेट (PATCH) गर्ने
        await fetch(`${FIREBASE_DB_URL}/${user_id}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                coins: newCoins,
                balance: newCoins
            })
        });

        console.log(`सफलतापूर्वक युजर ${user_id} को नयाँ ब्यालेन्स ${newCoins} भयो।`);
        return res.status(200).send("OK");

    } catch (error) {
        console.error("Firebase Error:", error);
        return res.status(500).send("Database Error");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
