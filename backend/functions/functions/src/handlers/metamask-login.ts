import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Web3 from "web3";

admin.initializeApp();

const web3 = new Web3();

export const authenticateMetaMask = functions.region('europe-west1').https.onRequest(
  async (req, res): Promise<void> => {
    const {address, signature, message} = req.body;
    logger.info("Received request for MetaMask authentication", {address});

    if (!address || !signature || !message) {
      logger.error("Missing address, signature, or message in request body");
      res.status(400).send("Missing address, signature, or message");
      return;
    }

    try {
      const recoveredAddress = web3.eth.accounts.recover(message, signature);
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        logger.warn("Invalid signature", {recoveredAddress, address});
        res.status(400).send("Invalid signature");
        return;
      }

      const customToken = await admin.auth().createCustomToken(address);
      logger.info("Custom token created successfully", {address});
      res.json({customToken});
    } catch (error) {
      logger.error("Error verifying signature or generating custom token", {
        error,
      });
      res.status(500).send("Internal server error");
    }
  },
);
