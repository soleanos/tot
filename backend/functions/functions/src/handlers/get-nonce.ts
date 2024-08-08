import * as functions from "firebase-functions/v2";
import {
  corsHandler,
  requestCache,
  MAX_REQUESTS_PER_MINUTE,
} from "../config/config";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {initializeFirebaseAdmin} from "../config/firebaseAdmin";

initializeFirebaseAdmin();

export const getNonce = functions.https.onRequest(
  {
    region: "europe-west1",
  },
  async (req, res) => {
    corsHandler(req, res, async () => {
      logger.info("Request received", {body: req.body});

      const {address} = req.body;

      if (!address) {
        logger.error("Missing address in request body", {body: req.body});
        res.status(400).send("Missing address");
        return;
      }

      const lowerCaseAddress = address.toLowerCase();
      logger.debug("Lower case address generated", {lowerCaseAddress});

      const requestCount = requestCache.get<number>(lowerCaseAddress) || 0;

      if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        logger.warn("Too many requests", {address: lowerCaseAddress});
        res.status(429).send("Too many requests");
        return;
      }

      requestCache.set(lowerCaseAddress, requestCount + 1);
      logger.debug("Request count updated", {
        address: lowerCaseAddress,
        requestCount,
      });

      const nonce = Math.floor(Math.random() * 1000000).toString();
      const nonceDoc = admin
        .firestore()
        .collection("nonces")
        .doc(lowerCaseAddress);

      logger.debug("Nonce document reference created", {
        nonceDocPath: nonceDoc.path,
      });

      try {
        logger.debug("Attempting to set document in Firestore", {
          nonceDocPath: nonceDoc.path,
          nonce,
        });

        await nonceDoc.set({
          nonce,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          address: lowerCaseAddress,
        });

        logger.debug("Successfully set document in Firestore", {
          nonceDocPath: nonceDoc.path,
          nonce,
        });

        res.json({nonce});
      } catch (error) {
        logger.error("Error setting nonce document", {
          error,
          address: lowerCaseAddress,
        });
        res.status(500).send("Internal server error");
      }
    });
  },
);
