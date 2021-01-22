const UserLogic = require('../server_logic/user_logic_func.js');
const GameLogic = require('../server_logic/game_logic_func.js');
const ServerLogic = require('../server_logic/server_logic_func.js');
const express = require('express');
const router = express.Router();

router.get("/", getGame);
router.get("/singleplayer", singlePlayerPage);
router.get("/create", getCreateGame);
router.get("/chat", getGameChat);

router.post("/createrequest", createRequest);

async function getGame(req, res, next) {
    if (req.query.hasOwnProperty('gameid') || req.body.hasOwnProperty('gameid')) {
        let gameid = (req.query.hasOwnProperty('gameid') ? req.query.gameid : req.body.gameid);
        let game = (req.session.guest ? await GameLogic.getGame(gameid) : await GameLogic.getGame(gameid, req.session));

        if (game) {
            res.format({
                html: function () {
                    let input = {}
                    input.guest = req.session.guest;
                    input.game = game;
                    input.game.gameID = game._id.toString();
                    input.user = req.session.username;
                    Object.assign(input, ServerLogic.navButtonsStatus(false, false, false,true));
                    res.status(200).render("onlinegamepage", input);
                },
                json: function () {
                    res.status(200).json({success: true, msg: "retrieved game", game: game});
                }
            });
        } else {
            res.status(404).json({success: false, msg: "game does not exist, or it is hidden"});
        }
    } else {
        res.status(400).json({success: false, msg: "Invalid request please include a gameid parameter"});
    }
}

function singlePlayerPage(req, res, next) {
    res.status(200).render("singleplayerpage",
        Object.assign(
            ServerLogic.navButtonsStatus(false, false, false, true),
            {guest: req.session.guest}
            )
    );
}

function getCreateGame(req, res, next) {
    res.format({
        html: async function () {
            let input = ServerLogic.navButtonsStatus(false, false, false, true);
            if (!req.session.guest) {


                if (req.query.hasOwnProperty("withuser") && await UserLogic.canSeeUser(req.query.withuser, req.session)) {
                    input.withUser = req.query.withuser;
                }

                res.status(200).render("creategamepage", input);

            } else {
                res.status(401).render("unauthorizedpage", input);
            }
        }
    });
}

async function getGameChat(req, res, next) {
    if (req.query.hasOwnProperty('gameid') || req.body.hasOwnProperty('gameid')) {
        let gameid = (req.query.hasOwnProperty('gameid') ? req.query.gameid : req.body.gameid);
        let game = (req.session.guest ? await GameLogic.getGame(gameid) : await GameLogic.getGame(gameid, req.session));

        if (game) {
            let chat = await GameLogic.getChat(game._id, req.session);
            res.format({
                html: function () {
                    res.status(200).render("chatpage", {messages: chat});
                },
                json: function () {
                    res.status(200).json({success: true, msg: "retrieved game", chat: chat});
                }
            });
        } else {
            res.status(404).json({success: false, msg: "game does not exist, or it is hidden"});
        }
    } else {
        res.status(400).json({success: false, msg: "Invalid request please include a gameid parameter"});
    }
}

async function createRequest(req, res, next) {
    if (!req.session.guest) {
        if (req.body.hasOwnProperty('username') && req.body.hasOwnProperty('privacy')) {
            if (req.body.username === req.session.username) {
                res.status(403).json({success: false, msg: 'cannot send game request to self!'});
            } else if (await UserLogic.existingUsername(req.body.username) &&
                await UserLogic.canSeeUser(req.body.username, req.session)) {
                if (await GameLogic.createGameRequest(req.session, req.body.username, req.body.privacy)) {
                    res.status(200).json({success: true, msg: "Successfully sent request!"});
                } else {
                    res.status(409).json({success: false, msg: "Request already pending!"});
                }
            } else {
                res.status(404).json({
                    success: false,
                    msg: "Could not find user: " + req.body.username + ". They are either hidden from you or do not exist"
                });
            }
        } else {
            res.status(400).json({
                success: false,
                msg: "request body invalid. should contain a username property and a privacy property in an object"
            });
        }
    } else {
        res.status(401).json({success: false, msg: "Please log in first!"})
    }
}

module.exports = router;