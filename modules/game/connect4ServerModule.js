class Connect4Data {
    constructor(gameID, blueName, redName, privacy, json=undefined) {
        if (!json) {
            this.blueTurn = false;
            this.gameID = gameID;
            this.blueName = blueName; //0 in our array
            this.redName = redName; //1 in our array
            this.winner = -1; //0 = blue win, 1 = red win
            this.board = Array.from({length: 7}, () => ([-1, -1, -1, -1, -1, -1]));
            this.history = [];
            this.privacy = privacy;
            this.chat = [];
        } else {
            Object.assign(this, JSON.parse(json));
        }
    }
}

class Connect4Funcs {
    constructor() {
    }

    takeMove(connect4data, column) {
        let i;
        for (i = 0; i < 7; i++) {
            if (connect4data.board[column][i] === -1) {
                if (connect4data.blueTurn) {
                    connect4data.board[column][i] = 0;
                } else {
                    connect4data.board[column][i] = 1;
                }
                connect4data.history[connect4data.history.length] = column;
                connect4data.blueTurn = !connect4data.blueTurn;
                this.checkWinner(connect4data, column, i);
                break;
            }
        }
    }

    checkWinner(connect4data, column, row) {
        const TOCHECK = connect4data.board[column][row];
        let foundWinner = false;
        let inARow = 0;
        let i;
        let j;

        //check vertical
        for (i = 0; i < 6; i++) {
            if (connect4data.board[column][i] === TOCHECK) {
                inARow += 1;
            } else {
                inARow = 0;
            }
            if (inARow === 4) {
                foundWinner = true;
                break;
            }
        }

        //check horizontal
        inARow = 0;
        if (!foundWinner) {
            for (i = 0; i < 7; i++) {
                if (connect4data.board[i][row] === TOCHECK) {
                    inARow += 1;
                } else {
                    inARow = 0;
                }
                if (inARow === 4) {
                    foundWinner = true;
                    break;
                }
            }
        }

        //check left diagonal
        inARow = 0;
        if (!foundWinner) {
            i = column;
            j = row;

            while (i !== 0 && j !== 0) {
                i--;
                j--;
            }

            while (i < 7 && j < 6) {
                if (connect4data.board[i][j] === TOCHECK) {
                    inARow += 1;
                } else {
                    inARow = 0;
                }
                if (inARow === 4) {
                    foundWinner = true;
                    break;
                }
                i++;
                j++;
            }

        }

        //check right diagonal
        inARow = 0;
        if (!foundWinner) {
            i = column;
            j = row;

            while (i !== 6 && j !== 0) {
                i++;
                j--;
            }

            while (i >= 0 && j < 6) {
                if (connect4data.board[i][j] === TOCHECK) {
                    inARow += 1;
                } else {
                    inARow = 0;
                }
                if (inARow === 4) {
                    foundWinner = true;
                    break;
                }
                i--;
                j++;
            }
        }

        if (foundWinner) {
            connect4data.winner = TOCHECK;
        }
    }

    addMessage(connect4data, msgObj) {
        if (msgObj.hasOwnProperty("username") && msgObj.hasOwnProperty("text")) {
            connect4data.chat.push(msgObj);
        }
    }
}


module.exports.Connect4Data = Connect4Data;
module.exports.Connect4Funcs = Connect4Funcs;