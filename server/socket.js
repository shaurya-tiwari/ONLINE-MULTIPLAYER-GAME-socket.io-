const { createRoom, joinRoom, getRoom, leaveRoom, serializeRoomPlayers } = require('./rooms');
const { generateTrack } = require('./mapGenerator');
const { validateRaceLength, getFinishLinePosition } = require('./raceLength');
const worldManager = require('./worldState');
const CompetitiveManager = require('./competitive/CompetitiveManager');
const PlayerRegistry = require('./competitive/PlayerRegistry');

// GLOBAL BROADCAST LOOP (30ms = ~33 FPS)
// One loop for all rooms to minimize CPU overhead on VPS
let globalIo = null;
setInterval(() => {
    if (!globalIo) return;
    // We iterate through all known rooms from the worldManager (active racing rooms)
    const activeRoomCodes = worldManager.getActiveRoomCodes();
    activeRoomCodes.forEach(code => {
        const snapshot = worldManager.getRoomSnapshot(code);
        if (snapshot) {
            globalIo.to(code).emit('player_updated', snapshot);
        }
    });
}, 30);

module.exports = (io) => {
    globalIo = io;
    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on('create_room', (data) => {
            const lengthLabel = validateRaceLength(data.raceLength);
            const roomCode = createRoom(socket.id, data.name, lengthLabel);

            // Explicitly join the room
            socket.join(roomCode);

            const room = getRoom(roomCode);
            const playersObj = serializeRoomPlayers(room);

            socket.emit('room_created', {
                code: roomCode,
                raceLength: lengthLabel,
                players: playersObj // Send initial list to host
            });
            console.log(`Room ${roomCode} created by ${data.name} (${socket.id})`);
        });

        socket.on('join_room', (data) => {
            const { code, name } = data;
            const result = joinRoom(code, socket.id, name);

            if (result.error) {
                console.log(`Join Error in ${code} for ${name}: ${result.error}`);
                socket.emit('error', { message: result.error });
            } else {
                socket.join(code);

                const playersObj = serializeRoomPlayers(result.room);

                // Broadcast to everyone in the room (including host and joining player)
                io.to(code).emit('update_room', {
                    players: playersObj,
                    code: code,
                    raceLength: result.room.raceLength
                });

                // HOST FIX: Explicitly update the host to ensure they see the new player immediately
                if (result.room.host && result.room.host !== socket.id) {
                    io.to(result.room.host).emit('update_room', {
                        players: playersObj,
                        code: code,
                        raceLength: result.room.raceLength
                    });
                }
                console.log(`${name} (${socket.id}) joined room ${code}. Total players: ${result.room.players.size}`);
            }
        });

        socket.on('leave_room', ({ code }) => {
            console.log(`User ${socket.id} requested to leave room ${code}`);
            leaveRoom(socket.id);
            socket.leave(code);
            worldManager.removePlayer(code, socket.id);

            const room = getRoom(code);
            if (room) {
                PlayerRegistry.forceCleanup(socket.id, code, null, worldManager, io);

                const playersObj = serializeRoomPlayers(room);
                io.to(code).emit('update_room', {
                    players: playersObj,
                    code: code,
                    raceLength: room.raceLength
                });
            }
        });

        socket.on('start_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                socket.join(code);

                // Use CompetitiveManager for consistent map generation
                const gameMap = CompetitiveManager.ensureMapConsistency(room, generateTrack);
                room.gameState = 'racing';

                // Socket.io automatically encodes TypedArrays as Buffers
                io.to(code).emit('game_started', {
                    gameMap: gameMap, // Binary Buffer on client
                    raceLength: room.raceLength
                });
                console.log(`Game started in room ${code} with length ${room.raceLength}`);
            }
        });

        // DSA REFACTOR: Binary Player Update (Cache only, no relay)
        socket.on('player_update', (data) => {
            if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
                const code = data.slice(0, 4).toString('utf8');

                // Store the player update (strip room code from individual packet for snapshot)
                const playerPayload = data.slice(4);
                worldManager.updatePlayerState(code, socket.id, playerPayload);
            }
        });

        socket.on('player_won', ({ code, name, x }) => {
            const room = getRoom(code);
            if (!room) return;

            // Use CompetitiveManager to handle Atomic Win locking and validation
            const result = CompetitiveManager.trySetWinner(room, name, x);

            if (result.success) {
                // Reset state so new players can join
                room.gameState = 'lobby';
                worldManager.clearRoom(code); // Clean up snapshots for race end
                io.to(code).emit('game_over', { winner: name });
                console.log(`Player ${name} won in room ${code}. Winner locked: ${name}`);
            } else {
                console.log(`[Competitive] Rejected win for ${name}: ${result.reason}`);
            }
        });

        socket.on('restart_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                // Security: Only host can restart
                if (room.host !== socket.id) {
                    console.log(`[Competitive] Rejected restart in ${code}: Non-host ${socket.id} attempted restart`);
                    return;
                }

                CompetitiveManager.resetRoomState(room);
                const gameMap = CompetitiveManager.ensureMapConsistency(room, generateTrack);
                room.gameState = 'racing'; // Set back to racing so others can't join and physics works

                worldManager.clearRoom(code); // Reset states for new run
                io.to(code).emit('game_restarted', {
                    gameMap: gameMap,
                    raceLength: room.raceLength
                });
                console.log(`Game restarted in room ${code} by host ${socket.id}`);
            }
        });

        socket.on('disconnecting', () => {
            const rooms = Array.from(socket.rooms);
            rooms.forEach(code => {
                if (code !== socket.id) {
                    const room = getRoom(code);
                    if (room) {
                        PlayerRegistry.forceCleanup(socket.id, code, null, worldManager, io);

                        const result = leaveRoom(socket.id);
                        if (result.code) {
                            // If only host left, reset to lobby
                            if (room.players.size === 1 && room.gameState === 'racing') {
                                room.gameState = 'lobby';
                                console.log(`Resetting room ${code} to lobby because only host remains`);
                            }

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
