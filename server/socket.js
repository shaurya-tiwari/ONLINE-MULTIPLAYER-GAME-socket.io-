const { createRoom, joinRoom, getRoom } = require('./rooms');
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
            // Broadcast to everyone else in the room
            // socket.to(code) excludes the sender
            socket.to(code).emit('player_updated', playerState);
        });

        socket.on('player_won', ({ code, name }) => {
            // Broadcast to EVERYONE in the room (including sender) that game is over
            io.to(code).emit('game_over', { winner: name });
            console.log(`Player ${name} won in room ${code}`);
        });

        socket.on('restart_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                // Reset Players
                Object.values(room.players).forEach(p => {
                    // We don't track physics on server, so just notify clients to reset
                });

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

        socket.on('disconnect', () => {
            console.log(`User Disconnected: ${socket.id}`);
            // Todo: Handle cleanup if needed
        });
    });
};
