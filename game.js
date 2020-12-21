game = new Chess();
var socket = io();

var color = "white";
var players;
var roomId;
var play = true;
var user;
var sms;
var me;

var room = document.getElementById("room")
var userName = document.getElementById("userName")
var roomNumber = document.getElementById("roomNumbers")
var button = document.getElementById("button")
var state = document.getElementById('state')
var chat = $('#chat');
var showTyping = $('#showTyping');
var messages = $('#messages');
var chatBox = $("#chatBox");

var connect = function(){
    roomId = room.value;
    user = userName.value;
    if (roomId !== "" && parseInt(roomId) <= 100) {
        room.remove();
        userName.remove();
        roomNumber.innerHTML = "ROOM NUMBER: " + roomId;
        button.remove();
        socket.emit('joined', {roomId, user});
    }    
}

//Send message to server
chatBox.submit(function () {
    //Message to broadcast
    if (user != null) {
        sms = user + ": ";
        sms += chat.val();
        socket.emit('chat message', sms);

        //Append my own message 
        me = "";
        me += chat.val();
        messages.append($('<li class="message recipient-message">').text(me));

        sms = "";
        me = "";
        chat.val("");
    }   

    return false;
});

//recieve message from other player
socket.on("chat message", function (msg) {
    messages.append($('<li class="message sender-message">').text(msg));
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on('full', function (msg) {
    if(roomId == msg)
        window.location.assign(window.location.href+ 'full.html');
});

socket.on('play', function (msg) {
    if (msg == roomId) {
        play = false;
        state.innerHTML = "GAME IN PROGRESS"
    }
    // console.log(msg)
});

socket.on('move', function (msg) {
    if (msg.room == roomId) {
        game.move(msg.move);
        board.position(game.fen());
        console.log("moved")
    }
});

var removeGreySquares = function () {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function (square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var onDragStart = function (source, piece) {
    // do not pick up pieces if the game is over
    // or if it's not that side's turn
    if (game.game_over() === true || play ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white') ) {
            return false;
    }
    // console.log({play, players});
};

var onDrop = function (source, target) {
    removeGreySquares();

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
    if (game.game_over()) {
        state.innerHTML = 'GAME OVER';
        socket.emit('gameOver', roomId)
    }

    // illegal move
    if (move === null) return 'snapback';
    else
        socket.emit('move', { move: move, board: game.fen(), room: roomId });

};

var onMouseoverSquare = function (square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function (square, piece) {
    removeGreySquares();
};

var onSnapEnd = function () {
    board.position(game.fen());
};


socket.on('player', (msg) => {
    var plna = document.getElementById('player')
    color = msg.color;

    plna.innerHTML = msg.userName.bold() + " : " + color;
    players = msg.players;

    if(players == 2){
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "GAME IN PROGRESS"
    }
    else
        state.innerHTML = "Waiting for second player...";


    var cfg = {
        orientation: color,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    board = ChessBoard('board', cfg);
});
// console.log(color)

var board;
