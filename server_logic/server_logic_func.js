const UF = require("../modules/user/serverUserFunc.js");
const UserFuncs = new UF();
const UserModel = require("../Mongoose/UserModel.js");

/*
SERVER FUNCTIONS
these are functions that the server logic will use without input from the client.
 */

// function to run on server every 5 mins, will set users as offline if they haven't
// been active in past 5 mins.
function updateUsersStatus() {
    UserModel.updateStatus();
}

function navButtonsStatus(home, users, search, games) {
    return {homeClicked: home, usersClicked: users, searchClicked: search, gameClicked: games}
}

async function pugInputBuilder(listToBuildFrom, limit, page, callbackOnListItem, session) {
    let input = []

    if ((page * limit) > listToBuildFrom.length) {
        if (limit > listToBuildFrom.length) {
            for (let i = 0; i < listToBuildFrom.length; i++) {
                input.push(await callbackOnListItem(listToBuildFrom[i], session));
            }
        } else {
            let startIndex = 0;

            do {
                startIndex += limit;
            } while (startIndex + limit < listToBuildFrom.length);

            for (startIndex; startIndex < listToBuildFrom.length; startIndex++) {
                input.push(await callbackOnListItem(listToBuildFrom[startIndex], session));
            }
        }
    } else {
        let startIndex = page * limit - 1;
        if (startIndex + limit < listToBuildFrom.length) {
            for (let i = startIndex; i < (startIndex + limit) ; i++) {
                input.push(await callbackOnListItem(listToBuildFrom[i], session));
            }
        } else {
            for (startIndex; startIndex < listToBuildFrom.length; startIndex++) {
                input.push(await callbackOnListItem(listToBuildFrom[startIndex], session));
            }
        }
    }

    return input;
}

module.exports = {updateUsersStatus, navButtonsStatus, pugInputBuilder};
