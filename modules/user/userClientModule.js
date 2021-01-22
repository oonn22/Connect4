export class User {
    constructor(json) {
        if (!json) {
            this.username = undefined; //is unique, server verifies
            this.password = undefined; //very safe
            //password field only filled if this user is the client or trying to sign in, maybe moved in future
            this.friends = [];
            this.requests = [];
            this.online = false;
            this.signedIn = false;
            this.lastActive = undefined;
            this.privacy = 1; // 1 = public, 0 = friends only, -1 = private
            this.activeGames = [];
            this.gameRequests = [];
            this.history = [];
        } else {
            Object.assign(this, JSON.parse(json));
        }
    }
}