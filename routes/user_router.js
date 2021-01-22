const UserLogic = require('../server_logic/user_logic_func.js');
const GameLogic = require('../server_logic/game_logic_func.js');
const ServerLogic = require('../server_logic/server_logic_func.js');
const express = require('express');
const router = express.Router();

const FriendsRouter = require('./friends_router.js');

router.use("/friends", FriendsRouter)
router.get("/", getUser);
router.get("/isuser", isUser);
router.get("/activegames", getActiveGames);
router.get("/gamehistory", getHistoricGames);
router.get("/gamerequests", getGameRequests);

router.post("/create", createUser);
router.put("/privacy", setPrivacy);


async function getUser(req, res, next) {
    let username = req.query.username;
    let user = await UserLogic.getUserByUser(username, req.session);

    res.format({
        html: async function () {
            if (user === 0 || user === -1) {
                user = null;
            }
            let input = {};
            input.u = user;

            if (user && user.history.length > 0) {
                input.winPercent = await GameLogic.getWinPercent(user.username, req.session);
            }

            let sideBar = ServerLogic.navButtonsStatus(false, true, false, false);
            input = Object.assign(input, sideBar);

            res.render("userpage", input);
        },
        json: function () {
            if (user === 0 || user === 1 || user === null) {
                res.status(404).json({success: false, msg: "Could not find user, or user is hidden."});
            } else {
                res.status(200).json({success: true, msg: "retrieved user", user: user});
            }
        }
    });
}

async function createUser(req, res, next) {
    if (req.session.guest) {
        let u = await UserLogic.createUser(req.body);

        if (u) {
            res.status(201).json({success: true, msg: 'Created User: ' + req.body.username});
        } else {
            res.status(200).json({success: false, msg: 'Invalid Username'});
        }
    } else {
        res.status(200).json({success: false, msg: 'Please logout first!'});
    }
}

function isUser(req, res, next) {
    res.status(200).json(req.query.username === req.session.username);
}

async function setPrivacy(req, res, next) {
    let privacy = parseInt(req.query.privacy);

    if (privacy === -1 || privacy === 0 || privacy ===1) {
        let u = await UserLogic.setPrivacy(req.session, privacy);
        if (u) {
            res.status(200).json({success: true, msg: "Updated Privacy to " + privacy});
        } else {
            res.status(500).json({success: false, msg: "Could not set privacy."});
        }
    } else {
        res.status(400).json({success: false, msg: "Invalid privacy setting. Use 1 for public, 0 for friends only, and -1 for private"});
    }
}

async function getActiveGames(req, res, next) {
    let activeGames;
    let input = {};

    if (req.query.hasOwnProperty("username") && req.query.username !== req.session.username) {
        activeGames = await GameLogic.getActiveGames(req.query, req.session);
        input.isUser = false;
    } else if (req.session.guest) {
        res.status(401).json({success: false, msg: "Please login or include a username to query"});
        return;
    } else {
        activeGames = await GameLogic.getActiveGames(req.session, req.session);
        input.isUser = true;
    }

    res.format({
        html: async function () {
            let limit = req.query.limit;
            let page = req.query.page;

            if (activeGames) {
                input.games = await ServerLogic.pugInputBuilder(activeGames, limit, page, buildGameTableObject, req.session);
            } else {
                input.games = [];
            }

            res.status(200).render("activegamespage", input);
        },
        json: function () {
            res.status(200).json(activeGames);
        }
    });
}

async function getHistoricGames(req, res, next) {
    let historicGames;
    if (req.query.hasOwnProperty("username")) {
        historicGames = await GameLogic.getHistoricGames(req.query, req.session);
    } else if (req.session.guest) {
        res.status(401).json({success: false, msg: "Please login or include a username to query"});
        return;
    } else {
        historicGames = await GameLogic.getHistoricGames(req.session, req.session);
    }

    res.format({
        html: async function () {
            let input = {};
            let limit = req.query.limit;
            let page = req.query.page;

            if (historicGames) {
                input.games = await ServerLogic.pugInputBuilder(historicGames, limit, page, buildGameTableObject, req.session);
            } else {
                input.games = [];
            }

            res.status(200).render("historicgamespage", input);
        },
        json: function () {
            res.status(200).json(historicGames);
        }
    });
}

async function getGameRequests(req, res, next) {
    let requests;
    if (req.session.guest) {
        res.status(401).json({success: false, msg: "Please login!"});
    } else {
        requests = await GameLogic.getGameRequests(req.session);

        res.format({
            html: function () {
                let input = {};
                let limit = req.query.limit;
                let page = req.query.page;

                input.requests = requests;

                res.status(200).render("gamerequestspage", input);
            },
            json: function () {
                res.status(200).json(requests);
            }
        });
    }
}

async function buildGameTableObject(gameID, session) {
    let g = await GameLogic.getGame(gameID, session);
    let gameTableObj = {};

    gameTableObj.id = g._id.toString();
    gameTableObj.winner = g.winner;

    if (await UserLogic.canSeeUser(g.blueName, session)) {
        gameTableObj.blueName = g.blueName;
    } else {
        gameTableObj.blueName = '';
    }

    if (await UserLogic.canSeeUser(g.redName, session)) {
        gameTableObj.redName = g.redName;
    } else {
        gameTableObj.redName = '';
    }

    return gameTableObj;
}

module.exports = router;