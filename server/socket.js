const { createRoom, joinRoom, getRoom, leaveRoom, serializeRoomPlayers } = require('./rooms');
const { generateTrack } = require('./mapGenerator');
const { validateRaceLength, getFinishLinePosition } = require('./raceLength');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on('create_room', (data) => {
            const lengthLabel = validateRaceLength(data.raceLength);
            const roomCode = createRoom(socket.id, data.name, lengthLabel);
            socket.join(roomCode);
            socket.emit('room_created', {
                code: roomCode,
                raceLength: lengthLabel
            });
            console.log(`Room ${roomCode} created by ${data.name} with length ${lengthLabel}`);
        });

        socket.on('join_room', (data) => {
            const { code, name } = data;
            const result = joinRoom(code, socket.id, name);

            if (result.error) {
                socket.emit('error', { message: result.error });
            } else {
                socket.join(code);
                // Serialize the Map objects to Plain Objects for network transport (until Client supports full binary Lobby, we keep JSON for lobby)
                const playersObj = serializeRoomPlayers(result.room);

                io.to(code).emit('update_room', {
                    players: playersObj,
                    code: code,
                    raceLength: result.room.raceLength
                });
                console.log(`${name} joined room ${code}`);
            }
        });

        socket.on('start_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                socket.join(code);
                const pixelLength = getFinishLinePosition(room.raceLength);

                // DSA Refactor: Generate Packed Int16Array Map
                const gameMap = generateTrack(pixelLength);
                room.gameState = 'racing';

                // Socket.io automatically encodes TypedArrays as Buffers
                io.to(code).emit('game_started', {
                    gameMap: gameMap, // Binary Buffer on client
                    raceLength: room.raceLength
                });
                console.log(`Game started in room ${code} with length ${room.raceLength}`);
            }
        });

        // DSA REFACTOR: Binary Player Update Handling
        // Expects Buffer with [RoomCode(4bytes), PlayerData...]
        socket.on('player_update', (data) => {
            // Check for Binary Data
            if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
                // Manually extract Room Code (first 4 bytes ASCII) to know where to broadcast
                // This saves sending JSON wrapper
                const codeBuf = data.slice(0, 4);
                const code = codeBuf.toString('utf8');

                // Rate limit (per socket)
                const now = Date.now();
                if (socket.lastUpdate && now - socket.lastUpdate < 30) return;
                socket.lastUpdate = now;

                // Relay buffer to neighbors (Zero-Copy JSON parsing)
                socket.to(code).emit('player_updated', data);
            } else {
                // Fallback for JSON (Backward compatibility if needed, else ignore)
            }
        });

        socket.on('player_won', ({ code, name, x }) => {
            const room = getRoom(code);
            if (!room) return;
            const requiredX = getFinishLinePosition(room.raceLength);
            if (x < requiredX - 50) {
                console.warn(`Suspicious player_won from ${name}: x=${x}`);
                return;
            }
            io.to(code).emit('game_over', { winner: name });
            console.log(`Player ${name} won in room ${code}`);
        });

        socket.on('restart_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                const pixelLength = getFinishLinePosition(room.raceLength);
                const gameMap = generateTrack(pixelLength);

                io.to(code).emit('game_restarted', {
                    gameMap: gameMap,
                    raceLength: room.raceLength
                });
                console.log(`Game restarted in room ${code}`);
            }
        });

        socket.on('disconnecting', () => {
            const rooms = Array.from(socket.rooms);
            rooms.forEach(code => {
                if (code !== socket.id) {
                    const room = getRoom(code);
                    if (room) {
                        const result = leaveRoom(socket.id);
                        if (result.code) {
                            // Serialize Map -> Object
                            const playersObj = serializeRoomPlayers(room);
                            io.to(result.code).emit('update_room', {
                                players: playersObj,
                                code: result.code,
                                raceLength: room.raceLength
                            });
                        }
                    }
                }
            });
        });

        socket.on('disconnect', () => {
            console.log(`User Disconnected: ${socket.id}`);
            leaveRoom(socket.id);
        });
    });
};
