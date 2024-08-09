import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import Web3Library from "web3";
import {
  corsHandler,
  requestCache,
  MAX_REQUESTS_PER_MINUTE,
} from "../config/config";

// Initialisez Firebase Admin avec les credentials explicites
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  logger.info("Firebase Admin initialized.");
} else {
  logger.info("Firebase Admin already initialized.");
}

const web3 = new Web3Library();

/**
 * Cloud Function pour authentifier un
 * utilisateur en utilisant MetaMask.
 * La fonction vérifie le nonce et la signature,
 * et génère un jeton personnalisé.
 */
export const authenticateMetaMask = functions.https.onRequest(
  {
    region: "europe-west1",
  },
  (req, res): void => {
    // Gérer les requêtes OPTIONS pour CORS
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST");
      res.set("Access-Control-Allow-Headers", "Content-Type, x-nonce");
      res.set("Access-Control-Max-Age", "3600");
      res.status(204).send("");
      return;
    }

    corsHandler(req, res, async () => {
      const {address, signature, message} = req.body;
      const nonce = req.headers["x-nonce"]; // Lire le nonce depuis l'en-tête

      logger.info("Corps de la requête reçu", {body: req.body});

      if (!address || !signature || !message || !nonce) {
        logger.error(
          "Adresse, signature, message ou nonce manquant dans la requête",
          {body: req.body, headers: req.headers},
        );
        res.status(400).send("Adresse, signature, message ou nonce manquant");
        return;
      }

      // Limitation des requêtes par adresse
      const lowerCaseAddress = address.toLowerCase();
      const requestCount = requestCache.get<number>(lowerCaseAddress) || 0;

      if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        logger.warn("Trop de requêtes", {
          address: lowerCaseAddress,
          requestCount,
        });
        res.status(429).send("Trop de requêtes - veuillez réessayer plus tard");
        return;
      }

      // Mettre à jour le compteur de requêtes pour l'adresse
      requestCache.set(lowerCaseAddress, requestCount + 1);

      try {
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

        const {nonce: cachedNonce, createdAt} = nonceData as {
          nonce: string;
          createdAt: admin.firestore.Timestamp;
        };
        logger.debug("Données du nonce extraites", {cachedNonce, createdAt});

        const createdAtDate = createdAt.toDate();
        logger.debug("Date de création convertie", {createdAtDate});

        const currentTime = new Date();
        logger.debug("Heure actuelle", {currentTime});

        const expirationTime = new Date(createdAtDate.getTime() + 60 * 1000);
        logger.debug("Heure d'expiration", {expirationTime});

        if (currentTime > expirationTime) {
          logger.warn("Nonce expiré", {
            address: lowerCaseAddress,
            nonce: cachedNonce,
            currentTime,
            expirationTime,
          });
          res.status(400).send("Nonce expiré");
          await nonceDoc.delete();
          return;
        }

        logger.debug("Nonce validé avec succès", {cachedNonce, nonce});

        if (nonce !== cachedNonce) {
          logger.warn("Nonce invalide", {
            cachedNonce,
            receivedNonce: nonce,
          });
          res.status(400).send("Nonce invalide");
          return;
        }

        logger.debug(
          "Début de la récupération de l'adresse à partir de la signature",
        );

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

        // Créer le jeton personnalisé
        const customToken = await admin
          .auth()
          .createCustomToken(lowerCaseAddress);
        logger.info("Jeton personnalisé créé avec succès", {address});

        // Vérifiez si l'utilisateur a déjà un document dans Firestore
        const usersCollectionRef = admin.firestore().collection("users");
        const userDocRef = usersCollectionRef.doc(lowerCaseAddress);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          logger.info(
            "Création d'un nouveau document utilisateur dans Firestore.",
          );
          const username = `coin${Math.floor(1000 + Math.random() * 9000)}`;

          logger.info(`Generated username for MetaMask user: ${username}`);

          // Ajouter un utilisateur bidon si la collection n'existe pas
          if ((await usersCollectionRef.get()).empty) {
            logger.info(
              "La collection 'users' n'existe pas, " +
                "création avec un utilisateur bidon.",
            );
            await usersCollectionRef.doc("dummy_user").set({
              username: "dummy_user",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              provider: "system",
            });
          }

          await userDocRef.set({
            username: username,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            provider: "MetaMask",
          });
          logger.info(`Document utilisateur créé pour UID=${lowerCaseAddress}`);
        } else {
          logger.info(
            `Le document utilisateur existe déjà pour UID=${lowerCaseAddress}`,
          );
        }

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
          "Erreur lors de la vérification de la signature " +
            "ou de la génération du jeton personnalisé",
          {error: errorMessage},
        );
        res.status(500).send("Erreur interne du serveur");
      }
    });
  },
);
