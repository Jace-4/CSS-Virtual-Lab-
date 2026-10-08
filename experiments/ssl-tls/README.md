# SSL/TLS Overview - Virtual Laboratory Experiment

## Aim
Study and simulate the basic architecture and working of the SSL/TLS protocol between a client and a server. Simulate the SSL/TLS handshake process and demonstrate the sequence of messages exchanged between the client and server.

## Features & Implementation
This virtual lab provides a complete client-side simulation of the TLS 1.2 and TLS 1.3 handshake protocols, leveraging the browser's native **Web Crypto API**. 

- **Real Cryptography**: It generates actual P-256 ECDH key pairs, derives shared secrets, and performs real AES-128-GCM encryption on application data. 
- **Sequence Diagram & Animations**: Animated visualization of packet exchange between Client and Server lifelines.
- **Packet Inspector**: Clicking any packet in the sequence diagram reveals the simulated payload (Version, Randoms, Cipher Suites, Key Shares).
- **Interactive Scenarios**: Configurable failure and attack scenarios (Expired Cert, MITM, Tampered MAC).
- **Event Log & Export**: A time-stamped log tracks all cryptographic state changes, which can be exported as a PDF lab report.

## File Structure
- `index.html`: The HTML view with semantic tabs (Aim, Theory, Procedure, Simulation, Observations, Quiz, Viva, References).
- `style.css`: Custom animations, layout grids, sequence diagram components, and dark/light UI consistency.
- `script.js`: Core simulation logic, Web Crypto API abstractions, dynamic TLS 1.2/1.3 state machines, and DOM manipulation.
- `README.md`: This documentation.

## How to Run Locally
Since this lab uses standard Vanilla HTML/CSS/JS and relies on the browser's native Web Crypto API, no build steps (like Webpack or Vite) are required.
From the repository root (not this folder directly, so paths resolve properly), start a local HTTP server:

```bash
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Then open `http://localhost:8000/experiments/ssl-tls/` in a modern browser (Chrome, Firefox, Safari).

## Dependencies
- Standard `css/` and `js/common.js` from the repository framework.
- `jspdf` loaded via CDN for PDF export functionality.
