const express = require("express")
const fs = require("fs")
const path = require("path")
const pino = require("pino")
const NodeCache = require("node-cache")
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("baileys")

const app = express()
app.use(express.json())
app.use(express.static(__dirname))

const sessionDir = path.join(__dirname, "session")
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir)

let sock

async function startPairing(number, res) {
  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)

  sock = makeWASocket({
    logger: pino({ level: "silent" }),
    version,
    auth: state,
    printQRInTerminal: false,
    msgRetryCounterCache: new NodeCache()
  })

  sock.ev.on("creds.update", saveCreds)

  if (!state.creds.registered) {
    setTimeout(async () => {
      const code = await sock.requestPairingCode(number)
      res.json({ code: code.match(/.{1,4}/g).join("-") })
    }, 2000)
  }

  sock.ev.on("connection.update", async ({ connection }) => {
    if (connection === "open") {
      const credsPath = path.join(sessionDir, "creds.json")
      const creds = fs.readFileSync(credsPath, "utf8")

      await sock.sendMessage(
        number + "@s.whatsapp.net",
        { text: `✅ *Your WhatsApp Session*\n\n\`\`\`${creds}\`\`\`` }
      )

      // cleanup
      fs.rmSync(sessionDir, { recursive: true, force: true })
      sock.logout()
    }
  })
}

app.post("/pair", async (req, res) => {
  const number = req.body.number?.replace(/\D/g, "")
  if (!number) return res.json({ error: "Invalid number" })

  startPairing(number, res)
})

app.listen(3000, () => {
  console.log("Session Generator running on http://localhost:3000")
})
