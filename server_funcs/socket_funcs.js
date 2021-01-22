const GameLogic = require("../server_logic/game_logic_func");

async function joinGameRoom(io, socket, gameID) {
    console.log('join game room event id: ' + gameID);
    console.log(socket.handshake.session);
    let g = await GameLogic.getGame(gameID, socket.handshake.session);

    if (g) {
        socket.join(gameID.toString());
        socket.emit('gotGame', g);
        emitYourTurn(io, socket, gameID, g);
    } else {
        socket.emit('msg', createServerMsg('Cant join game: ' + gameID));
    }
}

async function joinChat(io, socket, gameID) {
    console.log('join chat event id: ' + gameID);
    console.log(socket.handshake.session);
    let g = await GameLogic.getGame(gameID, socket.handshake.session);

    if (g) {
        socket.join(gameID.toString());
        io.in(gameID).emit('msg', createServerMsg(socket.handshake.session.username + ' Joined the Chat!'));
    } else {
        socket.emit('msg', createServerMsg('Cant join chat: ' + gameID));
    }
}

async function emitYourTurn(io, socket, gameID, game=undefined) {
    if (!game) {
        let game = await GameLogic.getGame(gameID, socket.handshake.session);
    }

    if (game.blueTurn) {
        socket.emit('yourTurn', game.blueName === socket.handshake.session.username);
    } else {
        socket.emit('yourTurn', game.redName === socket.handshake.session.username);
    }
}

async function takeMove(io, socket, column, gameID) {
    console.log(socket.handshake.session.username + " took move: " + column);
    let g = await GameLogic.postMove(gameID, socket.handshake.session, column);

    if (g) {
        socket.to(gameID).emit('sendMove', column);
    } else {
        socket.emit('msg', createServerMsg('Invalid!'));
    }
}

function sendHover(io, socket, column, gameID) {
    socket.to(gameID).emit('receiveHover', column);
}

async function forfeit(io, socket, gameID) {
    let g = await GameLogic.getGame(gameID, socket.handshake.session);
    if (g) {
        if (socket.handshake.session.username === g.redName || socket.handshake.session.username === g.blueName) {
            await GameLogic.forfeitGame(gameID, socket.handshake.session);
            io.to(gameID).emit('receiveForfeit', g.winner);
            io.to(gameID).emit('msg', createServerMsg(socket.handshake.session.username + ' has forfeited!'));
        } else {
            socket.emit('msg', createServerMsg('You are not a player'));
        }
    } else {
        socket.emit('msg', createServerMsg('Invalid game'));
    }
}

async function sendMsg(io, socket, msg, gameID) {
    console.log('send msg event msg: ' + msg + ' ' + gameID);
    let g = await GameLogic.postChatToGame(gameID, msg, socket.handshake.session);
    if (g) {
        io.in(gameID).emit('msg', createMsg(socket.handshake.session.username, msg));
    }
}

function createServerMsg(msg) {
    return {"username":'server', "msg": msg};
}

function createMsg(user, msg) {
    return {"username": user, "msg": msg};
}

module.exports = {joinGameRoom, joinChat, takeMove, sendHover, sendMsg, forfeit};