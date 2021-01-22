const User = require("./userServerModule").User;

class UserFuncs {
    //All functions are assumed to be inputted with a user object defined in /parts/user/userSharedModule.js

    createUser(user, username, password) {
        if (user.username === undefined && user.password === undefined) {
            //cannot create user twice
            user.username = username;
            user.password = password;
            this.updateActivity(user);
        }
    }

    //probably to be removed or significantly changed later
    signIn(user, password) {
        if (password === user.password) {
            user.signedIn = true;
            user.online = true;
            this.updateActivity(user);
            return true;
        } else {
            return false;
        }
    }

    logOut(user) {
        user.signedIn = false;
        user.online = false;
        this.updateActivity(user);
    }

    updateActivity(user) {
        user.lastActive = Date.now();
        user.online = true;
    }

    addFriend(user, userToAdd) {
        user.friends.push(userToAdd.username);
    }

    removeFriend(user, userToRemove) {
        user.friends = user.friends.filter(item => item !== userToRemove.username);
    }

    addRequest(user, userRequesting) {
        user.requests.push(userRequesting.username);
    }

    acceptRequest(user, userToAccept) {
        if (user.requests.includes(userToAccept.username)) {
            this.addFriend(user, userToAccept);
            this.removeRequest(user, userToAccept);
        }
    }

    removeRequest(user, userToRemove) {
        user.requests = user.requests.filter(item => item !== userToRemove.username);
    }

    pendingRequest(user, userToRequest) {
        return user.requests.includes(userToRequest.username);
    }

    removeActive(user, gameID) {
        user.activeGames = user.activeGames.filter(item => item.toString() !== gameID.toString());
        user.history.push(gameID);
    }

    userNoPassword(user) {
        let u = new User(JSON.stringify(user));
        delete u.password;
        return u;
    }

    numFriends(user) {
        return user.friends.length;
    }

    isFriends(user1, user2) {
        return user1.friends.includes(user2.username);
    }

    addGame(user, gameID) {
        user.activeGames.push(gameID);
    }

    addGameRequest(user, gameRequest) {
        if (gameRequest.hasOwnProperty("username") && gameRequest.hasOwnProperty("privacy")) {
            user.gameRequests[user.gameRequests.length] = gameRequest;
        }
    }

    acceptGameRequest(user, gameRequest, gameID) {
        this.removeGameRequest(user, gameRequest);
        this.addGame(user, gameID);
    }

    removeGameRequest(user, gameRequest) {
        let req = JSON.stringify(gameRequest);
        user.gameRequests = user.gameRequests.filter(item => {
            item = JSON.stringify(item);
            let x = item !== req;
            return x;
        });
    }

    hasGameRequest(user, gameRequest) {
        let flag = false;
        let req = JSON.stringify(gameRequest);
        user.gameRequests.forEach(item => {
            if (JSON.stringify(item) === req) {
                flag = true;
            }
        });
        return flag;
    }

}

module.exports = UserFuncs;