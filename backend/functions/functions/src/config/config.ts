import NodeCache from "node-cache";
import cors from "cors";

// Déclaration globale du cache
export const requestCache = new NodeCache({stdTTL: 60, checkperiod: 120});
export const MAX_REQUESTS_PER_MINUTE = 5;

// Options CORS
const allowedOrigins = ["http://localhost:4200"];
export const corsOptions = {
  origin: function(
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST"],
  allowedHeaders: ["Content-Type"],
};

// Gestionnaire CORS
export const corsHandler = cors(corsOptions);
