const express = require('express');
const { createSocket } = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    Browsers 
} = require('@whiskeysockets/baileys');

const app = express();
const server = http.createServer(app);
const io = createSocket(server);

app.use(express.static(__dirname));
app.use(express.json());

// Store active sessions
const activeSessions = new Map();

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('start-pairing', async (data) => {
        const { phoneNumber } = data;
        const sessionId = `session_${Date.now()}_${socket.id}`;
        
        console.log(`Starting pairing for: ${phoneNumber}`);
        
        try {
            // Generate pairing code
            const pairingResult = await startWhatsAppPairing(phoneNumber, sessionId, socket);
            
            if (pairingResult.success) {
                socket.emit('qr-generated', {
                    sessionId,
                    qr: pairingResult.qr
                });
            } else {
                socket.emit('pairing-error', { error: pairingResult.error });
            }
        } catch (error) {
            console.error('Pairing error:', error);
            socket.emit('pairing-error', { error: error.message });
        }
    });

    socket.on('cancel-pairing', (data) => {
        const { sessionId } = data;
        endSession(sessionId);
        socket.emit('pairing-update', { message: 'Pairing cancelled' });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Clean up sessions for this socket
        for (const [sessionId, session] of activeSessions.entries()) {
            if (session.socketId === socket.id) {
                endSession(sessionId);
            }
        }
    });
});

async function startWhatsAppPairing(phoneNumber, sessionId, socket) {
    const sessionDir = `./sessions/${sessionId}`;
    
    // Create session directory
    if (!fs.existsSync('./sessions')) {
        fs.mkdirSync('./sessions');
    }
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    try {
        // Initialize auth state
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        // Create WhatsApp socket
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true,
        });

        // Store session
        activeSessions.set(sessionId, {
            socketId: socket.id,
            sock,
            saveCreds,
            phoneNumber,
            sessionDir
        });

        // Handle connection updates
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log(`QR generated for ${phoneNumber}`);
                // QR is already handled by the QR generation event
            }

            if (connection === 'open') {
                console.log(`Connected successfully: ${phoneNumber}`);
                
                // Get credentials
                const creds = sock.authState.creds;
                
                // Save credentials to file
                const credsFilePath = `${sessionDir}/creds.json`;
                fs.writeFileSync(credsFilePath, JSON.stringify(creds, null, 2));
                
                // Send credentials to client
                socket.emit('pairing-success', {
                    sessionId,
                    creds,
                    message: 'WhatsApp paired successfully!'
                });
                
                // Clean up session
                setTimeout(() => {
                    endSession(sessionId);
                }, 5000);
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`Connection closed for ${phoneNumber}, reconnect: ${shouldReconnect}`);
                
                if (!shouldReconnect) {
                    socket.emit('pairing-error', { 
                        error: 'Connection closed. Please try again.' 
                    });
                    endSession(sessionId);
                }
            }
        });

        // Save credentials periodically
        sock.ev.on('creds.update', saveCreds);

        // Generate QR
        return new Promise((resolve) => {
            sock.ev.once('connection.update', async (update) => {
                if (update.qr) {
                    resolve({
                        success: true,
                        qr: update.qr
                    });
                }
            });
            
            // Timeout after 30 seconds if no QR
            setTimeout(() => {
                resolve({
                    success: false,
                    error: 'QR generation timeout'
                });
            }, 30000);
        });

    } catch (error) {
        console.error('Error in pairing:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function endSession(sessionId) {
    const session = activeSessions.get(sessionId);
    if (session) {
        try {
            // Close socket connection
            if (session.sock) {
                session.sock.end();
            }
            
            // Delete session directory after 1 minute (to allow download)
            setTimeout(() => {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const sessionDir = `./sessions/${sessionId}`;
                    if (fs.existsSync(sessionDir)) {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                        console.log(`Cleaned up session: ${sessionId}`);
                    }
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            }, 60000);
            
        } catch (error) {
            console.error('Error ending session:', error);
        }
        
        activeSessions.delete(sessionId);
        console.log(`Ended session: ${sessionId}`);
    }
}

// API endpoint to download credentials
app.get('/download-creds/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const sessionDir = `./sessions/${sessionId}`;
    const credsFilePath = `${sessionDir}/creds.json`;
    
    if (fs.existsSync(credsFilePath)) {
        res.download(credsFilePath, `whatsapp-creds-${sessionId}.json`);
    } else {
        res.status(404).json({ error: 'Credentials not found' });
    }
});

// Health check endpoint for Render/Heroku
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to start pairing`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    // Clean up all sessions
    for (const sessionId of activeSessions.keys()) {
        endSession(sessionId);
    }
    process.exit(0);
});
