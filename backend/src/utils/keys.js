// backend/utils/keys.js
import crypto from "crypto";

let keyPair = null;

export function getKeyPair() {
  if (!keyPair) {
    keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",   // works with WebCrypto importKey("spki")
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });
  }
  return keyPair;
}
