const UserLogic = require("./user_logic_func.js");
const UF = require("../modules/user/serverUserFunc.js");
const UserFuncs = new UF();
const GameData = require("../modules/game/connect4ServerModule.js").Connect4Data;
const GF = require("../modules/game/connect4ServerModule.js").Connect4Funcs;
const GameFuncs = new GF();
const GameModel = require('../Mongoose/GameModel.js');
const LfgModel = require('../Mongoose/LfgModel.js');

/*
Game FUNCTIONS
these are functions that are related to the games being played.These functions will only take what necessary to update
the games for the clients as most of the actual playing is done on the client side.
 */


function validGameRequest(gameRequest) {
    return gameRequest.hasOwnProperty("username") && gameRequest.hasOwnProperty("privacy");
}

async function filterGames(games, userRequesting) {
    let filteredGames = []

    for (let i in games) {
        let gameId = games[i]
        let g = await getGame(gameId, userRequesting);

        if (g) {
            filteredGames.push(gameId);
        }
    }

    return filteredGames;
}

//creates a game and returns it
function createGame(redUsername, blueUsername, privacy) {
    let g = new GameModel({redName: redUsername, blueName: blueUsername, privacy: privacy});
    updateGame(g);
    return g;

}

function updateGame(game) {
    game.save((err, game) => {
        if (err)
            console.log(err);
    })
}

async function createGameRequest(requestingUser, username, privacy) {
    if (await UserLogic.authorizedUser(requestingUser) && await UserLogic.existingUsername(username)) {
        let gameRequest = {username: requestingUser.username, privacy: privacy};
        let opp = await UserLogic.getUserByServer(username);

        if (!UserFuncs.hasGameRequest(opp, gameRequest)) {
            await addGameRequest(requestingUser, username, gameRequest);
            return gameRequest;
        }
    }
    return null;
}

//returns a game if one is found, true if user has been added to queue, null otherwise
async function lookingForGame(requestingUser, privacy) {
    if (await UserLogic.authorizedUser(requestingUser)) {
        let g = false;
        let foundLfg = await LfgModel.findGame(privacy, requestingUser.username);

        if (foundLfg) {
            let blue = await UserLogic.getUserByServer(requestingUser.username);
            let red = await UserLogic.getUserByServer(foundLfg.toObject().username);

            g = createGame(red.username, blue.username, privacy);

            UserFuncs.addGame(blue, g._id);
            UserLogic.updateUser(blue);
            UserFuncs.addGame(red, g._id);
            UserLogic.updateUser(red);

            foundLfg.delete();
        }

        if (g) {
            return g;
        }else {
            let lfg = new LfgModel({username: requestingUser.username, privacy: privacy})
            lfg.save((err, result) => {
                if (err)
                    console.log(err);
            });
            return true;
        }
    }
    return null;
}

//returns the game with gameID, null if user cant access
async function getGame(gameId, requestingUser) {
    let g = await GameModel.getGameById(gameId);

    if (g) {
        if (g.privacy === 1) {
            return g;
        } else if (g.privacy === 0 && requestingUser) {
            let uReq = await UserLogic.getUserByUser(requestingUser.username, requestingUser);
            if (await UserLogic.canSeeUser(g.redName, uReq) || await UserLogic.canSeeUser(g.blueName, uReq)) {
                return g;
            }
        } else if (requestingUser) {
            let uReq = await UserLogic.getUserByUser(requestingUser.username, requestingUser);
            if (g.redName === uReq.username || g.blueName === uReq.username) {
                return g;
            }
        }
    }
    return null;
}

//return an updated game if user is able to take move, else returns null;
async function postMove(gameID, requestingUser, column) {
    if (await UserLogic.authorizedUser(requestingUser)) {
        let gameDoc = await getGame(gameID, requestingUser);
        if (Number.isInteger(column)) {
            if (gameDoc) {
                let g = gameDoc.toObject();
                if (g.blueTurn && g.blueName === requestingUser.username) {
                    GameFuncs.takeMove(g, column);
                    gameDoc.overwrite(g);
                    updateGame(gameDoc);
                    if (g.winner !== -1) {
                        await moveGameToHistory(gameDoc._id, requestingUser);
                    }
                    return g;
                } else if (!g.blueTurn && g.redName === requestingUser.username) {
                    GameFuncs.takeMove(g, column);
                    gameDoc.overwrite(g);
                    updateGame(gameDoc);
                    if (g.winner !== -1) {
                        await moveGameToHistory(gameDoc._id, requestingUser);
                    }
                    return g;
                }
            }
        }
    }
    return null;
}

//return array of game ids that user is playing in and userRequesting can see
async function getActiveGames(user, userRequesting) {
    if (UserLogic.validUserObj(user)) {
        let u = await UserLogic.getUserByUser(user.username, userRequesting);
        if (u && u !== -1) {
            return await filterGames(u.activeGames, userRequesting);
        }
    }
    return null;
}

//return array of game id that user played
async function getHistoricGames(user, userRequesting) {
    if (UserLogic.validUserObj(user)) {
        let u = await UserLogic.getUserByUser(user.username, userRequesting);
        if (u && u !== -1) {
            return await filterGames(u.history, userRequesting);
        }
    }
    return null;
}

//returns a games history if user can access it, null otherwise
async function getGameHistory(gameID, requestingUser) {
    let g = await getGame(gameID, requestingUser);
    if (g) {
        return g.toObject().history;
    }
    return null;
}

async function getWinPercent(username, userRequesting) {
    let u = await UserLogic.getUserByUser(username, userRequesting);
    if (u && u.history.length > 0) {
        let wins = 0;

        for (let i in u.history) {
            let game = u.history[i];
            let g = await getGame(game, userRequesting);
            if (g.winner === 0 && g.blueName === u.username) {
                wins += 1
            } else if (g.winner === 1 && g.redName === u.username) {
                wins += 1;
            }
        }

        return Math.round(((wins / u.history.length) * 100)).toString() + '%';
    } else if (u) {
        return '0%';
    } else {
        return null;
    }
}

//if able to add request returns the new opponent with request added
async function addGameRequest(requestingUser, opponentUsername, gameRequest) {
    if (await UserLogic.authorizedUser(requestingUser)) {
        let opp = await UserLogic.getUserByServer(opponentUsername);

        if (opp) {
            UserFuncs.addGameRequest(opp, gameRequest);
            UserLogic.updateUser(opp);
            return opp;
        }
    }
}

//return game created after accepting request, or null if error
async function acceptGameRequest(acceptingUser, gameRequest) {
    if (await UserLogic.authorizedUser(acceptingUser)) {
        let accepting = await UserLogic.getUserByServer(acceptingUser.username);
        let requester = await UserLogic.getUserByServer(gameRequest.username);
        if (UserFuncs.hasGameRequest(accepting, gameRequest)) {
            let g = createGame(acceptingUser.username, gameRequest.username, gameRequest.privacy);
            UserFuncs.acceptGameRequest(accepting, gameRequest, g._id);
            UserFuncs.addGame(requester, g._id);
            UserLogic.updateUser(accepting);
            UserLogic.updateUser(requester);
            return g;
        }
    }
    return null;
}

//return user with request rejected or null if unable
async function rejectGameRequest(rejectingUser, gameRequest) {
    if (await UserLogic.authorizedUser(rejectingUser) ) {
        let u = await UserLogic.getUserByServer(rejectingUser.username);
        if (validGameRequest(gameRequest)) {
            UserFuncs.removeGameRequest(u, gameRequest);
            UserLogic.updateUser(u)
            return UserFuncs.userNoPassword(u);
        }
    }
    return null;
}

async function getGameRequests(user) {
    if (await UserLogic.authorizedUser(user)) {
        let u = await UserLogic.getUserByServer(user.username);
        return u.toObject().gameRequests;
    }
    return null;
}

//return an array of message objects
async function getChat(gameID, requestingUser) {
    let g = await getGame(gameID, requestingUser);

    if (g) {
        return g.toObject().chat;
    }
}

//return a game with updated chat, or null if user cant access
async function postChatToGame(gameID, text, requestingUser) {
    let g = await getGame(gameID, requestingUser);

    if (g) {
        GameFuncs.addMessage(g, {username: requestingUser.username, text: text})
        updateGame(g);
        return g;
    }
    return null;
}

async function forfeitGame(gameID, requestingUser) {
    let g = await getGame(gameID, requestingUser);

    if (g) {
        if (await UserLogic.authorizedUser(requestingUser)) {
            if (g.redName === requestingUser.username) {
                g.history.push(-2);
                g.winner = 0;
                updateGame(g);
                await moveGameToHistory(g._id, requestingUser);
            } else if (g.blueName === requestingUser.username) {
                g.history.push(-2);
                g.winner = 1;
                updateGame(g);
                await moveGameToHistory(g._id, requestingUser);
            }
        }
    }
    return null;
}

async function moveGameToHistory(gameID, requestUser) {
    if (await UserLogic.authorizedUser(requestUser)) {
        let uReq = await UserLogic.getUserByServer(requestUser.username);
        if (uReq.activeGames.includes(gameID)) {
            let g = await getGame(gameID, requestUser);
            if (g && g.winner !== -1) {
                let otherU = (uReq.username === g.redName) ? await UserLogic.getUserByServer(g.blueName) : await UserLogic.getUserByServer(g.redName);
                UserFuncs.removeActive(uReq, gameID);
                UserFuncs.removeActive(otherU, gameID);

                UserLogic.updateUser(uReq);
                UserLogic.updateUser(otherU);

                g.active = false;
                updateGame(g);
            }
        }
    }
    return null;
}

module.exports = {validGameRequest, filterGames, createGame, createGameRequest, lookingForGame, getGame,
    postMove, getGameHistory, getChat, postChatToGame, getActiveGames, getHistoricGames, addGameRequest,
    acceptGameRequest, rejectGameRequest, getGameRequests, forfeitGame, getWinPercent};
