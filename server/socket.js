const { createRoom, joinRoom, getRoom } = require('./rooms');
const { generateTrack } = require('./mapGenerator');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User Connected: ${socket.id}`);

        socket.on('create_room', (data) => {
            const roomCode = createRoom(socket.id, data.name);
            socket.join(roomCode);
            socket.emit('room_created', { code: roomCode });
            console.log(`Room ${roomCode} created by ${data.name}`);
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
                    code: code
                });
                console.log(`${name} joined room ${code}`);
            }
        });

        socket.on('start_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                // Generate consistent map for everyone
                const gameMap = generateTrack(5000); // 5000px length for now
                room.gameState = 'racing';

                io.to(code).emit('game_started', {
                    gameMap: gameMap
                });
                console.log(`Game started in room ${code} with map`);
            }
        });

        socket.on('player_update', ({ code, playerState }) => {
            // Broadcast to everyone else in the room
            // socket.to(code) excludes the sender
            socket.to(code).emit('player_updated', playerState);
        });

        socket.on('restart_game', ({ code }) => {
            const room = getRoom(code);
            if (room) {
                // Reset Players
                Object.values(room.players).forEach(p => {
                    // We don't track physics on server, so just notify clients to reset
                });

                // Generate New Map
                const gameMap = generateTrack(5000);

                io.to(code).emit('game_restarted', {
                    gameMap: gameMap
                });
                console.log(`Game restarted in room ${code}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User Disconnected: ${socket.id}`);
            // Todo: Handle cleanup if needed
        });
    });
};
