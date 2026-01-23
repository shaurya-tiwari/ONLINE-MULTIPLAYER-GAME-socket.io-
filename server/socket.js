const { createRoom, joinRoom, getRoom, leaveRoom } = require('./rooms');
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
                // Notify everyone in the room (including sender) about the new state
                io.to(code).emit('update_room', {
                    players: result.room.players,
                    code: code,
                    raceLength: result.room.raceLength
                });
                console.log(`${name} joined room ${code}`);
            }
        });

        socket.on('start_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                // Ensure the starter (Host) is actually in the socket room (fix for reconnects)
                socket.join(code);

                // Get finish line position based on selected length
                const pixelLength = getFinishLinePosition(room.raceLength);

                // Generate consistent map for everyone
                const gameMap = generateTrack(pixelLength);
                room.gameState = 'racing';

                io.to(code).emit('game_started', {
                    gameMap: gameMap,
                    raceLength: room.raceLength
                });
                console.log(`Game started in room ${code} with length ${room.raceLength}`);
            }
        });

        socket.on('player_update', ({ code, playerState }) => {
            // Basic rate limiting: Only allow ~30 updates per second per socket
            const now = Date.now();
            if (socket.lastUpdate && now - socket.lastUpdate < 30) return;
            socket.lastUpdate = now;

            // Broadcast to everyone else in the room
            socket.to(code).emit('player_updated', playerState);
        });

        socket.on('player_won', ({ code, name, x }) => {
            const room = getRoom(code);
            if (!room) return;

            // Anti-Cheat: Validate finish line position
            const requiredX = getFinishLinePosition(room.raceLength);
            if (x < requiredX - 50) {
                console.warn(`Suspicious player_won from ${name}: x=${x} vs required=${requiredX}`);
                return;
            }

            // Broadcast to EVERYONE in the room (including sender) that game is over
            io.to(code).emit('game_over', { winner: name });
            console.log(`Player ${name} won in room ${code}`);
        });

        socket.on('restart_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                // Generate New Map
                const pixelLength = getFinishLinePosition(room.raceLength);
                const gameMap = generateTrack(pixelLength);

                io.to(code).emit('game_restarted', {
                    gameMap: gameMap,
                    raceLength: room.raceLength
                });
                console.log(`Game restarted in room ${code} with length ${room.raceLength}`);
            }
        });

        socket.on('disconnecting', () => {
            // Check all rooms the socket is in
            const rooms = Array.from(socket.rooms);
            rooms.forEach(code => {
                if (code !== socket.id) {
                    const room = getRoom(code);
                    if (room) {
                        const result = leaveRoom(socket.id);
                        if (result.code) {
                            io.to(result.code).emit('update_room', {
                                players: room.players,
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
            // Backup cleanup in case disconnecting missed something
            leaveRoom(socket.id);
        });
    });
};
