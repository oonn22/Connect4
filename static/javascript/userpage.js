let userPage = document.getElementById("users_page");
let addFriendBtn = document.getElementById("btn_add_friend");
let friendsBtn = document.getElementById("btn_friends");
let privacyBtn = document.getElementById("btn_privacy");
let activeGamesBtn = document.getElementById("btn_active_games");
let historyBtn = document.getElementById("btn_history");
let friendRequestsBtn = document.getElementById("btn_friend_requests");
let requestGameBtn = document.getElementById("btn_request_game");
let gameRequestsBtn = document.getElementById("btn_game_requests");
let privacyForm = document.getElementById("privacy_form_popup");
let publicRad = document.getElementById("public_rad");
let friendsOnlyRad = document.getElementById("friends_only_rad");
let privateRad = document.getElementById("private_rad");
let submitPrivacyBtn = document.getElementById("btn_submit_privacy");
let cancelPrivacyBtn = document.getElementById("btn_cancel_privacy");
let tableContent = document.getElementById("table_content");
let ddFriendCount = document.getElementById("dd_friend_count");

let xhttp;
let username;
let isFriendBool = false;

function enableButtons(friends, activeGames, history, friendRequests, gameRequests) {
    friendsBtn.disabled = !friends;
    activeGamesBtn.disabled = !activeGames;
    historyBtn.disabled = !history;
    friendRequestsBtn.disabled = !friendRequests;
    gameRequestsBtn.disabled = !gameRequests;
}

function isUser() {
    xhttp = new XMLHttpRequest();
    xhttp.open("GET","/users/user/isuser?username=" + username, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let res = JSON.parse(this.responseText);
            if (res) {
                usersOwnPage();
            } else {
                isFriend();
            }
        } else if (this.readyState == 4) {
            console.log("Unable to get is user: \n" + "username: " + username);
            randomUsersPage();
        }
    }
}

function isFriend() {
    xhttp = new XMLHttpRequest();
    xhttp.open("GET","/users/user/friends/isfriend?username=" + username, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let res = JSON.parse(this.responseText);
            if (res) {
                isFriendBool = true;
                friendsPage();
            } else {
                randomUsersPage();
            }
        } else if (this.readyState == 4) {
            console.log("Unable to get is friend: \n" + "username: " + username);
            randomUsersPage();
        }
    }
}

function usersOwnPage() {
    privacyBtn.style.display = "block";
    friendRequestsBtn.style.display = "block";
    gameRequestsBtn.style.display = "block";
    friendsBtn.style.display = "block";
    activeGamesBtn.style.display = "block";
    historyBtn.style.display = "block";
    privacyBtn.style.display = "block";
}

function friendsPage() {
    addFriendBtn.innerText = "Remove Friend";
    requestGameBtn.style.display = "block";
    addFriendBtn.style.display = "block";
    friendsBtn.style.display = "block";
    activeGamesBtn.style.display = "block";
    historyBtn.style.display = "block";
}

function randomUsersPage() {
    addFriendBtn.style.display = "block";
    requestGameBtn.style.display = "block";
    friendsBtn.style.display = "block";
    activeGamesBtn.style.display = "block";
    historyBtn.style.display = "block";
}

function friendRequestsClick() {
    tableContent.src = "/users/user/friends/friendrequests?page=1&limit=10";
    enableButtons(true, true, true, false, true);
}

function gameRequestsClick() {
    tableContent.src = "/users/user/gamerequests?page=1&limit=10";
    enableButtons(true, true, true, true, false);
}

function friendsClick() {
    tableContent.src = "/users/user/friends?page=1&limit=10&username=" + username;
    enableButtons(false, true, true, true, true);
}

function activeGamesClick() {
    tableContent.src = "/users/user/activegames?page=1&limit=10&username=" + username;
    enableButtons(true, false, true, true, true);
}

function gameHistoryClick() {
    tableContent.src = "/users/user/gamehistory?page=1&limit=10&username=" + username;
    enableButtons(true, true, false, true, true);
}

function addFriendClick() {
    if (isFriendBool) {
        xhttp = new XMLHttpRequest();
        xhttp.open("PUT","/users/user/friends/remove?username=" + username, true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send();

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                let res = JSON.parse(this.responseText);
                if (res.hasOwnProperty('success')) {
                    if (res.success) {
                        incFriendCount(-1);
                        addFriendBtn.innerText = 'Add Friend';
                        isFriendBool = false;
                        alert(res.msg);
                    } else {
                        alert("Request failed!\n" + res.msg);
                    }
                } else {
                    alert("Error making request, try again later.")
                    console.log("Unable to remove friend: " + username);
                }

                if (friendsBtn.disabled) {
                    friendsClick();
                }
            }
        }
    } else {
        xhttp = new XMLHttpRequest();
        xhttp.open("POST","/users/user/friends/createrequest?username=" + username, true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send();

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                let res = JSON.parse(this.responseText);
                if (res.hasOwnProperty('success')) {
                    if (res.success) {
                        alert(res.msg);
                    } else {
                        alert("Request failed!\n" + res.msg);
                    }
                } else {
                    alert("Error making request, try again later.")
                    console.log("Unable to make friend request to: " + username);
                }
            }
        }
    }
}

function incFriendCount(toInc) {
    let friends = Number.parseInt(ddFriendCount.innerText);
    ddFriendCount.innerText = (friends + toInc).toString()
}

function openForm() {
    privacyForm.style.display = 'block';
    privacyBtn.style.display = 'none';
}

function closeForm() {
    privacyForm.style.display = 'none';
    privacyBtn.style.display = 'block';
}

function submitForm() {
    let privacy = -2;
    if (publicRad.checked) {
        privacy = 1;
    } else if (friendsOnlyRad.checked) {
        privacy = 0;
    } else if (privateRad.checked) {
        privacy = -1;
    }

    if (privacy > -2) {
        xhttp = new XMLHttpRequest();
        xhttp.open("PUT","/users/user/privacy?privacy=" + privacy, true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send();

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                let res = JSON.parse(this.responseText);
                if (res.hasOwnProperty('success')) {
                    if (res.success) {
                        alert(res.msg);
                        closeForm();
                    } else {
                        alert("Request failed!\n" + res.msg);
                    }
                } else  {
                    alert("Error making request, try again later.")
                    console.log("Unable to make privacy change to: " + username);
                }
            }
        }
    } else {
        alert("Privacy settings unchanged.")
    }
}

addFriendBtn.addEventListener('click', () => {addFriendClick()});
requestGameBtn.addEventListener('click', () => {
    window.location.href = "/games/game/create?withuser=" + username;
});
privacyBtn.addEventListener('click', () => {openForm()});
submitPrivacyBtn.addEventListener('click', () => {submitForm()});
cancelPrivacyBtn.addEventListener('click', () => {closeForm()});

friendRequestsBtn.addEventListener('click', () => {friendRequestsClick()});
gameRequestsBtn.addEventListener('click', () => {gameRequestsClick()});
friendsBtn.addEventListener('click', () => {friendsClick()});
activeGamesBtn.addEventListener('click', () => {activeGamesClick()});
historyBtn.addEventListener('click', () => {gameHistoryClick()});


let URLparams = new URLSearchParams(window.location.search);

if (URLparams.has('username')) {
    username = URLparams.get('username');
} else {
    username = '';
}

console.log("username: " + username);
isUser();
activeGamesClick();