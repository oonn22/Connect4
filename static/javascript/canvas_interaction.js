import {Connect4Data, Connect4Funcs} from "./connect4_client_module.js";

const gameFuncs = new Connect4Funcs();

let boardColour = "#1F2933";
let holeColour = "#323F4B";
let redColour = "#b30000";
let blueColour = "#0000b3";
let holeWidth = 84;
let holeWidthBuffer = 5;
let holeHeight = 71;
let holeHeightBuffer = 8;
let boardWidth = 640;
let boardHeight = 580;
let canvas = document.getElementById("game_canvas");
let ctx = canvas.getContext("2d");

function drawBoard(board) {
    ctx.fillStyle = boardColour;
    ctx.fillRect(0, 0, boardWidth, boardHeight);

    let i;
    let j;
    let initX = 11;
    let initY = 491;

    ctx.fillStyle = holeColour;
    for (i = 0; i < 7; i++) {
        let x = initX + (i * (holeWidth + holeWidthBuffer));
        for (j = 0; j < 6; j++) {
            if (board[i][j] === 1) {
                ctx.fillStyle = redColour;
            } else if (board[i][j] === 0) {
                ctx.fillStyle = blueColour;
            } else {
                ctx.fillStyle = holeColour;
            }
            let y = initY - (j * (holeHeight + holeHeightBuffer));
            ctx.fillRect(x, y, holeWidth, holeHeight);
        }
    }
}

//arg blueTurn is if you want to specify a specific drawing
function drawHoverPeice(column, g) {
    if (g.winner === -1) {
        let i;
        let fillColour;
        let initX = 11;
        let initY = 10;

        for (i = 0; i < 7; i++) {
            if (i === column) {
                if (g.blueTurn) {
                    fillColour = blueColour;
                } else {
                    fillColour = redColour;
                }
            } else {
                fillColour = boardColour;
            }

            let x = initX + (i * (holeWidth + holeWidthBuffer));
            ctx.fillStyle = fillColour;
            ctx.fillRect(x, initY, holeWidth, holeHeight);
        }
    }
}

function takeTurn(column, g) {
    if (column >= 0 && g.winner === -1) {
        gameFuncs.takeMove(g, column);
        drawBoard(g.board);

        if (g.winner === 0) {
            displayWinner(g)

        } else if (g.winner === 1) {
            displayWinner(g);
        }
    } else if (column === -2) {
        if (g.blueTurn) {
            g.winner = 1;
            displayWinner(g)
        } else {
            g.winner = 0;
            displayWinner(g)
        }
    }
}

function displayWinner(g) {
    ctx.font = "30px impact";
    ctx.textAlign = "center";
    if (g.winner == 0) {
        ctx.fillStyle = blueColour;
        ctx.fillText(g.blueName + " Wins", canvas.width / 2, 84 / 2);

    } else {
        ctx.fillStyle = redColour;
        ctx.fillText(g.redName + " Wins", canvas.width / 2, 84 / 2);
    }
}

// passes the appropriate column to or callback function
// once we have our x position
function doForColumn(xAxis, callback, arg1) {
    if (xAxis <= 91) {
        callback(0, arg1);
        return 0;
    } else if (xAxis <= 182) {
        callback(1, arg1);
        return 1;
    } else if (xAxis <= 273) {
        callback(2, arg1);
        return 2;
    } else if (xAxis <= 364) {
        callback(3, arg1);
        return 3;
    } else if (xAxis <= 455) {
        callback(4, arg1);
        return 4;
    } else if (xAxis <= 546) {
        callback(5, arg1);
        return 5;
    } else {
        callback(6, arg1);
        return 6
    }
}

// all our interactions with game need the column of the mouse
// so this calculates the x position on the canvas, and then do what
// ever function we need once we have that info. arg1 is optional.
function mouseEvent(e, func, arg1) {
    let x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    return doForColumn(x, func, arg1);
}

// test function for later being able to replay a game from its history
function replay(g) {
    let gTemp = new Connect4Data(g.id, g.blueName, g.redName, 1);
    let i = 0;
    let timer = 0;
    while (i < g.history.length) {
        let column = g.history[i];
        setTimeout(function(){takeTurn(column, gTemp)}, timer);
        timer += 500;
        i++;
    }
}

export {displayWinner, drawBoard, mouseEvent, drawHoverPeice, takeTurn, replay};
