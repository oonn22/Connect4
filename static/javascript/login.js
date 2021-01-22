let userLoginPage = document.getElementById("user_login_page");
let loginBtn = document.getElementById("login_btn");
let createBtn = document.getElementById("create_btn");
let unLoginTxt = document.getElementById("un_login_txt");
let pwLoginTxt = document.getElementById("pw_login_txt");
let unCreateTxt = document.getElementById("un_create_txt");
let pwCreateTxt = document.getElementById("pw_create_txt");
let pwConfirmCreateTxt = document.getElementById("pw_confirm_create_txt");

let xhttp;

function login(username, password) {
    xhttp = new XMLHttpRequest();
    xhttp.open("POST","sessions/login", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({username: username, password: password}));

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            alert("Successful Login!");
            window.open("../users", "_self");
        } else if (this.readyState == 4 && this.status == 401) {
            alert("Invalid Credentials!");
            unLoginTxt.value = '';
            pwLoginTxt.value = '';
        }
    }
}

function createAccount(username, pw, confirmPw) {
    if (pw === confirmPw && username.length >= 4) {
        let user_data = JSON.stringify({username: username, password: pw});
        xhttp = new XMLHttpRequest();
        xhttp.open("POST","users/user/create", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(user_data);

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                let res = JSON.parse(this.responseText);
                if (res.hasOwnProperty('success')) {
                    if (res.success) {
                        alert("Successfully Created Account!");
                        login(username, pw);
                    } else {
                        alert("Creation unsuccessful: " + res.msg);
                    }
                } else {
                    alert("An Error Occurred!");
                }
            }
        }
    } else {
        if (pw !== confirmPw) {
            alert("Passwords do not match!");
            pwCreateTxt.value = '';
            pwConfirmCreateTxt.value = '';
        } else {
            alert("username needs to be greater than 3 characters!");
            unCreateTxt.value = '';
        }
    }
}

loginBtn.addEventListener('click', function() {login(unLoginTxt.value, pwLoginTxt.value);});
createBtn.addEventListener('click', function() {createAccount(unCreateTxt.value, pwCreateTxt.value, pwConfirmCreateTxt.value);});