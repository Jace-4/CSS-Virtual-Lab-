# Setup Guide

## Prerequisites

- Git
- Python 3, or another static HTTP server
- A modern browser
- Write access to the GitHub repository for integration work

## Clone the Repository

```bash
git clone https://github.com/Manthan2907/cryptography-virtual-lab.git
cd cryptography-virtual-lab
```

## Run Locally

From the repository root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Stop the server with `Ctrl+C`.

On Windows, `py -m http.server 8000` can be used when `python3` is not available.

## Branch Structure

The integration branch is `main`. Experiment branches are isolated by group as assigned in the allotment sheet:

```text
group-cryptographic-hash-functions
group-properties-hash-functions
group-md5
group-sha1
group-mac
group-hmac
group-needham-schroeder
group-kerberos
group-rsa
group-rsa-digital-signature-hash
group-bcrypt
group-argon2
group-argon2id
group-password-hashing-comparison
group-rsa-digital-signature
group-access-control-fundamentals
group-access-control-list
group-classical-encryption
group-extended-euclidean
group-brute-force
group-dictionary-attack
group-frequency-analysis
group-ssl-tls
```

Start work from your assigned branch and never develop directly on `main`:

```bash
git checkout group-<your-experiment-name>
# Example:
git checkout group-md5
```

## Bundled Client-Side Cryptography Libraries

The repository vendors client-side cryptography libraries in `js/vendor/`:

- `js/vendor/crypto-js.min.js`: MD5, SHA-1, SHA-256, HMAC, AES
- `js/vendor/forge.min.js`: RSA keypair generation, signing, verification, TLS
- `js/vendor/bcrypt.min.js`: bcrypt password hashing with adaptive cost factor
- `js/vendor/hash-wasm.min.js`: Argon2, Argon2i, Argon2id WebAssembly hashing

See `js/vendor/README.md` for copy-paste code snippets.

## GitHub Pages

In the repository, open **Settings > Pages**, choose **Deploy from a branch**, select `main`, select `/ (root)`, and save. GitHub will publish the root `index.html` at the repository Pages URL.
