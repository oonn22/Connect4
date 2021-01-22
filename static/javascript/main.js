//UI elements
let usersBtn = document.getElementById("users_btn");
let homeBtn = document.getElementById("home_btn");
let gameBtn = document.getElementById("game_btn");
let loginTopBtn = document.getElementById("login_top_btn");
let searchTopBtn = document.getElementById("search_top_btn");
let searchTopTxt = document.getElementById("search_top_txt");

let xhttp;

function setTopLoginText() {
    xhttp = new XMLHttpRequest();
    xhttp.open("GET","/sessions/status", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let res = JSON.parse(this.responseText);
            if (res.success) {
                loginTopBtn.innerText = 'Logout';
            } else {
                loginTopBtn.innerText = 'Login';
            }
        } else if (this.readyState == 4) {
            loginTopBtn.innerText = 'Users Page'
        }
    }
}

function topLoginClick() {
    xhttp = new XMLHttpRequest();
    xhttp.open("GET","/sessions/status", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let res = JSON.parse(this.responseText);
            if (res.success) {
                logout();
            } else {
                window.open("/users", "_self");
            }
        } else if (this.readyState == 4) {
            window.open("/users", "_self");
        }
    }
}

function logout() {
    xhttp = new XMLHttpRequest();
    xhttp.open("DELETE","/sessions/logout", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            alert("Successfully Logged Out!");
            window.open("/users", "_self");
        } else if (this.readyState == 4) {
            alert("Error Logging Out! refreshing page.")
            window.open("/users", "_self");
        }
    }
}

function searchBtnClick() {
    window.open("/users/search?page=1&limit=10&query=" + searchTopTxt.value, "_self");
}

setTopLoginText();
loginTopBtn.addEventListener('click', topLoginClick);
searchTopBtn.addEventListener('click', searchBtnClick);