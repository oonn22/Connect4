import {drawBoard, drawHoverPeice, takeTurn, mouseEvent, replay, displayWinner} from "/javascript/canvas_interaction.js";

let gamePage = document.getElementById("game_page");
let gameCanvas = document.getElementById("game_canvas");
let replayGameBtn = document.getElementById("replay_game_btn");
let forfeitBtn = document.getElementById("forfeit_btn");
let shareBtn = document.getElementById("share_btn");
let turnHeader = document.getElementById("turn_header");

const socket = io();
let GAMEID;
let thisGame;
let yourTurn;

socket.on('gotGame', (game) => {
    thisGame = game;
    replayGameClick(thisGame);
});

socket.on('sendMove', (column) => {
    takeTurn(column, thisGame);
    yourTurn = true;
    if (thisGame.winner === -1) {
        if (thisGame.blueTurn) {
            turnHeader.className = "center_text blue_player";
            turnHeader.innerText = thisGame.blueName + "'s turn";
        } else {
            turnHeader.className = "center_text red_player";
            turnHeader.innerText = thisGame.redName + "'s turn";
        }
    } else {
        turnHeader.innerText = '';
    }
    enableGameInputs();
});

socket.on('receiveHover', (column) => {
    drawHoverPeice(column, thisGame);
});

socket.on('receiveForfeit', (winner) => {
    thisGame.winner = winner;
    thisGame.history.push(-2);
    displayWinner(thisGame);
    disableGameInputs(true);
});

socket.on('yourTurn', (bool) => {
    yourTurn = bool;
    if (bool) {
        enableGameInputs();
    } else {
        (thisGame.winner === -1) ? disableGameInputs() : disableGameInputs(true);
    }
});

function forfeitClick() {
    if (thisGame.winner === -1) {
        let x = confirm("Are you sure you want to forfeit?");

        if (x) {
            socket.emit('forfeit', GAMEID);
        }
    } else {
        alert('Game Already Over')
    }
}
function shareClick() {
    if (thisGame.privacy === -1) {
        alert('This game is private! cannot share it.')
    } else {
        let msg = 'Successfully copied link!';
        if (thisGame.privacy === 0) {
            msg += ' This game is friends only, so only friends can open this link.';
        }

        let dummy = document.createElement('input');
        let text = window.location.href;

        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        alert(msg);
    }
}


let replayGameClick = function(g) {
    disableGameInputs();
    replay(g);
    drawBoard(g.board);
    console.log(g.winner);
    if (g.winner === -1) {
        setTimeout(enableGameInputs, g.history.length * 500);
    } else {
        setTimeout(() => {disableGameInputs(true); replayGameBtn.disabled = false}, g.history.length * 500);
    }
}

let canvasMouseMove = function(e) {
    let column = mouseEvent(e, drawHoverPeice, thisGame);
    socket.emit('sendHover', column, GAMEID);
}

let canvasMouseDown = function(e) {
    let column = mouseEvent(e, takeTurn, thisGame);
    canvasMouseLeave();
    socket.emit('takeMove', column, GAMEID);

    if (thisGame.winner === -1) {
        yourTurn = false;
        disableGameInputs();
        if (thisGame.blueTurn) {
            turnHeader.className = "center_text blue_player";
            turnHeader.innerText = thisGame.blueName + "'s turn";
        } else {
            turnHeader.className = "center_text red_player";
            turnHeader.innerText = thisGame.redName + "'s turn";
        }
    } else {
        yourTurn = true;
        disableGameInputs(true);
        turnHeader.innerText = '';
    }

}

let canvasMouseLeave = function() {
    drawHoverPeice(-1, thisGame);
    socket.emit('sendHover', -1, GAMEID);
}

function disableGameInputs(skipReplay=false) {
    drawHoverPeice(-1, thisGame);
    gameCanvas.removeEventListener('mousemove', canvasMouseMove, true);
    gameCanvas.removeEventListener('mousedown', canvasMouseDown, true);
    gameCanvas.removeEventListener('mouseleave', canvasMouseLeave, true);
    forfeitBtn.disabled = true;
    if (!skipReplay) {
        replayGameBtn.disabled = true;
    }
}

function enableGameInputs() {
    if (yourTurn) {
        gameCanvas.addEventListener('mousemove', canvasMouseMove, true);
        gameCanvas.addEventListener('mousedown', canvasMouseDown, true);
        gameCanvas.addEventListener('mouseleave', canvasMouseLeave, true);
        forfeitBtn.disabled = false;
    }
    replayGameBtn.disabled = false;
}


let URLparams = new URLSearchParams(window.location.search);

if (URLparams.has('gameid')) {
    GAMEID = URLparams.get('gameid');
} else {
    GAMEID = '';
}

socket.emit('joinGameRoom', GAMEID);
forfeitBtn.style.display = 'inline-block';

replayGameBtn.addEventListener('click', () => {replayGameClick(thisGame)});
shareBtn.addEventListener('click', () => {shareClick()});
forfeitBtn.addEventListener('click', () => {forfeitClick()});