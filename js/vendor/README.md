# Client-Side Cryptography Libraries for Experiment Groups

These libraries are bundled directly in the repository so you can build your experiment without needing Node.js or `npm`.

## Available Libraries

### 1. CryptoJS (`js/vendor/crypto-js.min.js`)
**Use for:** MD5, SHA-1, SHA-256, HMAC, AES, PBKDF2
```html
<script src="../../js/vendor/crypto-js.min.js"></script>
<script>
  // MD5
  const md5Hash = CryptoJS.MD5("Message").toString();

  // SHA-1
  const sha1Hash = CryptoJS.SHA1("Message").toString();

  // HMAC-SHA256
  const hmac = CryptoJS.HmacSHA256("Message", "SecretKey").toString();
</script>
```

### 2. Node-Forge (`js/vendor/forge.min.js`)
**Use for:** RSA keypair generation, public key encryption, private key decryption, digital signatures, ASN.1 / X.509
```html
<script src="../../js/vendor/forge.min.js"></script>
<script>
  // Generate RSA Keypair
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 1024, workers: -1 });
  const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

  // Encrypt
  const encrypted = keypair.publicKey.encrypt("Secret message", "RSA-OAEP");

  // Decrypt
  const decrypted = keypair.privateKey.decrypt(encrypted, "RSA-OAEP");
</script>
```

### 3. bcryptjs (`js/vendor/bcrypt.min.js`)
**Use for:** Adaptive password hashing with cost factors
```html
<script src="../../js/vendor/bcrypt.min.js"></script>
<script>
  // Hash password with 10 salt rounds
  const salt = dcodeIO.bcrypt.genSaltSync(10);
  const hash = dcodeIO.bcrypt.hashSync("myPassword", salt);

  // Verify
  const isMatch = dcodeIO.bcrypt.compareSync("myPassword", hash);
</script>
```

### 4. Hash-Wasm / Argon2 (`js/vendor/hash-wasm.min.js`)
**Use for:** Memory-hard password hashing (Argon2d, Argon2i, Argon2id)
```html
<script src="../../js/vendor/hash-wasm.min.js"></script>
<script>
  // Argon2id hashing
  hashwasm.argon2id({
    password: 'password123',
    salt: new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
    iterations: 2,
    memorySize: 4096, // in KB
    parallelism: 1,
    hashLength: 32,
    outputType: 'hex'
  }).then(hash => console.log('Argon2id Hash:', hash));
</script>
```
