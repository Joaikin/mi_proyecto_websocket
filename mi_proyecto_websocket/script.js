// Conexión WebSocket
const webSocket = new WebSocket("ws://localhost:8080"); // Reemplaza con la URL de tu servidor

webSocket.onopen = function (event) {
    console.log("Conexión WebSocket establecida");

    // Crear elementos del DOM para el ingreso del nombre del jugador
    gameArea = document.getElementById('game-area');
    const nameInputArea = document.createElement('div');
    nameInputArea.id = 'name-input-area';
    playerNameInput = document.createElement('input');
    playerNameInput.type = 'text';
    playerNameInput.id = 'player-name';
    playerNameInput.placeholder = 'Ingresa tu nombre';
    joinGameButton = document.createElement('button');
    joinGameButton.textContent = 'Unirse al juego';

    // Agregar elementos al DOM
    nameInputArea.appendChild(playerNameInput);
    nameInputArea.appendChild(joinGameButton);
    gameArea.appendChild(nameInputArea);

    // Inicializar variables de elementos del DOM
    diceContainer = null;
    chipsContainer = null;
    rollButton = null;
    passButton = null;
    messageArea = null;
    currentPlayerDisplay = null;

    joinGameButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            webSocket.send(JSON.stringify({ type: 'joinGame', playerName }));
            document.getElementById('name-input-area').style.display = 'none';
        } else {
            alert("Por favor, ingresa un nombre válido.");
        }
    });
};

webSocket.onmessage = function (event) {
    const message = JSON.parse(event.data);
    console.log("Mensaje recibido del servidor:", message);
    handleMessage(message);
};

// Variables del juego
let numPlayers;
let currentPlayer;
let playerChips;
let gameStarted = false;
let gameOver = false;
let players = [];

// Funciones del juego

function initializeGame(initialData) {
    numPlayers = initialData.numPlayers;
    currentPlayer = initialData.currentPlayer;
    playerChips = initialData.playerChips;
    players = initialData.players;

    // Crear elementos del DOM para el juego (dados, fichas, etc.) SOLO si aún no existen
    if (!diceContainer) {
        diceContainer = document.createElement('div');
        diceContainer.id = 'dice-container';
        chipsContainer = document.createElement('div');
        chipsContainer.id = 'chips-container';
        rollButton = document.createElement('button');
        rollButton.textContent = 'Lanzar Dados';
        rollButton.disabled = true;
        passButton = document.createElement('button');
        passButton.textContent = 'Pasar Turno';
        passButton.disabled = true;
        messageArea = document.createElement('div');
        messageArea.id = 'message-area';
        currentPlayerDisplay = document.createElement('div');
        currentPlayerDisplay.id = 'current-player-display';

        // Agregar elementos al DOM
        gameArea.appendChild(diceContainer);
        gameArea.appendChild(chipsContainer);
        gameArea.appendChild(rollButton);
        gameArea.appendChild(passButton);
        gameArea.appendChild(messageArea);
        gameArea.appendChild(currentPlayerDisplay);

        // Event listeners de los botones
        rollButton.addEventListener('click', () => {
            const diceResults = rollDice();
            webSocket.send(JSON.stringify({
                type: 'rollDice',
                results: diceResults,
                playerChips,
                currentPlayer
            }));
            updateUI(diceResults); // Pasar los resultados a updateUI
        });

        passButton.addEventListener('click', passTurn);
    }

    startGame();
}

function startGame() {
    gameStarted = true;
    rollButton.disabled = currentPlayer !== 0; // Solo el primer jugador puede lanzar al inicio
    passButton.disabled = true;
    updateUI();
}

function rollDice() {
    const diceResults = [];
    for (let i = 0; i < playerChips[currentPlayer]; i++) {
        const roll = Math.floor(Math.random() * 6) + 1; // 1-6
        switch (roll) {
            case 1: // Izquierda
                diceResults.push("L");
                playerChips[currentPlayer]--;
                playerChips[(currentPlayer + 1) % numPlayers]++;
                break;
            case 2: // Centro
            case 3:
                diceResults.push("C");
                playerChips[currentPlayer]--;
                break;
            case 4: // Derecha
            case 5:
                diceResults.push("R");
                playerChips[currentPlayer]--;
                playerChips[(currentPlayer - 1 + numPlayers) % numPlayers]++; // Asegura que el índice sea válido
                break;
            case 6: // Punto
                diceResults.push(".");
                break;
        }
    }
    return diceResults;
}

function updateUI(diceResults = null) { // Parámetro opcional diceResults
    diceContainer.innerHTML = '';
    chipsContainer.innerHTML = '';

    // Mostrar resultados de los dados (si existen)
    if (diceContainer && diceResults) { // Verificar si diceResults existe
        diceResults.forEach(result => {
            const diceElement = document.createElement('div');
            diceElement.classList.add('dice');
            diceElement.textContent = result;
            diceContainer.appendChild(diceElement);
        });
    }

    // Mostrar fichas de cada jugador
    for (let i = 0; i < numPlayers; i++) {
        const playerChipsElement = document.createElement('div');
        playerChipsElement.textContent = `${players[i]}: ${playerChips[i]} fichas`;
        chipsContainer.appendChild(playerChipsElement);
    }

    // Mostrar jugador actual
    currentPlayerDisplay.textContent = `Jugador actual: ${players[currentPlayer]}`;

    // Mensaje de turno (opcional)
    if (gameStarted && !gameOver) {
        messageArea.textContent = `Turno de ${players[currentPlayer]}`;
    }
}

function passTurn() {
    currentPlayer = (currentPlayer + 1) % numPlayers;
    passButton.disabled = true;
    rollButton.disabled = false;
    updateUI();
    webSocket.send(JSON.stringify({ type: 'passTurn', currentPlayer }));
}

function checkWinner() {
    const playersWithChips = playerChips.filter(chips => chips > 0);
    if (playersWithChips.length === 1) {
        gameOver = true;
        rollButton.disabled = true;
        passButton.disabled = true;
        messageArea.textContent = `¡${players[playerChips.indexOf(playersWithChips[0])]} gana!`;
    }
}

function handleMessage(message) {
    switch (message.type) {
        case 'updateGameState':
            initializeGame(message);
            break;
        case 'rollDice':
            playerChips = message.playerChips;
            currentPlayer = message.currentPlayer;
            updateUI(message.results); // Pasar los resultados a updateUI
            checkWinner();
            break;
        case 'passTurn':
            currentPlayer = message.currentPlayer;
            updateUI();
            break;
    }
}
