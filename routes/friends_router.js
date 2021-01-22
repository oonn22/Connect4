const UserLogic = require('../server_logic/user_logic_func.js');
const ServerLogic = require('../server_logic/server_logic_func.js');
const express = require('express');
const router = express.Router();

router.get("/", getFriends);
router.get("/isfriend", isFriend);
router.get("/friendrequests", getFriendRequests);

router.post("/createrequest", createRequest);

router.put("/accept", acceptRequest);
router.put("/reject", rejectRequest);
router.put("/remove", removeFriend);

async function getFriends(req, res, next) {
    let username = req.query.username;
    let requester = req.session;
    let friends;

    if (username) {
        if (!requester.guest) {
            friends = await UserLogic.getFriends({username: username}, requester);
        } else {
            friends = await UserLogic.getFriends({username: username});
        }
    } else if (!requester.guest) {
        friends = await UserLogic.getFriends(requester, requester);
    }


    res.format({
        html: async function () {
            let input = {}
            input.friends = await ServerLogic.pugInputBuilder(friends, req.query.limit, req.query.page, buildFriendTableObj, req.session);
            if (friends) {
                res.render("friendspage", input)
            } else {
                res.render("friendspage");
            }
        },
        json: async function () {
            friends = await ServerLogic.pugInputBuilder(friends, req.query.limit, req.query.page, friendJson, req.session);
            if (friends) {
                res.status(200).json(friends)
            } else {
                res.status(404).json({success: false, msg: "unable to retrieve friends"})
            }
        }
    });
}

async function buildFriendTableObj(friend, session) {
    let friendObj = {};
    let u = await UserLogic.getUserByUser(friend, session);

    friendObj.username = friend;

    if (u) {
        friendObj.status = u.online;
    } else {
        friendObj.status = false;
    }

    return friendObj;
}

function friendJson(friend) {
    return friend;
}

async function isFriend(req, res, next) {
    res.status(200).json(await UserLogic.usersAreFriends(req.query, req.session));
}

async function getFriendRequests(req, res, next) {
    let requests;
    if (req.session.guest) {
        res.status(401).json({success: false, msg: "Please login!"});
    } else {
        requests = await UserLogic.getFriendRequests(req.session);

        res.format({
            html: function () {
                let input = {};
                let limit = req.query.limit;
                let page = req.query.page;

                input.requests = requests;

                res.status(200).render("friendrequestspage", input);
            },
            json: function () {
                res.status(200).json(requests);
            }
        });
    }
}

async function createRequest(req, res, next) {
    if (!req.session.guest) {
        let username = req.query.username;
        if (await UserLogic.existingUsername(username)) {
            if (! await UserLogic.pendingFriendRequest({username: username}, req.session)) {
                await UserLogic.makeFriendRequest({username: username}, req.session);
                res.status(200).json({success: true, msg: "Friend request sent!"});
            } else {
                res.status(409).json({success: false, msg: "Request already pending."});
            }
        } else {
            res.status(404).json({success: false, msg: "The username to request does not exist."});
        }
    } else {
        res.status(401).json({success: false, msg: "Invalid Credentials. Are you signed in?"});
    }
}

async function acceptRequest(req, res, next) {
    if (!req.session.guest) {
        let username = req.query.username;
        if (await UserLogic.existingUsername(username)) {
            let requests = await UserLogic.getFriendRequests(req.session);
            if (requests.includes(username)) {
                let u = await UserLogic.acceptFriendRequest(req.session, {username: username});
                if (u) {
                    res.status(200).json({
                        success: true,
                        msg: "Friend request accepted! " + username + " is now your friend!"
                    });
                } else {
                    res.status(500).json({success: false, msg: "Error accepting request!"})
                }

            } else {
                res.status(404).json({success: false, msg: "No request exists."});
            }
        } else {
            res.status(404).json({success: false, msg: "The username to accept does not exist."});
        }
    } else {
        res.status(401).json({success: false, msg: "Invalid Credentials. Are you signed in?"});
    }
}

async function rejectRequest(req, res, next) {
    if (!req.session.guest) {
        let username = req.query.username;
        if (await UserLogic.existingUsername(username)) {
            let requests = await UserLogic.getFriendRequests(req.session)
            if (requests.includes(username)) {
                let u = await UserLogic.rejectFriendRequest(req.session, {username: username});
                if (u) {
                    res.status(200).json({
                        success: true,
                        msg: "Friend request Rejected!"
                    });
                } else {
                    res.status(500).json({success: false, msg: "Error rejecting request!"})
                }

            } else {
                res.status(404).json({success: false, msg: "No request exists."});
            }
        } else {
            res.status(404).json({success: false, msg: "The username to reject does not exist."});
        }
    } else {
        res.status(401).json({success: false, msg: "Invalid Credentials. Are you signed in?"});
    }
}

async function removeFriend(req, res, next) {
    if (!req.session.guest) {
        if (req.query.hasOwnProperty("username")) {
            if (await UserLogic.usersAreFriends(req.session, {username: req.query.username})) {
                let u = await UserLogic.removeFriend(req.session, req.query.username);
                if (u) {
                    res.status(200).json({success: true, msg: "Successfully removed friend"});
                } else {
                    res.status(500).json({success: false, msg: "Server Error"});
                }
            } else {
                res.status(404).json({success: false, msg: "User doesnt exist or is not your friend"});
            }
        } else {
            res.status(400).json({
                success: false,
                msg: "invalid request, include username to remove as query parameter"
            });
        }
    } else {
        res.status(401).json({success: false, msg: "Please log in first!"});
    }
}



module.exports = router;