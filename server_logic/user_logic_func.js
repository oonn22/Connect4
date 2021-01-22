const User = require("../modules/user/userServerModule.js").User;
const UF = require("../modules/user/serverUserFunc.js");
const UserFuncs = new UF();
const UserModel = require('../Mongoose/UserModel.js');
const bcrypt = require('bcrypt');


/*
USER FUNCTIONS
my idea for these functions is that the client will either provide the server with a user object which will
contain all the user info, or it will provide only the exact information needed. Expected fields are ONLY those from a
user object (i.e a field "pw" wouldn't be processed, it would have to match an existing field in the user class).  The
implementation of the user object can be found in /parts/userSharedModule. Some functions will have to be changed when
a database is introduced, for now these functions get info directly from the users mapping.
 */

// every username is unique and more than 3 characters, ensures this
// and leaves modularity for further username requirements
async function validFreeUsername(username) {
    let free = !(await existingUsername(username));
    return username && username.length >= 4 && free;
}

//check if object has a username
function validUserObj(user) {
    return user && user.hasOwnProperty("username");
}

//checks if a username is taken in database
async function existingUsername(username) {
    return !(await UserModel.freeUsername(username));
}

//check if object is an authorized user, i.e contains username and corresponding password in database
//(doesn't use getUser function, goes directly to database)
async function authorizedUser(user) {
    if (validUserObj(user) && user.hasOwnProperty("password")) {
        let u = await getUserByServer(user.username);
        if (u) {
            return await new Promise((resolve, reject) => {
                bcrypt.compare(user.password, u.password, (err, res) => {
                    if (err)
                        reject(err)
                    resolve(res);
                });
            });
        }
    }
    return false;
}

//doesnt validate if actual users, just checks if objects are same
function isSameUserObj(user1, user2) {
    return JSON.stringify(user1) === JSON.stringify(user2);
}

async function usersAreFriends(user1, user2) {
    if (validUserObj(user1) && validUserObj(user2)) {
        let u1 = await getUserByServer(user1.username);
        let u2 = await getUserByServer(user2.username);

        if (u1 && u2) {
            return UserFuncs.isFriends(u1, u2);
        }
    }
    return false
}

// requester not necessary unless not public user
async function canSeeUser(usernameRequested, requester=undefined) {
    let uReq = await getUserByServer(usernameRequested);
    if (uReq) {
        let privacyStatus = uReq.privacy;

        if (privacyStatus === 1) {
            //public user anyone can see
            return true;
        } else if (await authorizedUser(requester)) {
            if (uReq.username === requester.username) {
                //any user can see themselves
                return true;
            } else if (UserFuncs.isFriends(await getUserByServer(requester.username), uReq)) {
                //requester friend of user, can see
                return true;
            }
        }
    }
    return false; //user is private, or other issue
}

// can get any user without restriction, to only be called inside other functions
async function getUserByServer(username) {
    if (await existingUsername(username)) {
        return await UserModel.findUserByUsername(username)
    }
    return null;
}

function updateUser(user) {
    user.save((err, user) => {
       if (err)
           console.log(err);
    });
}

/*
 return null if no user found, an authorized User if requester === requested and requester is authorized,
 an unauthorized User if requested is public or on requester friends list. return 0 or -1 if the user exists
 but is private/friends only and cant be accessed by requester. if need access to a private, friends only user,
 or getting same user, must provide an authorized user. will be used to access users from mapping to make switching
 to a database in the future easier, as will only need to edit this function
*/
async function getUserByUser(usernameRequested, requestingUser=undefined) {
    if (await existingUsername(usernameRequested)) {
        if (await canSeeUser(usernameRequested, requestingUser)) {
            if (requestingUser && usernameRequested === requestingUser.username && await authorizedUser(requestingUser)) {
                return await getUserByServer(usernameRequested);
            } else {
                //doesnt return a password if the requesting user isn't the user to get
                //or the requester is unauthorized. this returns a new user object that
                //wouldnt update values in the users mapping. Will concern myself with
                //that when have database.
                return UserFuncs.userNoPassword(await getUserByServer(usernameRequested));
            }
        }
        let u = await getUserByServer(usernameRequested);
        return u.privacy;
    }
    return null;
}

//probably slow with large db. want to wait for actual implementation to optimize.
//return an array of usernames matching a username that the requester is able to see
//TODO rewrite
async function searchUser(username, requestingUser=undefined) {
    let ret = [];
    if (username === '') {
        return ret;
    } else {
        username = username.toLowerCase();
        let matchingUsers = await UserModel.searchUsernames(username)
        for (let i in matchingUsers) {
            let user = matchingUsers[i];
            if (user.hasOwnProperty('username') &&
                user.hasOwnProperty('online') &&
                await canSeeUser(user.username, requestingUser)) {
                ret.push({username: user.username, status: user.online});
            }
        }
        ret.sort();
        return ret;
    }
}

//also adds user to our database on creation, which is just the mapping for now
//returns null if cant create user (username taken), other wise returns the created ServerUser
async function createUser(user) {
    if  (validUserObj(user) && await validFreeUsername(user.username)) {
        user.password = await new Promise((resolve, reject) => {
            bcrypt.hash(user.password, 10, (err, hash) => {
                if (err)
                    reject(err)
                resolve(hash);
            });
        });
        let u = new UserModel({username: user.username, password: user.password});

        updateUser(u);

        return u;
    } else {
        return null;
    }
}

//return a auth user on successful logged in
async function loginUser(user) {
    if (await authorizedUser(user)) {
        let u = await getUserByUser(user.username, user);
        UserFuncs.signIn(u, u.password);
        updateUser(u);
        return u;
    }
    return null;
}


async function logoutUser(user) {
    if (await authorizedUser(user)) {
        let u = await getUserByServer(user.username);
        UserFuncs.logOut(u);
        updateUser(u);
        return u;
    }
    return null;
}

//userRequesting must be authorized to create a request
//friendsOnly users cant receive random requests
//return the unauthorised userToAdd with the requests array updated, or null
async function makeFriendRequest(userToAdd, userRequesting) {
    if (await authorizedUser(userRequesting) &&
        validUserObj(userToAdd) &&
        await canSeeUser(userToAdd.username, userRequesting) &&
        !await pendingFriendRequest(userToAdd, userRequesting)) {

        let uToAdd = await getUserByServer(userToAdd.username);
        if (uToAdd && uToAdd.username !== userRequesting.username) {
            UserFuncs.addRequest(uToAdd, userRequesting);
            updateUser(uToAdd);
            return UserFuncs.userNoPassword(uToAdd);
        }
    }
    return null;
}

//return if userToAdd has request from userRequesting
async function pendingFriendRequest(userToAdd, userRequesting) {
    if (await authorizedUser(userRequesting) && validUserObj(userToAdd)) {
        let uToAdd = await getUserByServer(userToAdd.username);
        let uRequesting = await getUserByServer(userRequesting.username);

        return UserFuncs.pendingRequest(uToAdd, uRequesting);
    }
    return true
}

//returns a list of usernames that have requested to be an authorized users friend
async function getFriendRequests(userRequesting) {
    if (validUserObj(userRequesting)) {
        let u = await getUserByUser(userRequesting.username, userRequesting);
        if (u) {
            u = u.toObject();
            return u.requests;
        }
    }
    return null;
}

//return an array containing two unauthorized users that have been changed, or null if error
async function acceptFriendRequest(userAccepting, userRequestOrigin) {
    if (validUserObj(userRequestOrigin)) {
        let requests = await getFriendRequests(userAccepting);
        if (requests) {
            if (requests.includes(userRequestOrigin.username)) {
                let accepting = await getUserByServer(userAccepting.username);
                let origin = await getUserByServer(userRequestOrigin.username);

                UserFuncs.acceptRequest(accepting, origin);
                UserFuncs.addFriend(origin, accepting);

                updateUser(accepting);
                updateUser(origin);

                return [UserFuncs.userNoPassword(accepting), UserFuncs.userNoPassword(origin)];
            }
        }
    }
    return null;
}

async function rejectFriendRequest(userRejecting, userRequestOrigin) {
    if (validUserObj(userRequestOrigin)) {
        let requests = await getFriendRequests(userRejecting);
        if (requests) {
            if (requests.includes(userRequestOrigin.username)) {
                let rejecting = await getUserByServer(userRejecting.username);

                UserFuncs.removeRequest(rejecting, userRequestOrigin);

                updateUser(rejecting);

                return UserFuncs.userNoPassword(rejecting);
            }
        }
    }
    return null;
}

//return array with unauthorized changed users or null if unauthorized
async function removeFriend(user, usernameToRemove) {
    if (await authorizedUser(user)) {
        let u = await getUserByServer(user.username);
        let toRemove = await getUserByServer(usernameToRemove);

        if (u && toRemove && UserFuncs.isFriends(u, toRemove)) {
            UserFuncs.removeFriend(u, toRemove);
            UserFuncs.removeFriend(toRemove, u);

            updateUser(u);
            updateUser(toRemove);

            return [UserFuncs.userNoPassword(u), UserFuncs.userNoPassword(toRemove)];
        }
    }
    return null;
}

//return array of friends usernames
async function getFriends(user, requesting) {
    if (validUserObj(user)) {
        let ret = []
        if (await authorizedUser(requesting)) {
            let u = await getUserByUser(user.username, requesting);
            if (u && u !== -1 && u !== 0) {
                for (let i in u.friends) {
                    let username = u.friends[i];
                    if (await canSeeUser(username, requesting)) {
                        ret.push(username)
                    }
                }
            }
        } else {
            let u = getUserByUser(user.username);
            if (u && u !== -1 && u !== 0) {
                for (let i in u.friends) {
                    let username = u.friends[i];
                    if (await canSeeUser(username)) {
                        ret.push(username)
                    }
                }
            }
        }
        return ret;
    }
    return null;
}

//return unauthorized user with privacy setting set, or null if unauthorized
async function setPrivacy(user, privacySetting) {
    if (await authorizedUser(user)) {
        if (privacySetting === -1 || privacySetting === 0 || privacySetting === 1) {
            let u = await getUserByUser(user.username, user);
            u.privacy = privacySetting;
            updateUser(u);
            return UserFuncs.userNoPassword(u);
        }
    }
    return null;
}

//user has done an action that keeps them "active" on the site
async function userActive(username) {
    if (await existingUsername(username)) {
        let u = await getUserByServer(username);
        UserFuncs.updateActivity(u);
        updateUser(u);
    }

}

//sets user as online or off, return unauth user with new status
async function setOnline(user, status=true) {
    if (validUserObj(user)) {
        let u = await getUserByUser(user.username, user);
        if (u && u !== -1) {
            u.online = status;
            updateUser(u);
            return UserFuncs.userNoPassword(u);
        }
    }
    return null;
}

module.exports = {validFreeUsername, validUserObj, existingUsername, authorizedUser, isSameUserObj,
    usersAreFriends, canSeeUser, updateUser, getUserByServer,  getUserByUser, searchUser, createUser, loginUser,
    logoutUser, makeFriendRequest, pendingFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest,
    removeFriend, getFriends, setPrivacy, userActive, setOnline}
