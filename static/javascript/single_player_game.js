import {Connect4Data} from "/javascript/connect4_client_module.js";
import {drawBoard, drawHoverPeice, takeTurn, mouseEvent, replay} from "/javascript/canvas_interaction.js";

let gamePage = document.getElementById("game_page");
let gameCanvas = document.getElementById("game_canvas");
let restartGameBtn = document.getElementById("restart_game_btn");
let replayGameBtn = document.getElementById("replay_game_btn");

let game = new Connect4Data("0000", "Blue", "Red", 1);

let restartGameClick = function() {
    game = new Connect4Data("0000", "Blue", "Red", 1);
    drawBoard(game.board);
}

let replayGameClick = function(g) {
    disableGameInputs();
    replay(g);
    drawBoard(g.board);
    setTimeout(enableGameInputs, g.history.length * 500);
}

let canvasMouseMove = function(e) {
    mouseEvent(e, drawHoverPeice, game);
}
let canvasMouseDown = function(e) {
    mouseEvent(e, takeTurn, game);
    mouseEvent(e, drawHoverPeice, game);
}
let canvasMouseLeave = function() {
    drawHoverPeice(-1, game);
}

function disableGameInputs() {
    drawHoverPeice(-1, game);
    gameCanvas.removeEventListener('mousemove', canvasMouseMove, true);
    gameCanvas.removeEventListener('mousedown', canvasMouseDown, true);
    gameCanvas.removeEventListener('mouseleave', canvasMouseLeave, true);
    restartGameBtn.disabled = true;;
    replayGameBtn.disabled = true;
}

function enableGameInputs() {
    gameCanvas.addEventListener('mousemove', canvasMouseMove, true);
    gameCanvas.addEventListener('mousedown', canvasMouseDown, true);
    gameCanvas.addEventListener('mouseleave', canvasMouseLeave, true);
    restartGameBtn.disabled = false;
    replayGameBtn.disabled = false;
}

restartGameBtn.addEventListener('click', restartGameClick, true);
replayGameBtn.addEventListener('click', function() {replayGameClick(game);});

drawBoard(game.board);
enableGameInputs();