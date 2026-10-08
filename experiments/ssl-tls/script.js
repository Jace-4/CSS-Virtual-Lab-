/**
 * SSL/TLS Simulation Logic
 * Incorporates Web Crypto API for actual cryptographic key exchange and symmetric encryption.
 */

const State = {
    stepIndex: 0,
    isPlaying: false,
    speed: 3,
    tlsVersion: '1.3',
    scenario: 'success',
    clientCrypto: {},
    serverCrypto: {},
    messages: [], // To store history
    rttCount: 0,
    autoPlayTimeout: null,
    runId: 0,
    isFailed: false
};

const Elements = {
    tlsVersion: document.getElementById('tlsVersion'),
    scenario: document.getElementById('simScenario'),
    btnPlay: document.getElementById('btnPlay'),
    btnStepFwd: document.getElementById('btnStepFwd'),
    btnReset: document.getElementById('btnReset'),
    speed: document.getElementById('simSpeed'),
    clientState: document.getElementById('clientState'),
    serverState: document.getElementById('serverState'),
    clientCrypto: document.getElementById('clientCrypto'),
    serverCrypto: document.getElementById('serverCrypto'),
    networkChannel: document.getElementById('networkChannel'),
    messagesContainer: document.getElementById('messagesContainer'),
    svg: document.getElementById('sequenceSvg'),
    inspectorContent: document.getElementById('inspectorContent'),
    explanationText: document.getElementById('explanationText'),
    eventLog: document.getElementById('eventLog'),
    obsTableBody: document.querySelector('#obsTable tbody'),
    appInput: document.getElementById('appInput'),
    btnSendApp: document.getElementById('btnSendApp'),
    serverOutputBox: document.getElementById('serverOutputBox')
};

/* --- Cryptography Engine (Web Crypto API) --- */

// Convert Buffer to Hex String
function buf2hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

// Generate Random 32 bytes
function generateRandom() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return buf2hex(arr);
}

// Generate ECDH Key Pair
async function generateECDHKeyPair() {
    return await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
    );
}

// Derive Shared Secret using ECDH
async function deriveSharedSecret(privateKey, publicKey) {
    const bits = await crypto.subtle.deriveBits(
        { name: "ECDH", public: publicKey },
        privateKey,
        256
    );
    return buf2hex(bits);
}

// Export Public Key to JWK for transport simulation
async function exportPublicKey(key) {
    return await crypto.subtle.exportKey("jwk", key);
}

// Import Public Key from JWK
async function importPublicKey(jwk) {
    return await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );
}

// AES-GCM Encrypt
async function encryptData(keyHex, ivHex, plaintext) {
    const key = await crypto.subtle.importKey(
        "raw", new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))),
        { name: "AES-GCM" }, false, ["encrypt"]
    );
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const enc = new TextEncoder();
    const cipherBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(plaintext)
    );
    return buf2hex(cipherBuffer);
}

// AES-GCM Decrypt
async function decryptData(keyHex, ivHex, ciphertextHex) {
    const key = await crypto.subtle.importKey(
        "raw", new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))),
        { name: "AES-GCM" }, false, ["decrypt"]
    );
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const cipherData = new Uint8Array(ciphertextHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    try {
        const plainBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            cipherData
        );
        const dec = new TextDecoder();
        return dec.decode(plainBuffer);
    } catch (e) {
        return null; // Decryption failed (tampered data)
    }
}

/* --- Simulation Steps Definition --- */

// The steps dynamically populate based on TLS 1.2 vs 1.3
let simSequence = [];

async function initializeCryptoState() {
    State.clientCrypto = {
        random: generateRandom(),
        keyPair: await generateECDHKeyPair(),
        sharedSecret: null,
        masterSecret: null
    };
    State.serverCrypto = {
        random: generateRandom(),
        keyPair: await generateECDHKeyPair(),
        sharedSecret: null,
        masterSecret: null
    };
}

function buildTLS13Sequence() {
    return [
        {
            name: "ClientHello",
            dir: "c2s",
            desc: "Client initiates connection, proposes TLS 1.3, ciphers, and sends its public key share (ECDHE).",
            execute: async () => {
                const jwk = await exportPublicKey(State.clientCrypto.keyPair.publicKey);
                return {
                    version: "TLS 1.3",
                    random: State.clientCrypto.random,
                    cipherSuites: ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384"],
                    keyShare: jwk.x + "..." // Truncated for display
                };
            },
            rtt: 0
        },
        {
            name: "ServerHello & KeyShare",
            dir: "s2c",
            desc: "Server selects cipher, sends its key share, and derives the shared secret.",
            execute: async () => {
                const jwk = await exportPublicKey(State.serverCrypto.keyPair.publicKey);
                // Server derives secret
                State.serverCrypto.sharedSecret = await deriveSharedSecret(
                    State.serverCrypto.keyPair.privateKey, 
                    State.clientCrypto.keyPair.publicKey
                );
                return {
                    version: "TLS 1.3",
                    random: State.serverCrypto.random,
                    cipherSelected: "TLS_AES_128_GCM_SHA256",
                    keyShare: jwk.x + "...",
                    computedSecret: State.serverCrypto.sharedSecret.substring(0, 16) + "..."
                };
            },
            rtt: 0.5
        },
        {
            name: "EncryptedExtensions & Certificate",
            dir: "s2c",
            encrypted: true,
            desc: "Server sends its certificate (now encrypted in TLS 1.3) to authenticate itself.",
            execute: async () => {
                if (State.scenario === 'expired') {
                    return { error: "Certificate Expired!" };
                }
                return {
                    subject: "CN=example.com",
                    issuer: "CN=Trusted CA",
                    validity: "Valid",
                    signature: "Verified"
                };
            },
            rtt: 0.5
        },
        {
            name: "Server Finished",
            dir: "s2c",
            encrypted: true,
            desc: "Server confirms handshake integrity using a MAC over all previous messages.",
            execute: async () => {
                return {
                    verifyData: buf2hex(new Uint8Array([1,2,3,4,5,6,7,8])) // Mock verify data
                };
            },
            rtt: 0.5
        },
        {
            name: "Client Finished",
            dir: "c2s",
            encrypted: true,
            desc: "Client derives secret, verifies server, and sends its Finished message.",
            execute: async () => {
                State.clientCrypto.sharedSecret = await deriveSharedSecret(
                    State.clientCrypto.keyPair.privateKey, 
                    State.serverCrypto.keyPair.publicKey
                );
                
                if (State.scenario === 'mitm') {
                    return { alert: "Fatal: Bad Certificate (MITM detected)" };
                }

                if (State.scenario === 'tampered') {
                    return { alert: "Fatal: Bad Record MAC (Tampered)" };
                }

                return {
                    computedSecret: State.clientCrypto.sharedSecret.substring(0, 16) + "...",
                    verifyData: buf2hex(new Uint8Array([8,7,6,5,4,3,2,1]))
                };
            },
            rtt: 1.0
        }
    ];
}

function buildTLS12Sequence() {
    return [
        { name: "ClientHello", dir: "c2s", desc: "Client sends supported versions and random.", execute: async () => ({ version: "TLS 1.2", random: State.clientCrypto.random }), rtt: 0 },
        { name: "ServerHello", dir: "s2c", desc: "Server selects parameters.", execute: async () => ({ version: "TLS 1.2", random: State.serverCrypto.random, cipher: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256" }), rtt: 0.5 },
        { name: "Certificate", dir: "s2c", desc: "Server sends certificate.", execute: async () => { if(State.scenario==='expired') return {error:"Expired"}; return {subject:"CN=example.com"}; }, rtt: 0.5 },
        { name: "ServerKeyExchange", dir: "s2c", desc: "Server sends ECDHE public key.", execute: async () => ({ params: "secp256r1", signature: "RSA-PSS..."}), rtt: 0.5 },
        { name: "ServerHelloDone", dir: "s2c", desc: "Server finished sending.", execute: async () => ({ status: "Done" }), rtt: 0.5 },
        { name: "ClientKeyExchange", dir: "c2s", desc: "Client sends ECDHE public key.", execute: async () => {
            if (State.scenario === 'mitm') {
                return { alert: "Fatal: Bad Certificate (MITM detected)" };
            }
            State.clientCrypto.sharedSecret = await deriveSharedSecret(State.clientCrypto.keyPair.privateKey, State.serverCrypto.keyPair.publicKey);
            return { clientKeyShare: "...", secretDerived: true };
        }, rtt: 1.0 },
        { name: "ChangeCipherSpec (Client)", dir: "c2s", desc: "Switching to symmetric encryption.", execute: async () => ({ status: "Encryption On" }), rtt: 1.0 },
        { name: "Finished (Client)", dir: "c2s", encrypted: true, desc: "Encrypted verify data.", execute: async () => {
            if (State.scenario === 'tampered') {
                return { alert: "Fatal: Bad Record MAC (Tampered)" };
            }
            return { verifyData: "0xABCDEF..." };
        }, rtt: 1.0 },
        { name: "ChangeCipherSpec (Server)", dir: "s2c", desc: "Switching to symmetric encryption.", execute: async () => {
            State.serverCrypto.sharedSecret = await deriveSharedSecret(State.serverCrypto.keyPair.privateKey, State.clientCrypto.keyPair.publicKey);
            return { status: "Encryption On" };
        }, rtt: 1.5 },
        { name: "Finished (Server)", dir: "s2c", encrypted: true, desc: "Encrypted verify data.", execute: async () => ({ verifyData: "0x123456..." }), rtt: 1.5 }
    ];
}

async function prepareSimulation() {
    State.runId++; // Abort any pending async operations from previous run
    State.isFailed = false;
    clearUI();
    await initializeCryptoState();
    State.tlsVersion = Elements.tlsVersion.value;
    State.scenario = Elements.scenario.value;
    State.stepIndex = 0;
    
    if (State.tlsVersion === '1.3') {
        simSequence = buildTLS13Sequence();
    } else {
        simSequence = buildTLS12Sequence();
    }
    
    updateCryptoUI();
    logEvent("Simulation initialized with " + State.tlsVersion + ", Scenario: " + State.scenario);
}

/* --- UI and Animation --- */

function clearUI() {
    Elements.messagesContainer.innerHTML = '';
    Elements.svg.innerHTML = '';
    Elements.eventLog.innerHTML = '';
    Elements.obsTableBody.innerHTML = '';
    Elements.inspectorContent.innerHTML = 'Select a message to view details.';
    Elements.explanationText.innerText = 'Click Play or Step Forward to begin.';
    Elements.appInput.placeholder = 'Wait for successful handshake...';
    Elements.appInput.disabled = true;
    Elements.btnSendApp.disabled = true;
    State.messages = [];
    Elements.clientCrypto.innerHTML = "Keys: None";
    Elements.serverCrypto.innerHTML = "Keys: None";
    document.getElementById('rttCount').innerText = "0";
    document.getElementById('hsStatusBadge').innerText = "Not Started";
    document.getElementById('serverOutputBox').innerHTML = '<p class="server-rcvd-msg">Awaiting data...</p>';
    document.getElementById('conclusionText').innerText = "Awaiting simulation completion.";
}

function updateCryptoUI() {
    Elements.clientCrypto.innerHTML = `
        <strong>Random:</strong> ${State.clientCrypto.random.substring(0,8)}...<br>
        <strong>Secret:</strong> ${State.clientCrypto.sharedSecret ? State.clientCrypto.sharedSecret.substring(0,16)+'...' : 'Pending'}
    `;
    Elements.serverCrypto.innerHTML = `
        <strong>Random:</strong> ${State.serverCrypto.random.substring(0,8)}...<br>
        <strong>Secret:</strong> ${State.serverCrypto.sharedSecret ? State.serverCrypto.sharedSecret.substring(0,16)+'...' : 'Pending'}
    `;
}

function logEvent(msg) {
    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString();
    li.innerText = `[${time}] ${msg}`;
    Elements.eventLog.prepend(li);
}

function recordObservation(step) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${new Date().toLocaleTimeString()}</td>
        <td>${step.dir === 'c2s' ? 'Client -> Server' : 'Server -> Client'}</td>
        <td>${step.name}</td>
        <td>${step.encrypted ? 'Encrypted' : 'Plaintext'}</td>
    `;
    Elements.obsTableBody.appendChild(tr);
}

async function executeStep() {
    const currentRunId = State.runId;
    if (State.stepIndex >= simSequence.length) {
        completeHandshake();
        return;
    }

    const step = simSequence[State.stepIndex];
    
    // Execute crypto logic
    const payload = await step.execute();
    
    // If the simulation was reset while we were waiting for crypto, abort this step
    if (State.runId !== currentRunId) return;
    
    // Check for fatal errors based on scenario
    if (payload.error || payload.alert) {
        State.isPlaying = false;
        State.isFailed = true;
        Elements.btnPlay.innerText = "Play";
        animatePacket(step, payload, true); // True means error
        document.getElementById('hsStatusBadge').innerText = "Failed";
        Elements.explanationText.innerHTML = `<strong>Handshake Failed:</strong> ${payload.error || payload.alert}. Connection terminated.`;
        document.getElementById('conclusionText').innerHTML = `<strong>Failure:</strong> The handshake could not be completed due to: <em>${payload.error || payload.alert}</em>. This demonstrates how TLS prevents insecure connections when verification fails.`;
        logEvent(`FATAL ERROR: ${payload.error || payload.alert}`);
        return;
    }

    animatePacket(step, payload, false);
    
    Elements.explanationText.innerText = step.desc;
    document.getElementById('rttCount').innerText = step.rtt;
    logEvent(`${step.dir === 'c2s' ? 'Client sent' : 'Server sent'} ${step.name}`);
    recordObservation(step);
    
    updateCryptoUI();
    State.stepIndex++;

    if (State.isPlaying) {
        const delay = (6 - Elements.speed.value) * 500;
        State.autoPlayTimeout = setTimeout(executeStep, delay + 800); // 800ms for animation
    } else if (State.stepIndex >= simSequence.length) {
        completeHandshake();
    }
}

function animatePacket(step, payload, isError) {
    const pkt = document.createElement('div');
    pkt.className = `msg-packet ${step.encrypted ? 'encrypted' : ''} ${isError ? 'error' : ''}`;
    pkt.innerText = step.name;
    
    // Store payload for inspector
    pkt.dataset.payload = JSON.stringify(payload, null, 2);
    pkt.onclick = () => {
        Elements.inspectorContent.innerHTML = `<pre>${pkt.dataset.payload}</pre>`;
    };

    Elements.messagesContainer.appendChild(pkt);
    
    const startY = 10 + (State.stepIndex * 35); // spacing
    pkt.style.top = startY + 'px';
    
    // Animation - edge-aligned to prevent cropping
    if (step.dir === 'c2s') {
        pkt.style.left = '5%';
        pkt.style.transform = 'translateX(0)';
        setTimeout(() => { 
            pkt.style.left = '95%'; 
            pkt.style.transform = 'translateX(-100%)'; 
        }, 50);
    } else {
        pkt.style.left = '95%';
        pkt.style.transform = 'translateX(-100%)';
        setTimeout(() => { 
            pkt.style.left = '5%'; 
            pkt.style.transform = 'translateX(0)'; 
        }, 50);
    }
    
    drawArrow(startY + 12, step.dir, isError ? 'red' : (step.encrypted ? '#6f42c1' : '#0056b3'));
}

function drawArrow(y, dir, color) {
    const svgNS = "http://www.w3.org/2000/svg";
    
    // Create markers definitions if they don't exist
    if (!document.getElementById('arrow-defs')) {
        const defs = document.createElementNS(svgNS, 'defs');
        defs.id = 'arrow-defs';
        Elements.svg.appendChild(defs);
    }
    const defs = document.getElementById('arrow-defs');
    const markerId = `arrowhead-${color.replace('#', '')}`;
    if (!document.getElementById(markerId)) {
        const marker = document.createElementNS(svgNS, 'marker');
        marker.setAttribute('id', markerId);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS(svgNS, 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', color);
        marker.appendChild(polygon);
        defs.appendChild(marker);
    }

    const line = document.createElementNS(svgNS, 'line');
    
    let x1 = dir === 'c2s' ? '5%' : '95%';
    let x2 = dir === 'c2s' ? '95%' : '5%';
    
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,5');
    line.setAttribute('marker-end', `url(#${markerId})`);
    
    Elements.svg.appendChild(line);
}

function completeHandshake() {
    State.isPlaying = false;
    Elements.btnPlay.innerText = "Play";
    document.getElementById('hsStatusBadge').innerText = "Established";
    Elements.explanationText.innerHTML = "<strong>Handshake Complete!</strong> Secure channel established. You can now send encrypted application data.";
    document.getElementById('conclusionText').innerHTML = "<strong>Success!</strong> The TLS handshake completed successfully. Both client and server authenticated and derived shared cryptographic keys. They can now securely exchange application data.";
    logEvent("Secure channel established successfully.");
    
    // Enable App Data input
    Elements.appInput.placeholder = "Enter message to send...";
    Elements.appInput.disabled = false;
    Elements.btnSendApp.disabled = false;
    Elements.appInput.focus();
}

/* --- App Data Sending --- */
Elements.btnSendApp.onclick = async () => {
    const plaintext = Elements.appInput.value;
    if (!plaintext) return;
    
    const iv = "000000000000000000000000"; // Fake IV for demo
    const ciphertext = await encryptData(State.clientCrypto.sharedSecret.substring(0,64), iv, plaintext);
    
    logEvent(`App Data Sent: Plaintext length ${plaintext.length}`);
    
    // Animate App Data
    const pkt = document.createElement('div');
    pkt.className = 'msg-packet encrypted';
    pkt.innerText = "Application Data";
    pkt.dataset.payload = JSON.stringify({
        type: "Encrypted Application Data",
        ciphertext: ciphertext.substring(0, 32) + "..."
    }, null, 2);
    pkt.onclick = () => { Elements.inspectorContent.innerHTML = `<pre>${pkt.dataset.payload}</pre>`; };
    
    const startY = 10 + ((State.stepIndex + 1) * 35);
    pkt.style.top = startY + 'px';
    Elements.messagesContainer.appendChild(pkt);
    pkt.style.left = '5%';
    pkt.style.transform = 'translateX(0)';
    setTimeout(() => { 
        pkt.style.left = '95%'; 
        pkt.style.transform = 'translateX(-100%)'; 
    }, 50);
    drawArrow(startY + 12, 'c2s', '#6f42c1');
    State.stepIndex++;

    // Decrypt on server
    setTimeout(async () => {
        const decrypted = await decryptData(State.serverCrypto.sharedSecret.substring(0,64), iv, ciphertext);
        Elements.serverOutputBox.innerHTML += `<p style="color: green;"><b>Decrypted:</b> ${decrypted}</p>`;
        logEvent("Server decrypted application data successfully.");
    }, 600);
    
    Elements.appInput.value = '';
};

/* --- Event Listeners --- */

Elements.tlsVersion.onchange = async () => { await prepareSimulation(); };
Elements.scenario.onchange = async () => { await prepareSimulation(); };

Elements.btnPlay.onclick = async () => {
    if (State.stepIndex === 0 && !State.isPlaying && !State.isFailed) {
        await prepareSimulation();
    }
    
    if (State.isPlaying) {
        State.isPlaying = false;
        Elements.btnPlay.innerText = "Play";
        clearTimeout(State.autoPlayTimeout);
    } else {
        if(State.stepIndex >= simSequence.length || State.isFailed) {
            await prepareSimulation();
        }
        State.isPlaying = true;
        Elements.btnPlay.innerText = "Pause";
        executeStep();
    }
};

Elements.btnStepFwd.onclick = async () => {
    if (State.stepIndex === 0 && !State.isFailed) {
        await prepareSimulation();
    } else if (State.isFailed || State.stepIndex >= simSequence.length) {
        await prepareSimulation();
    }
    State.isPlaying = false;
    Elements.btnPlay.innerText = "Play";
    clearTimeout(State.autoPlayTimeout);
    executeStep();
};



Elements.btnReset.onclick = () => {
    State.isPlaying = false;
    Elements.btnPlay.innerText = "Play";
    clearTimeout(State.autoPlayTimeout);
    clearUI();
};

/* --- Quiz Logic --- */
const quizQuestions = [
    { q: "What does TLS stand for?", options: ["Transport Level Security", "Transport Layer Security", "Transmission Layer Security", "Transitional Link Security"], ans: 1 },
    { q: "What major performance improvement does TLS 1.3 offer over TLS 1.2 during a new handshake?", options: ["0-RTT by default", "1-RTT instead of 2-RTT", "No handshake required", "2-RTT instead of 3-RTT"], ans: 1 },
    { q: "Why was the RSA Key Exchange deprecated in TLS 1.3?", options: ["It was too slow", "It lacked Perfect Forward Secrecy", "It used too much bandwidth", "It was incompatible with AES-GCM"], ans: 1 },
    { q: "What is the primary purpose of the 'Client Random' and 'Server Random'?", options: ["To prevent replay attacks and ensure unique session keys", "To compress the payload", "To authenticate the server certificate", "To identify the user uniquely"], ans: 0 },
    { q: "In the TLS handshake, what is the role of the 'ChangeCipherSpec' message?", options: ["To request a new certificate", "To signal that subsequent records will be encrypted", "To terminate the connection", "To update the TCP port"], ans: 1 },
    { q: "Which cryptographic primitive is used to derive the Master Secret in TLS 1.2?", options: ["AES", "RSA Signature", "Pseudo-Random Function (PRF)", "Base64 Encoding"], ans: 2 },
    { q: "What happens if a Man-in-the-Middle (MITM) modifies the handshake messages in transit?", options: ["The connection continues unencrypted", "The 'Finished' message MAC verification fails", "The server silently drops the client", "The client sends a new ClientHello"], ans: 1 },
    { q: "Which of the following is typically authenticated via a Digital Certificate during the handshake?", options: ["The Client", "The Network Router", "The Server", "The DNS Provider"], ans: 2 },
    { q: "What does Perfect Forward Secrecy (PFS) guarantee?", options: ["A compromised server private key won't decrypt past recorded traffic", "Keys are sent in plaintext securely", "The server can forward traffic perfectly", "Client anonymity is preserved"], ans: 0 },
    { q: "What type of cipher is AES-128-GCM, commonly used in modern TLS?", options: ["Stream cipher without authentication", "Asymmetric cipher", "Authenticated Encryption with Associated Data (AEAD)", "Block cipher in ECB mode"], ans: 2 }
];

const quizContainer = document.getElementById('quizContainer');
quizQuestions.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'quiz-question';
    div.innerHTML = `<p><strong>${index + 1}. ${item.q}</strong></p>`;
    item.options.forEach((opt, i) => {
        div.innerHTML += `<label><input type="radio" name="q${index}" value="${i}"> ${opt}</label>`;
    });
    quizContainer.appendChild(div);
});

document.getElementById('btnSubmitQuiz').onclick = () => {
    let score = 0;
    quizQuestions.forEach((item, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected && parseInt(selected.value) === item.ans) score++;
    });
    document.getElementById('quizScore').innerText = `You scored ${score} out of ${quizQuestions.length}.`;
};

/* Export Lab Report (jsPDF) */
document.getElementById('btnExportLog').onclick = () => {
    if (!window.jspdf) {
        alert("PDF library not loaded yet. Try again in a moment.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("SSL/TLS Overview - Lab Report", 10, 10);
    
    doc.setFontSize(12);
    doc.text(`Configuration: ${Elements.tlsVersion.value} | Scenario: ${Elements.scenario.value}`, 10, 20);
    doc.text(`RTTs: ${document.getElementById('rttCount').innerText}`, 10, 30);
    
    doc.text("Event Log:", 10, 45);
    let y = 55;
    const logItems = Elements.eventLog.querySelectorAll('li');
    logItems.forEach((li, i) => {
        if(i > 15) return; // limit for demo
        doc.setFontSize(10);
        doc.text(li.innerText, 10, y);
        y += 8;
    });

    doc.save("SSL_TLS_Lab_Report.pdf");
};

/* --- Feedback Logic --- */
const feedbackForm = document.getElementById('feedbackForm');
if (feedbackForm) {
    const stars = document.querySelectorAll('#starRating span');
    const ratingInput = document.getElementById('fbRating');

    stars.forEach(star => {
        star.onclick = () => {
            const value = star.getAttribute('data-value');
            ratingInput.value = value;
            stars.forEach(s => {
                s.style.color = s.getAttribute('data-value') <= value ? '#ffd700' : '#ccc';
            });
        };
    });

    feedbackForm.onsubmit = (e) => {
        e.preventDefault();
        
        if (ratingInput.value === "0") {
            alert("Please select a star rating.");
            return;
        }

        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        submitBtn.innerText = "Processing...";
        
        const feedbackData = {
            rating: parseInt(ratingInput.value),
            message: document.getElementById('fbMessage').value,
            timestamp: new Date().toISOString()
        };

        // Send feedback to Formspree
        const formspreeUrl = "https://formspree.io/f/mgaoayoo";

        fetch(formspreeUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedbackData)
        })
        .then(response => {
            if (response.ok) {
                feedbackForm.innerHTML = `
                    <div style="text-align: center; padding: 20px; border: 1px solid #28a745; border-radius: 8px; background-color: #d4edda; color: #155724;">
                        <h3 style="margin-top: 0; margin-bottom: 0;">Feedback sent !</h3>
                    </div>
                `;
            } else {
                alert("Oops! There was a problem submitting your feedback.");
                submitBtn.innerText = "Submit Feedback";
            }
        })
        .catch(error => {
            alert("Oops! There was a network error submitting your feedback.");
            submitBtn.innerText = "Submit Feedback";
        });
    };
}

// Initialize
clearUI();
