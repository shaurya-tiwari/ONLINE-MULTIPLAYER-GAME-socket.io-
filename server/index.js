const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const socketHandler = require('./socket');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ["websocket"],     // force pure websocket
    pingInterval: 10000,
    pingTimeout: 5000,
    perMessageDeflate: false       // disable compression = faster
});

socketHandler(io);

// 🔥 Render ke liye dynamic port
const PORT = process.env.PORT || 3000;

/* ===============================
FRONTEND SERVE SECTION
================================ */

// PRO CONFIG: Long-term browser caching for static assets
const cacheOptions = {
    maxAge: '1y',
    immutable: true,
    public: true
};
app.use(express.static(path.join(__dirname, "../client/dist"), cacheOptions));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});
/* =============================== */

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
