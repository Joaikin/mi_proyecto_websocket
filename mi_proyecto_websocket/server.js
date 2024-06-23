const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const players = [];
let currentPlayer = 0;
let playerChips = [3, 3, 3]; // Fichas iniciales para 3 jugadores

wss.on('listening', () => {
    console.log('Servidor WebSocket escuchando en el puerto 8080');
});

wss.on('connection', function connection(ws) {
    console.log('Cliente conectado');

    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);
            console.log('Mensaje recibido del cliente:', data);

            switch (data.type) {
                case 'joinGame':
                    const playerName = data.playerName || "Jugador " + (players.length + 1);
                    players.push({ name: playerName, ws });
                    sendGameStateToAll(); // Enviar estado inicial a todos los jugadores
                    break;

                case 'rollDice':
                    playerChips = data.playerChips;
                    currentPlayer = data.currentPlayer;
                    // Lógica para manejar el lanzamiento de dados (actualizar playerChips según los resultados)
                    // ... (puedes agregar tu lógica aquí)

                    sendGameStateToAll(); // Enviar el estado actualizado a todos los jugadores
                    break;

                case 'passTurn':
                    currentPlayer = (currentPlayer + 1) % players.length;
                    sendGameStateToAll(); // Enviar el estado actualizado a todos los jugadores
                    break;

                default:
                    console.log('Mensaje desconocido:', data.type);
            }
        } catch (error) {
            console.error('Error al procesar el mensaje:', error);
        }
    });
});

function sendGameStateToAll() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'updateGameState',
                numPlayers: players.length,
                currentPlayer,
                playerChips,
                players: players.map(player => player.name)
            }));
        }
    });
}
