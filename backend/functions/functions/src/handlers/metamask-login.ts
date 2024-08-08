import * as functions from "firebase-functions/v2";
import {corsHandler} from "../config/config";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Web3Library from "web3";

// Initialisez Firebase Admin avec les credentials explicites
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const web3 = new Web3Library();

/**
 * Cloud Function pour authentifier
 * un utilisateur en utilisant MetaMask.
 * La fonction vérifie le nonce
 * et la signature, et génère un jeton personnalisé.
 */
export const authenticateMetaMask = functions.https.onRequest(
  {
    region: "europe-west1",
  },
  (req, res): void => {
    corsHandler(req, res, async () => {
      const {address, signature, message} = req.body;
      logger.info("Corps de la requête reçu", {body: req.body});

      if (!address || !signature || !message) {
        logger.error(
          "Adresse, signature ou message manquant dans le corps de la requête",
          {body: req.body},
        );
        res.status(400).send("Adresse, signature ou message manquant");
        return;
      }

      try {
        const lowerCaseAddress = address.toLowerCase();
        logger.debug("Adresse en minuscules", {lowerCaseAddress});

        const nonceDoc = admin
          .firestore()
          .collection("nonces")
          .doc(lowerCaseAddress);
        logger.debug("Référence du document nonce", {nonceDoc});

        const nonceSnapshot = await nonceDoc.get();
        logger.debug("Snapshot du document nonce récupéré", {
          exists: nonceSnapshot.exists,
        });

        if (!nonceSnapshot.exists) {
          logger.warn("Nonce non trouvé", {address: lowerCaseAddress});
          res.status(400).send("Nonce non trouvé");
          return;
        }

        const nonceData = nonceSnapshot.data();
        logger.debug("Données du nonce", {nonceData});

        if (!nonceData) {
          logger.warn("Données du nonce introuvables", {
            address: lowerCaseAddress,
          });
          res.status(400).send("Données du nonce introuvables");
          return;
        }

        const {nonce, createdAt} = nonceData as {
          nonce: string;
          createdAt: admin.firestore.Timestamp;
        };
        logger.debug("Données du nonce extraites", {nonce, createdAt});

        const createdAtDate = createdAt.toDate();
        logger.debug("Date de création convertie", {createdAtDate});

        const currentTime = new Date();
        logger.debug("Heure actuelle", {currentTime});

        const expirationTime = new Date(createdAtDate.getTime() + 60 * 1000);
        logger.debug("Heure d'expiration", {expirationTime});

        if (currentTime > expirationTime) {
          logger.warn("Nonce expiré", {
            address: lowerCaseAddress,
            nonce,
            currentTime,
            expirationTime,
          });
          res.status(400).send("Nonce expiré");
          await nonceDoc.delete();
          return;
        }

        if (message !== nonce) {
          logger.warn("Nonce invalide", {
            cachedNonce: nonce,
            receivedNonce: message,
          });
          res.status(400).send("Nonce invalide");
          return;
        }

        const recoveredAddress = web3.eth.accounts.recover(message, signature);
        logger.debug("Adresse récupérée à partir de la signature", {
          recoveredAddress,
          address,
        });

        if (recoveredAddress.toLowerCase() !== lowerCaseAddress) {
          logger.warn("Signature invalide", {recoveredAddress, address});
          res.status(400).send("Signature invalide");
          return;
        }

        await nonceDoc.delete();
        logger.debug("Nonce vérifié et supprimé de Firestore avec succès", {
          address: lowerCaseAddress,
        });

        const customToken = await admin
          .auth()
          .createCustomToken(lowerCaseAddress);
        logger.info("Jeton personnalisé créé avec succès", {address});
        res.json({customToken});
      } catch (error: unknown) {
        let errorMessage = "Erreur inconnue";
        if (error instanceof Error) {
          errorMessage = error.message;
          logger.error("Stack trace", {stack: error.stack});
        } else {
          logger.error("Erreur non typée", {error});
        }

        logger.error(
          "Erreur lors de la vérification de la" +
            " signature ou de la génération du jeton personnalisé",
          {error: errorMessage},
        );
        res.status(500).send("Erreur interne du serveur");
      }
    });
  },
);
