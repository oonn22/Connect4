let prevBtn = document.getElementById("prev_btn");
let nextBtn = document.getElementById("next_btn");
let createBtn = document.getElementById("create_game_btn")

let URLparams = new URLSearchParams(window.location.search);
let path = window.location.pathname;
let username;
let page;
let limit;

if (URLparams.has('username')) {
    username = URLparams.get('username');
} else {
    username = '';
}

if (URLparams.has('page')) {
    try {
        page = parseInt(URLparams.get('page'));
    } catch (err) {
        console.log(err)
        page = 1;
    }
} else {
    page = 1;
}

if (URLparams.has('limit')) {
    try {
        limit = parseInt(URLparams.get('limit'));
    } catch (err) {
        console.log(err)
        limit = 10;
    }
} else {
    limit = 10;
}

if (page === 1) {
    prevBtn.disabled = true;
}

function nextClick() {
    page += 1;
    window.location.href = path + "?page=" + page.toString() + "&limit=" + limit.toString() + "&username=" + username;
    if (page > 1) {
        prevBtn.disabled = false;
    }
}

function prevClick() {
    page -= 1;
    window.location.href = path + "?page=" + page.toString() + "&limit=" + limit.toString()+ "&username=" + username;
    if (page === 1) {
        prevBtn.disabled = true;
    }
}

function createGameClick() {
    top.window.location.href = '/games/game/create';
}

prevBtn.addEventListener('click', () => {prevClick()});
nextBtn.addEventListener('click', () => {nextClick()});

if (createBtn) {
    createBtn.addEventListener('click', () => {createGameClick()});
}