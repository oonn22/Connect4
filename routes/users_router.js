const UserLogic = require('../server_logic/user_logic_func.js');
const ServerLogic = require('../server_logic/server_logic_func.js');
const express = require('express');
const router = express.Router();
const UserRouter = require("./user_router.js");


router.use("/user", UserRouter);
router.get("/", determineUserPage);
router.get("/search", searchUser);

async function  determineUserPage(req, res, next) {
    if (req.query.query && req.query.query !== '') {
        await searchUser(req, res, next);
    }
    if (!req.session.guest) {
        res.redirect("/users/user?username=" + req.session.username);
    } else {
        res.render("loginpage", ServerLogic.navButtonsStatus(false, true, false, false));
    }
}

async function searchUser(req, res, next) {
    let results = await UserLogic.searchUser(req.query.query, req.session);

    res.format({
       html: async () => {
           let input = {};
           let page = req.query.page;
           let limit = req.query.limit;
           let query = req.query.query;

           input.results = results;
           console.log('tresults: ');
           console.log(input.results);
           input.page = page;
           input.limit = limit;
           input.query = query;
           Object.assign(input, ServerLogic.navButtonsStatus(false, false, true, false));

           res.status(200).render('searchpage', input);
       },
       json: () => {
           res.status(200).json(results);
       }
    });
}

module.exports = router;