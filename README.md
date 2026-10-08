# Virtual Cryptography Laboratory

Virtual Cryptography Laboratory is a static, browser-based practical portal for the CSS TH ISE Cryptographic Security Systems course. It provides one shared academic interface for 16 independent student experiments.

## Stack

- HTML5
- CSS3 with shared variables and responsive layouts
- Vanilla JavaScript (ES6+)
- Client-side cryptography libraries where an experiment requires them
- GitHub Pages for static deployment

## Experiments

MD5, SHA-1, RSA, MAC, HMAC, Kerberos, Needham-Schroeder, bcrypt, Argon2, Argon2id, Classical Encryption, Extended Euclidean Algorithm, Brute Force, Dictionary Attack, Frequency Analysis, and SSL/TLS.

## Run Locally

No package installation is required. From the repository root, run:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser. A local HTTP server is recommended because experiment pages load shared assets with relative paths.

## Branch Model

`main` is maintained by the integration team. Each experiment has a matching branch such as `group-md5` or `group-rsa`. Groups submit pull requests from their branch to `main` and work only inside their assigned `experiments/<name>/` directory.

## Contribution

Read [docs/GROUP_INSTRUCTIONS.md](docs/GROUP_INSTRUCTIONS.md), [docs/API_SPECS.md](docs/API_SPECS.md), and [docs/PR_RULES.md](docs/PR_RULES.md) before starting. The shared template, CSS, navigation, and portal shell are integration-owned.

## Deployment

The site is designed for GitHub Pages. See [docs/setup.html](docs/setup.html) for the visual setup guide and local deployment instructions.
