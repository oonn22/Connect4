import {drawBoard, takeTurn, drawHoverPeice, displayWinner, replay} from "/javascript/canvas_interaction.js";

let gamePage = document.getElementById("game_page");
let gameCanvas = document.getElementById("game_canvas");
let replayGameBtn = document.getElementById("replay_game_btn");
let shareBtn = document.getElementById("share_btn");
let turnHeader = document.getElementById("turn_header");

const socket = io();
let GAMEID;
let thisGame;
let hover;

socket.on('gotGame', (game) => {
    thisGame = game;
    replayGameClick(game)
});

socket.on('sendMove', (column) => {
    takeTurn(column, thisGame);
    if (thisGame.blueTurn) {
        turnHeader.className = "center_text blue_player";
        turnHeader.innerText = thisGame.blueName + "'s turn";
    } else {
        turnHeader.className = "center_text red_player";
        turnHeader.innerText = thisGame.redName + "'s turn";
    }
});

socket.on('receiveHover', (column) => {
    if (hover) {
        drawHoverPeice(column, thisGame);
    }
});

socket.on('receiveForfeit', (winner) => {
    thisGame.winner = winner;
    thisGame.history.push(-2);
    displayWinner(thisGame);
});

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
    setTimeout(enableGameInputs, g.history.length * 500);
}

function disableGameInputs() {
    hover = false;
    replayGameBtn.disabled = true;
}

function enableGameInputs() {
    hover = true;
    replayGameBtn.disabled = false;
}

let URLparams = new URLSearchParams(window.location.search);

if (URLparams.has('gameid')) {
    GAMEID = URLparams.get('gameid');
} else {
    GAMEID = '';
}

socket.emit('joinGameRoom', GAMEID);

replayGameBtn.addEventListener('click', function() {replayGameClick(thisGame);});
shareBtn.addEventListener('click', () => {shareClick()});
enableGameInputs();