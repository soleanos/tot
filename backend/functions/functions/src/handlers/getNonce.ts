import * as functions from "firebase-functions";
import NodeCache from "node-cache";

const requestCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });  // Cache avec TTL de 60 secondes
const MAX_REQUESTS_PER_MINUTE = 5;  // Limite de requêtes par minute

export const getNonce = functions.region('europe-west1').https.onRequest((req, res) => {
    const { address } = req.body;
    if (!address) {
        res.status(400).send("Missing address");
        return;
    }

    const lowerCaseAddress = address.toLowerCase();
    const requestCount = requestCache.get(lowerCaseAddress) || 0;

    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        res.status(429).send("Too many requests");
        return;
    }

    requestCache.set(lowerCaseAddress, requestCount + 1);

    const nonce = Math.floor(Math.random() * 1000000).toString();
    res.json({ nonce });
});
