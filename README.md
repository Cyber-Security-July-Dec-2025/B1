# Secure File Vault

> A web-based system to store files in a confidential and integrity-protected way. All cryptographic operations (encryption, decryption, hashing) are executed on the client (browser).

---

## Table of Contents

* [Problem Statement](#problem-statement)
* [Encryption Flow](#encryption-flow)
* [Decryption Flow](#decryption-flow)
* [Tech Stack](#tech-stack)
* [Security Principles](#security-principles)
* [Setup & Development](#setup--development)
* [Usage](#usage)
* [Project Group & Team](#project-group--team)
* [Notes & Recommendations](#notes--recommendations)
* [License](#license)

---

## Problem Statement

A web-based system to store files in a **confidential** and **integrity-protected** way.

* Files are encrypted **client-side** before uploading to the server.
* AES-256-GCM is used for content encryption (confidentiality + integrity via auth tag).
* RSA is used to protect the AES key for sharing and secure storage on server.
* SHA-256 is used to compute and verify file hash for additional integrity verification.
* The server stores only encrypted blobs and never receives plaintext or private keys.

---

## Encryption Flow

1. User selects a file in the browser.
2. Browser generates a random **AES-256** key.
3. Compute **SHA-256** hash of the selected file.
4. Concatenate or package the file and its hash (or store hash alongside) and encrypt with **AES-256-GCM**. This produces: `ciphertext`, `iv`, and `authTag`.
5. Encrypt the AES key using the user's **RSA Public Key**.
6. Upload the following to the server:

   * `ciphertext` (encrypted file contents)
   * `iv` (initialization vector used for AES-GCM)
   * `authTag` (authentication tag returned by AES-GCM)
   * `encryptedAESKey` (AES key encrypted with RSA public key)
   * optional metadata (original filename, content-type, timestamp, owner ID)

---

## Decryption Flow

1. Client requests/downloads `ciphertext + iv + authTag + encryptedAESKey` from the server.
2. User provides **RSA Private Key** via GUI prompt (private key must never be stored in localStorage or sent to server).
3. Decrypt `encryptedAESKey` with RSA private key to retrieve the AES-256 key.
4. Use AES-256-GCM with `iv` and `authTag` to decrypt the `ciphertext` and obtain the original file (and stored hash if packaged).
5. Recompute **SHA-256** of the decrypted file and verify with the stored hash to ensure integrity.

---

## Tech Stack

* **Frontend**: React, Web Crypto API (recommended) for all browser cryptography.
* **Backend**: Node.js or Next.js (API endpoints to store/retrieve encrypted blobs).
* **Crypto (server-side)**: Node's `crypto` module, or OpenSSL for any server-side utilities.

Recommended developers tools: `npm`, `yarn`, `TypeScript` (optional but recommended), `ESLint`, `Prettier`.

---

## Security Principles & Best Practices

* Perform **all cryptographic operations in the browser**. The server sees only encrypted data.
* **Never** send secret keys (AES keys or RSA private keys) to the server.
* You may store the RSA **public key** in `localStorage` for convenience; **do not store** the private key.
* Require the user to paste or upload their **RSA private key** at decryption time. Make sure UI makes it clear the private key remains local.
* Use **AES-256-GCM** rather than AES-CBC because GCM provides authenticated encryption (integrity + confidentiality).
* Use a strong random IV for each AES-GCM encryption (e.g., 12 bytes recommended).
* Use a secure RSA key length (2048 or 4096 bits). Consider using RSA-OAEP for padding when encrypting the AES key.
* Use HKDF or similar KDF when deriving keys from passphrases — but prefer randomly generated AES keys.
* Protect against large-file DoS by limiting upload sizes server-side.
* Consider additional protections such as server-side access control, signed metadata, and rate limiting.

---

## Setup & Development

> These are example steps for a typical React frontend + Node.js backend. Adjust as needed for your repo structure.

### Prerequisites

* Node.js (v16+)
* npm or yarn

### Install

```bash
# from project root
npm install
# or
yarn install
```

### Run Dev Servers

```bash
# run backend API
npm run dev:server
# run frontend
npm run dev:client
```

### Build for Production

```bash
npm run build
npm run start
```

---

## Usage

1. **Encryption / Upload**

   * Open the web app and navigate to the upload page.
   * Choose a file.
   * The browser will generate a random AES-256 key and compute SHA-256 of the file.
   * File + hash are encrypted using AES-256-GCM.
   * Browser encrypts the AES key with the user’s RSA public key.
   * The encrypted data and encrypted key are uploaded to the server.

2. **Decryption / Download**

   * Request the stored encrypted file from the server.
   * Prompted to paste or upload the RSA private key (kept local only).
   * The app decrypts the AES key using RSA private key, then decrypts the file via AES-256-GCM.
   * The SHA-256 hash is recomputed and compared to the stored hash for integrity verification.

---

## Project Group & Team

* **Group:** B1

**Teammates:**

* Kushagra Gupta (IIT2023175)
* Rahul Nigam (IIT2023176)
* Sparsh Garg (IIT2023186)
* Aniz Agarwal (IIT2023189)
* Ujjwal Mishra (IIT2023177)
* Rohit Kumar Gupta (IIT2023185)

---

## Notes & Recommendations

* Prefer WebCrypto API (native, secure) over third-party JS crypto libraries when possible.
* If you need cross-browser compatibility, add feature detection and fallbacks.
* Provide clear UI warnings when the user pastes their private key — remind them it stays local and should never be shared.
* Consider adding client-side RSA keypair generation UI (with an option to export keys in PEM/HEX formats).
* For sharing files between users, encrypt the AES key separately with each recipient's public key so multiple recipients can decrypt.

---

## License

This project is released under the MIT License. Feel free to adapt for your course/project.

---

> *This README was generated from the supplied problem statement and encryption/decryption flow.*
