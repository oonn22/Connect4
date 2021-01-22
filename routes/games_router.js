const UserLogic = require('../server_logic/user_logic_func.js');
const GameLogic = require('../server_logic/game_logic_func.js');
const ServerLogic = require('../server_logic/server_logic_func.js');
const express = require('express');
const router = express.Router();
const GameRouter = require('./game_router.js');
const GameModel = require('../Mongoose/GameModel.js');

router.use("/game", GameRouter);

router.get("/", determineGamesPage);
router.post("/lfg", lfg);
router.put('/accept', acceptGameRequest);
router.put('/reject', rejectGameRequest);

async function determineGamesPage(req, res, next) {
    if (req.query.player || req.query.active) {
        await searchGames(req, res, next);
    }else if (req.session.guest) {
        res.redirect('/games/game/singleplayer')
    } else {
        res.status(200).render(
            "defaultgamespage",
            ServerLogic.navButtonsStatus(false, false, false,true)
        );
    }
}

async function searchGames(req, res, next) {
    if (req.query.player) {

    } else {
        req.query.player = '';
    }

    if (!req.query.hasOwnProperty('active')) {
        req.query.active = true;
    } else {
        if (req.query.active === 'false' ) {
            req.query.active = false;
        } else {
            req.query.active = true;
        }
    }

    if (req.query.detail && req.query.detail !== 'full') {
        req.query.detail = 'summary';
    }

    let searchResults = await GameModel.searchGames(req.query.player, req.query.active);
    let formattedResults = [];

    for (let i in searchResults) {
        let result = searchResults[i];
        let game = {};

        game.blueName = result.blueName;
        game.redName = result.redName;

        if (result.winner === -1) {
            game.completed = false;
        } else {
            game.completed = true;
            game.turns = result.history.length;
            if (result.winner === 0) {
                game.winner = game.blueName;
            } else {
                game.winner = game.redName
            }
            if (result.history.includes(-2)) {
                game.forfeitWin = true;
            }
        }

        if (req.query.detail === 'full') {
            game.history = result.history;
        }

        formattedResults.push(game);
    }

    res.status(200).json({
        success: true,
        msg:"found games",
        games: formattedResults
    });
}

async function lfg(req, res, next) {
    if (!req.session.guest) {
        if (req.body.hasOwnProperty('privacy')) {
            let g = await GameLogic.lookingForGame(req.session, req.body.privacy);

            if (g === true) {
                res.status(200).json({
                    success: true,
                    msg:"Joined queue! When a game is found for you it will appear in your active games."
                });
            } else if (g) {
                res.status(200).json({
                    success: true,
                    msg:"Found a game! Start playing by going to your active games!",
                    id: g._id
                });
            } else {
                res.status(500).json({success: false, msg: "Error looking for game!"});
            }
        } else {
            res.status(400).json({success: false, msg: "request body should have a privacy parameter."});
        }
    } else {
        res.send(401).json({success: false, msg: "Please log in first."});
    }
}

async function acceptGameRequest(req, res, next) {
    if (!req.session.guest) {
        if (req.body.hasOwnProperty('username') && req.body.hasOwnProperty('privacy')) {
            let r = await GameLogic.acceptGameRequest(req.session, req.body);

            if (r) {
                res.status(200).json({
                    success: true,
                    msg:"Accepted request and created game. Game is now in active games.",
                    id: r._id
                });
            } else {
                res.status(404).json({success: false, msg: "Request doesnt exist."});
            }
        } else {
            res.status(400).json({success: false, msg: "request body should have a username and privacy parameter."});
        }
    } else {
        res.send(401).json({success: false, msg: "Please log in first."});
    }

}

async function rejectGameRequest(req, res, next) {
    if (!req.session.guest) {
        if (req.body.hasOwnProperty('username') && req.body.hasOwnProperty('privacy')) {
            let r = await GameLogic.rejectGameRequest(req.session, req.body);

            if (r) {
                res.status(200).json({success: true, msg:"Rejected request."});
            } else {
                res.status(404).json({success: false, msg: "Request doesnt exist."});
            }
        } else {
            res.status(400).json({success: false, msg: "request body should have a username and privacy parameter."});
        }
    } else {
        res.send(401).json({success: false, msg: "Please log in first."});
    }
}

module.exports = router;