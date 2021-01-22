
let xhttp;

function acceptFriendRequest(username) {
    putRequest("/users/user/friends/accept?username=" + username, JSON.stringify({}));
}

function rejectFriendRequest(username) {
    putRequest("/users/user/friends/reject?username=" + username, JSON.stringify({}));
}

function acceptGameRequest(gameRequest) {
    putRequest("/games/accept", JSON.stringify(gameRequest));
}

function rejectGameRequest(gameRequest) {
    putRequest("/games/reject", JSON.stringify(gameRequest));
}

function putRequest(url, toSend) {
    xhttp = new XMLHttpRequest();
    xhttp.open("PUT", url, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(toSend);

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            let res = JSON.parse(this.responseText);
            if (res.hasOwnProperty('success')) {
                if (res.success) {
                    alert(res.msg);
                } else {
                    alert("Unable to process!\n" + res.msg);
                }
            } else {
                alert('error making request!');
                console.log('error url: ' + url);
            }
            location.reload();
        }
    }
}