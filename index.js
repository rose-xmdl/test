const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { spawn } = require("child_process");
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');

// Global variables to manage sessions
const activeSessions = new Map(); // sessionId -> { phoneNumber, socketId, status }
const userCredentials = new Map(); // phoneNumber -> { credentials, sessionId }

// Child process management
if (process.argv[2] !== "--child") {
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const PORT = process.env.PORT || 3000;

    // Middleware
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));

    // Create necessary directories
    const dirs = ['sessions', 'temp_sessions', 'public'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    // Routes
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.get('/pair', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'pair.html'));
    });

    app.post('/api/start-session', (req, res) => {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber || !phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format. Use format: +1234567890' 
            });
        }

        const sessionId = uuidv4();
        
        // Create session entry
        activeSessions.set(sessionId, {
            phoneNumber,
            status: 'initializing',
            startTime: Date.now()
        });

        res.json({ 
            sessionId, 
            message: 'Session created successfully' 
        });
    });

    app.get('/api/session-status/:sessionId', (req, res) => {
        const sessionId = req.params.sessionId;
        const session = activeSessions.get(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        res.json(session);
    });

    app.delete('/api/cleanup/:sessionId', (req, res) => {
        const sessionId = req.params.sessionId;
        
        // Remove session files
        const sessionPath = path.join(__dirname, 'temp_sessions', sessionId);
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
        
        // Remove from active sessions
        activeSessions.delete(sessionId);
        
        res.json({ message: 'Session cleaned up successfully' });
    });

    // WebSocket for real-time updates
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('startPairing', async (data) => {
            const { sessionId, phoneNumber } = data;
            
            if (!activeSessions.has(sessionId)) {
                socket.emit('error', { message: 'Session not found' });
                return;
            }

            // Update session
            activeSessions.set(sessionId, {
                ...activeSessions.get(sessionId),
                socketId: socket.id,
                status: 'generating_code'
            });

            socket.emit('status', { status: 'generating_code', message: 'Generating pairing code...' });

            // Spawn child process for this session
            const child = spawn('node', [__filename, '--child', '--session', sessionId, '--phone', phoneNumber], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            });

            // Store child process reference
            activeSessions.get(sessionId).childProcess = child;

            // Handle child process messages
            child.on('message', (message) => {
                if (message.type === 'pairingCode') {
                    const pairingCode = message.code;
                    
                    // Update session
                    activeSessions.set(sessionId, {
                        ...activeSessions.get(sessionId),
                        pairingCode,
                        status: 'waiting_for_pairing'
                    });
                    
                    socket.emit('pairingCode', { 
                        code: pairingCode,
                        message: 'Use this code to pair your WhatsApp account' 
                    });
                    
                    // Also generate QR code if needed
                    qrcode.toDataURL(`https://wa.me/?code=${pairingCode}`, (err, url) => {
                        if (!err) {
                            socket.emit('qrCode', { qrCode: url });
                        }
                    });
                }
                else if (message.type === 'status') {
                    socket.emit('status', message.data);
                }
                else if (message.type === 'connected') {
                    // Update session
                    activeSessions.set(sessionId, {
                        ...activeSessions.get(sessionId),
                        status: 'connected',
                        connectedAt: new Date().toISOString()
                    });
                    
                    socket.emit('connected', { 
                        message: 'WhatsApp successfully connected!' 
                    });
                }
                else if (message.type === 'credentials') {
                    const { phoneNumber, credentials } = message;
                    
                    // Store credentials temporarily
                    userCredentials.set(phoneNumber, {
                        credentials,
                        sessionId,
                        timestamp: Date.now()
                    });
                    
                    // Send credentials to user via WhatsApp
                    sendCredentialsToUser(phoneNumber, credentials, sessionId);
                }
                else if (message.type === 'error') {
                    socket.emit('error', message.data);
                }
            });

            child.stdout.on('data', (data) => {
                console.log(`Child stdout [${sessionId}]:`, data.toString());
            });

            child.stderr.on('data', (data) => {
                console.error(`Child stderr [${sessionId}]:`, data.toString());
            });

            child.on('close', (code) => {
                console.log(`Child process exited [${sessionId}] with code ${code}`);
                
                if (activeSessions.has(sessionId)) {
                    const session = activeSessions.get(sessionId);
                    
                    // Clean up if not connected
                    if (session.status !== 'connected') {
                        const sessionPath = path.join(__dirname, 'temp_sessions', sessionId);
                        if (fs.existsSync(sessionPath)) {
                            fs.rmSync(sessionPath, { recursive: true, force: true });
                        }
                        activeSessions.delete(sessionId);
                        socket.emit('sessionExpired', { message: 'Session expired or failed' });
                    }
                }
            });

            // Handle socket disconnect
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                
                // Clean up child process
                if (activeSessions.has(sessionId)) {
                    const session = activeSessions.get(sessionId);
                    if (session.childProcess) {
                        session.childProcess.kill();
                    }
                    
                    // Remove session after delay if not connected
                    setTimeout(() => {
                        if (activeSessions.has(sessionId) && activeSessions.get(sessionId).status !== 'connected') {
                            activeSessions.delete(sessionId);
                        }
                    }, 300000); // 5 minutes
                }
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    // Function to send credentials to user via WhatsApp
    async function sendCredentialsToUser(phoneNumber, credentials, sessionId) {
        try {
            // Convert credentials to string
            const credsString = JSON.stringify(credentials, null, 2);
            
            // Here you would implement sending the credentials via WhatsApp
            // This is a placeholder - you need to implement actual WhatsApp sending
            console.log(`Credentials ready for ${phoneNumber}:`, credentials);
            
            // For now, we'll just store them and mark as sent
            if (userCredentials.has(phoneNumber)) {
                userCredentials.get(phoneNumber).sent = true;
                userCredentials.get(phoneNumber).sentAt = new Date().toISOString();
            }
            
            // Clean up temporary session
            setTimeout(() => {
                const tempPath = path.join(__dirname, 'temp_sessions', sessionId);
                if (fs.existsSync(tempPath)) {
                    fs.rmSync(tempPath, { recursive: true, force: true });
                }
            }, 60000); // Clean up after 1 minute
            
        } catch (error) {
            console.error('Error sending credentials:', error);
        }
    }

    // Cleanup function for expired sessions
    setInterval(() => {
        const now = Date.now();
        for (const [sessionId, session] of activeSessions.entries()) {
            // Remove sessions older than 30 minutes
            if (now - session.startTime > 30 * 60 * 1000) {
                // Kill child process if exists
                if (session.childProcess) {
                    session.childProcess.kill();
                }
                
                // Remove session files
                const sessionPath = path.join(__dirname, 'temp_sessions', sessionId);
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
                
                activeSessions.delete(sessionId);
                console.log(`Cleaned up expired session: ${sessionId}`);
            }
        }
        
        // Clean up old credentials
        for (const [phoneNumber, data] of userCredentials.entries()) {
            if (now - data.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
                userCredentials.delete(phoneNumber);
            }
        }
    }, 5 * 60 * 1000); // Run every 5 minutes

    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Access the pairing page at http://localhost:${PORT}/pair`);
    });

    return;
}

// ============================================
// CHILD PROCESS CODE (Baileys Implementation)
// ============================================

// Get command line arguments
const args = process.argv.slice(2);
const sessionIndex = args.indexOf('--session');
const phoneIndex = args.indexOf('--phone');

if (sessionIndex === -1 || phoneIndex === -1) {
    console.error('Missing required arguments');
    process.exit(1);
}

const sessionId = args[sessionIndex + 1];
const phoneNumber = args[phoneIndex + 1];

// Import Baileys modules
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('baileys');
const pino = require('pino');

// Session directory for this specific session
const sessionDir = `temp_sessions/${sessionId}`;

async function startWhatsAppSession() {
    try {
        // Create session directory
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // Notify parent process
        process.send({ type: 'status', data: { status: 'initializing', message: 'Setting up WhatsApp session...' } });

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: ["Chrome", "Windows", "10.0.0"]
        });

        process.send({ type: 'status', data: { status: 'ready', message: 'Session ready, generating pairing code...' } });

        // Request pairing code
        if (!sock.authState.creds.registered) {
            const code = await sock.requestPairingCode(phoneNumber);
            const formattedCode = code.match(/.{1,4}/g).join('-');
            
            process.send({ 
                type: 'pairingCode', 
                code: formattedCode 
            });
            
            process.send({ 
                type: 'status', 
                data: { 
                    status: 'pairing_code_generated', 
                    message: `Pairing code generated: ${formattedCode}` 
                } 
            });
        }

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'close') {
                const reason = new DisconnectReason(lastDisconnect?.error);
                process.send({ 
                    type: 'status', 
                    data: { 
                        status: 'disconnected', 
                        message: `Connection closed: ${reason}` 
                    } 
                });
                
                // Attempt to reconnect
                if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    setTimeout(() => {
                        startWhatsAppSession();
                    }, 5000);
                } else {
                    process.exit(0);
                }
            }
            
            if (connection === 'open') {
                process.send({ 
                    type: 'connected', 
                    data: { message: 'Successfully connected to WhatsApp!' } 
                });
                
                // Wait a moment for credentials to be saved
                setTimeout(async () => {
                    // Read credentials
                    const credsPath = `${sessionDir}/creds.json`;
                    if (fs.existsSync(credsPath)) {
                        const credentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
                        
                        // Send credentials to parent process
                        process.send({ 
                            type: 'credentials', 
                            phoneNumber, 
                            credentials 
                        });
                        
                        // Send success message to user
                        await sock.sendMessage(`${phoneNumber.replace('+', '')}@s.whatsapp.net`, {
                            text: `✅ Your WhatsApp session has been successfully linked!\n\nYour credentials have been generated and will be sent to you shortly.\n\nSession ID: ${sessionId}`
                        });
                        
                        // Disconnect after sending
                        setTimeout(() => {
                            sock.end();
                            process.exit(0);
                        }, 3000);
                    }
                }, 2000);
            }
        });

        // Save credentials when updated
        sock.ev.on('creds.update', saveCreds);

        // Handle errors
        process.on('uncaughtException', (error) => {
            process.send({ 
                type: 'error', 
                data: { 
                    message: 'An error occurred', 
                    error: error.message 
                } 
            });
        });

    } catch (error) {
        process.send({ 
            type: 'error', 
            data: { 
                message: 'Failed to start WhatsApp session', 
                error: error.message 
            } 
        });
        process.exit(1);
    }
}

// Start the session
startWhatsAppSession();
