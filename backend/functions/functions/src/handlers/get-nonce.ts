import * as functions from "firebase-functions";
import {
  corsHandler,
  requestCache,
  nonceCache,
  MAX_REQUESTS_PER_MINUTE,
} from "../config/config"; // Import des configurations partagées
import * as logger from "firebase-functions/logger";

export const getNonce = functions
  .region("europe-west1")
  .https.onRequest((req, res) => {
    corsHandler(req, res, () => {
      const {address} = req.body;

      if (!address) {
        logger.error("Missing address in request body", {body: req.body});
        res.status(400).send("Missing address");
        return;
      }

      const lowerCaseAddress = address.toLowerCase();
      const requestCount = requestCache.get<number>(lowerCaseAddress) || 0;

      if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        logger.warn("Too many requests", {address: lowerCaseAddress});
        res.status(429).send("Too many requests");
        return;
      }

      requestCache.set(lowerCaseAddress, requestCount + 1);

      const nonce = Math.floor(Math.random() * 1000000).toString();
      nonceCache.set(lowerCaseAddress, nonce); // Stocke le nonce dans le cache
      logger.debug("Generated and stored nonce", {
        address: lowerCaseAddress,
        nonce,
      });

      res.json({nonce});
    });
  });
