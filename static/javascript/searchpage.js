let searchTxt = document.getElementById("search_txt");
let searchResultsTbl = document.getElementById("search_results_table");
let prevBtn = document.getElementById("prev_btn");
let nextBtn = document.getElementById("next_btn");

let search = '';
let page = 1;
let limit = 10;

function makeAjaxSearchRequestAndOutput(toSearch, page, limit) {
    let url = '/users/search?page=' + page.toString() + '&limit=' + limit.toString() + '&query=' + toSearch;
    let results = [];

    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.setRequestHeader("accept", "application/json");
    xhttp.send();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText !== "null") {
                let results = JSON.parse(this.responseText);
                outputResults(results);
            }
        }
    }
}

function clearTable() {
    let rowCount = searchResultsTbl.rows.length;
    for (let i = rowCount - 1; i > 0; i--) {
        searchResultsTbl.deleteRow(i);
    }
}

function outputResults(results) {
    clearTable();
    if (results === undefined || results.length === 0) {
        let row = searchResultsTbl.insertRow();
        let user = row.insertCell(0);
        let status = row.insertCell(1);
        user.className = 'right_column';
        user.innerText = 'No Results Found!';
    } else {
        results.forEach((result) => {
            let row = searchResultsTbl.insertRow();
            let user = row.insertCell(0);
            let status = row.insertCell(1);

            user.className = 'right_column';
            status.className = 'left_column';
            user.innerHTML = "<a href='#' onclick='top.window.location.href=" + userProfileLink(result.username) + "'>" + result.username + "</a>";

            row.addEventListener('click', () => {window.open(userProfileLink(result.username), '_self')});

            let b = document.createElement('b')
            if (result.status) {
                b.className='green_text';
                b.innerText = 'Online';
            } else {
                b.className='red_player';
                b.innerText = 'Offline';
            }
            status.appendChild(b);
        });
    }
}

function userProfileLink(username) {
    return '/users/user?username=' + username;
}

searchTxt.addEventListener('keyup', function () {
    search = searchTxt.value;
    page=1;
    let results = makeAjaxSearchRequestAndOutput(search, page, limit);
});

let URLparams = new URLSearchParams(window.location.search);

if (URLparams.has('query')) {
    search = URLparams.get('query');
} else {
    search = '';
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

function nextClick() {
    page += 1;
    window.location.href = path + "?page=" + page.toString() + "&limit=" + limit.toString() + "&query=" + search;
}

function prevClick() {
    page -= 1;
    window.location.href = path + "?page=" + page.toString() + "&limit=" + limit.toString() + "&query=" + search;
}

prevBtn.addEventListener('click', () => {prevClick()});
nextBtn.addEventListener('click', () => {nextClick()});
