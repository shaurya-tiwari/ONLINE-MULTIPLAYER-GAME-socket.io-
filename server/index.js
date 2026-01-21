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
        origin: "*",   // Render and production 
        methods: ["GET", "POST"]
    }
});

socketHandler(io);

// 🔥 Render ke liye dynamic port
const PORT = process.env.PORT || 3000;

/* ===============================
   FRONTEND SERVE SECTION
================================ */

app.use(express.static(path.join(__dirname, "../client/dist")));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});
/* =============================== */

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
