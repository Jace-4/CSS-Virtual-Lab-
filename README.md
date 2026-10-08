## Group
Group E

## Experiment ID
EXP05

## Navigation Title
SSL/TLS Overview

## Short Description
Simulate the SSL/TLS handshake protocol and demonstrate cryptographic message exchanges between client and server.

## Folder
/experiments/ssl-tls/

## Entry File
index.html

## Expected Navigation Link
/experiments/ssl-tls/

## Required Libraries
None

## Input
TLS Version, Key Exchange method, and test application data.

## Output
Sequence diagram of the TLS handshake, packet inspection, and decrypted data on the server.

## Theory Summary
Transport Layer Security (TLS) provides communications security over a computer network. The primary goals are confidentiality, integrity, and authentication. The handshake protocol negotiates cipher suites and securely exchanges keying material before data transmission, while the record protocol secures application data using the negotiated keys. TLS 1.3 optimizes the handshake to 1-RTT and mandates Perfect Forward Secrecy.
