let msgTable = document.getElementById("msg_table");
let chatText = document.getElementById("chat_text");
let sendBtn = document.getElementById("send_btn");

let GAMEID;

const socket = io();

socket.on('msg', (msg) => {
    postMessageToChat(msg);
});

function postMessageToChat(msg) {
    let scrollDown = false;

    if (document.body.scrollHeight - document.body.scrollTop - document.body.clientHeight < 1) {
        scrollDown = true;
    }

    let row = msgTable.insertRow(-1);
    let n = row.insertCell(0)
    let m = row.insertCell(1);

    n.style.textAlign = 'left';
    n.style.verticalAlign = 'top';
    n.innerHTML = msg.username + ': ';
    m.style.overflowWrap = 'break-word'
    m.innerHTML = msg.msg;

    if (scrollDown) {
        window.scrollTo(0, document.body.scrollHeight);
    }
}

sendBtn.addEventListener('click', () => {
    socket.emit('sendMsg', chatText.value, GAMEID);
    chatText.value = '';
    window.scrollTo(0, document.body.scrollHeight);
});

let URLparams = new URLSearchParams(window.location.search);

if (URLparams.has('gameid')) {
    GAMEID = URLparams.get('gameid');
} else {
    GAMEID = '';
}

socket.emit('joinChat', GAMEID);