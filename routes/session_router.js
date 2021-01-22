const UserLogic = require('../server_logic/user_logic_func.js');
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

router.get('/status', checkStatus);
router.delete('/logout', terminateSession);
router.post('/login', createSession);


async function createSession(req, res, next) {
    console.log(req.body);
    console.log(req.sessionID);

    if (!req.session.guest) {
        res.status(200).json({success: true, msg: 'Already Logged In'});
        return;
    }

    let u = await UserLogic.loginUser(req.body);

    if (u) {
        req.session.username = u.username;
        req.session.password = req.body.password;
        req.session.guest = false;
        res.status(200).json({success: true, msg: 'Logged In'});
    } else {
        res.status(401).json({success: false, msg: 'Invalid Credentials'});
    }
}

async function terminateSession(req, res, next) {
    let u = null;
    if (!req.session.guest) {
        u = await UserLogic.logoutUser(req.session);
        if (u) {
            req.session.guest = true;
            req.session.username = "guest#" + (Math.floor(Math.random() * 1000) + 1000).toString();
            req.session.password = null;
            res.status(200).json({success: true});
        }
    } else {
        res.status(401).json({success: false, error: 'Invalid Session'});
    }
}

function checkStatus(req, res, next) {
    if (!req.session.guest) {
        res.status(200).json({success: true});
    } else {
        res.status(200).json({success: false});
    }
}

module.exports = router;