<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Session Generator</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 500px;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
            font-size: 14px;
        }

        .content {
            padding: 40px;
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }

        input[type="tel"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        input[type="tel"]:focus {
            outline: none;
            border-color: #25D366;
        }

        .input-note {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }

        .btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(37, 211, 102, 0.3);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .status-container {
            display: none;
            margin-top: 30px;
            text-align: center;
        }

        .status-box {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .status-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }

        .pairing-code {
            background: #25D366;
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 20px 0;
        }

        .instructions {
            background: #e8f5e9;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-size: 14px;
        }

        .instructions ol {
            text-align: left;
            margin-left: 20px;
            margin-top: 10px;
        }

        .instructions li {
            margin-bottom: 8px;
        }

        .qr-container {
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        #qrCode {
            max-width: 200px;
            margin: 0 auto;
            display: block;
        }

        .alert {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: none;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .timer {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #25D366;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
            .container {
                border-radius: 15px;
            }
            
            .header {
                padding: 20px;
            }
            
            .content {
                padding: 20px;
            }
            
            .pairing-code {
                font-size: 24px;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 WhatsApp Session Generator</h1>
            <p>Generate a secure session for your WhatsApp account</p>
        </div>
        
        <div class="content">
            <div id="formSection">
                <div class="form-group">
                    <label for="phoneNumber">WhatsApp Phone Number</label>
                    <input 
                        type="tel" 
                        id="phoneNumber" 
                        placeholder="+1234567890"
                        required
                    >
                    <div class="input-note">
                        Include country code (e.g., +1 for US, +44 for UK, +234 for Nigeria)
                    </div>
                </div>
                
                <button id="startBtn" class="btn">Generate Pairing Code</button>
                
                <div class="alert" id="errorAlert"></div>
            </div>
            
            <div id="statusSection" class="status-container">
                <div class="status-box">
                    <div class="spinner" id="statusSpinner"></div>
                    <div id="statusMessage">Initializing session...</div>
                    <div class="timer" id="timer">Session expires in: 30:00</div>
                </div>
                
                <div id="pairingCodeContainer" style="display: none;">
                    <div class="pairing-code" id="pairingCode">---- ----</div>
                    <div class="instructions">
                        <p><strong>Instructions:</strong></p>
                        <ol>
                            <li>Open WhatsApp on your phone</li>
                            <li>Go to Settings → Linked Devices → Link a Device</li>
                            <li>Enter the pairing code above</li>
                            <li>Wait for connection confirmation</li>
                        </ol>
                    </div>
                </div>
                
                <div id="qrContainer" class="qr-container" style="display: none;">
                    <img id="qrCode" src="" alt="QR Code">
                    <p style="margin-top: 10px; font-size: 14px;">Scan QR code as alternative method</p>
                </div>
                
                <div class="alert" id="successAlert"></div>
                
                <button id="newSessionBtn" class="btn" style="display: none; margin-top: 20px;">
                    Start New Session
                </button>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        let socket = null;
        let sessionId = null;
        let timerInterval = null;
        let timeLeft = 30 * 60; // 30 minutes in seconds

        document.getElementById('startBtn').addEventListener('click', startSession);
        document.getElementById('newSessionBtn').addEventListener('click', resetForm);

        function startSession() {
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            
            if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
                showError('Please enter a valid phone number with country code (e.g., +1234567890)');
                return;
            }

            // Disable button and show loading
            document.getElementById('startBtn').disabled = true;
            document.getElementById('startBtn').textContent = 'Processing...';

            // Connect to Socket.io
            socket = io();

            // Send request to start session
            fetch('/api/start-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showError(data.error);
                    document.getElementById('startBtn').disabled = false;
                    document.getElementById('startBtn').textContent = 'Generate Pairing Code';
                    return;
                }

                sessionId = data.sessionId;
                
                // Switch to status view
                document.getElementById('formSection').style.display = 'none';
                document.getElementById('statusSection').style.display = 'block';
                
                // Start timer
                startTimer();
                
                // Start pairing process
                socket.emit('startPairing', { sessionId, phoneNumber });
            })
            .catch(error => {
                showError('Failed to start session. Please try again.');
                console.error('Error:', error);
                document.getElementById('startBtn').disabled = false;
                document.getElementById('startBtn').textContent = 'Generate Pairing Code';
            });

            // Socket event handlers
            socket.on('status', (data) => {
                updateStatus(data.message);
            });

            socket.on('pairingCode', (data) => {
                document.getElementById('pairingCode').textContent = data.code;
                document.getElementById('pairingCodeContainer').style.display = 'block';
                updateStatus(`Pairing code generated: ${data.code}`);
            });

            socket.on('qrCode', (data) => {
                document.getElementById('qrCode').src = data.qrCode;
                document.getElementById('qrContainer').style.display = 'block';
            });

            socket.on('connected', (data) => {
                showSuccess('✅ WhatsApp successfully connected! Your credentials will be sent to your phone shortly.');
                document.getElementById('statusSpinner').style.display = 'none';
                document.getElementById('pairingCodeContainer').style.display = 'none';
                document.getElementById('qrContainer').style.display = 'none';
                document.getElementById('newSessionBtn').style.display = 'block';
                clearInterval(timerInterval);
            });

            socket.on('error', (data) => {
                showError(data.message);
            });

            socket.on('sessionExpired', () => {
                showError('Session expired. Please start a new session.');
                resetForm();
            });

            socket.on('disconnect', () => {
                showError('Connection lost. Trying to reconnect...');
            });
        }

        function updateStatus(message) {
            document.getElementById('statusMessage').textContent = message;
        }

        function startTimer() {
            const timerElement = document.getElementById('timer');
            
            timerInterval = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    showError('Session expired. Please start a new session.');
                    resetForm();
                    return;
                }
                
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerElement.textContent = `Session expires in: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        }

        function showError(message) {
            const alert = document.getElementById('errorAlert');
            alert.textContent = message;
            alert.className = 'alert alert-error';
            alert.style.display = 'block';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 5000);
        }

        function showSuccess(message) {
            const alert = document.getElementById('successAlert');
            alert.textContent = message;
            alert.className = 'alert alert-success';
            alert.style.display = 'block';
        }

        function resetForm() {
            if (socket) {
                socket.disconnect();
            }
            
            if (sessionId) {
                fetch(`/api/cleanup/${sessionId}`, { method: 'DELETE' });
            }
            
            document.getElementById('formSection').style.display = 'block';
            document.getElementById('statusSection').style.display = 'none';
            document.getElementById('phoneNumber').value = '';
            document.getElementById('startBtn').disabled = false;
            document.getElementById('startBtn').textContent = 'Generate Pairing Code';
            document.getElementById('newSessionBtn').style.display = 'none';
            document.getElementById('successAlert').style.display = 'none';
            document.getElementById('pairingCodeContainer').style.display = 'none';
            document.getElementById('qrContainer').style.display = 'none';
            document.getElementById('statusSpinner').style.display = 'block';
            
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            timeLeft = 30 * 60;
            sessionId = null;
        }

        // Auto-cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (sessionId) {
                fetch(`/api/cleanup/${sessionId}`, { method: 'DELETE' });
            }
        });
    </script>
</body>
</html>
