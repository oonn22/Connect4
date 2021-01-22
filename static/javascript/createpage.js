let yesRad = document.getElementById("yes_rad");
let noRad = document.getElementById("no_rad");
let withUserRad = document.getElementById("with_user_rad");
let lfgRad = document.getElementById("lfg_rad");
let withUserForm = document.getElementById("with_user_form");
let withSpecificUserForm = document.getElementById("with_specific_user");
let opponentText = document.getElementById("opponent_text");
let privacyForm = document.getElementById("privacy_form");
let publicRad = document.getElementById("public_rad");
let friendsOnlyRad = document.getElementById("friends_only_rad");
let privateRad = document.getElementById("private_rad");
let submitBtn = document.getElementById("submit_btn");

function toggleForms() {
    if (yesRad.checked) {
        withUserForm.style.display = 'none';
        privacyForm.style.display = 'none';
        withSpecificUserForm.style.display = 'none';
        submitBtn.innerText = 'Start Game';
    } else if (withUserRad.checked) {
        withSpecificUserForm.style.display = 'block';
        withUserForm.style.display = 'block';
        privacyForm.style.display = 'block';
        submitBtn.innerText = 'Send Invite';
    } else if (lfgRad.checked) {
        withSpecificUserForm.style.display = 'block';
        withUserForm.style.display = 'none';
        privacyForm.style.display = 'block';
        submitBtn.innerText = 'Look for Game';
    }
}

function submit() {
    if (yesRad.checked) {
        window.location.href = '/games/game/singleplayer'
    } if (lfgRad.checked) {
        let xhttp = new XMLHttpRequest();
        let privacy = {};

        if (publicRad.checked) {
            privacy.privacy = 1;
        } else if (friendsOnlyRad.checked) {
            privacy.privacy = 0;
        } else {
            privacy.privacy = -1;
        }

        xhttp.open("POST","/games/lfg", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(privacy));

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                let res = JSON.parse(this.responseText);
                if (res.hasOwnProperty('success')) {
                    if (res.success) {
                        alert(res.msg);
                        window.location.href='/games';
                    } else {
                        alert("Request failed!\n" + res.msg);
                    }
                } else  {
                    alert("Error making request, try again later.")
                    console.log("Unable to make lfg request");
                }
            }
        }

    } else if (opponentText.value !== ''){
        let xhttp = new XMLHttpRequest();
        let request = {};

        request.username = opponentText.value;

        if (publicRad.checked) {
            request.privacy = 1;
        } else if (friendsOnlyRad.checked) {
            request.privacy = 0;
        } else {
            request.privacy = -1;
        }

        xhttp.open("POST","/games/game/createrequest", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(request));

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                let res = JSON.parse(this.responseText);
                if (res.hasOwnProperty('success')) {
                    if (res.success) {
                        alert(res.msg +
                            "\nGame will appear in your active games when your opponent accepts your request!");
                        window.location.href='/games';
                    } else {
                        alert("Request failed!\n" + res.msg);
                    }
                } else  {
                    alert("Error making request, try again later.")
                    console.log("Unable to make game request to: " + opponentText.value);
                }
            }
        }
    } else {
        alert("Please enter a valid opponent username!");
    }
}

yesRad.addEventListener('click', toggleForms);
noRad.addEventListener('click', toggleForms);
withUserRad.addEventListener('click', toggleForms);
lfgRad.addEventListener('click', toggleForms);
submitBtn.addEventListener('click', () => {submit()});