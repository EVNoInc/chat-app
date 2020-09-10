const socket = io();


// Elements
const messages = document.querySelector('#messages');
const sendMsgButton = document.querySelector('#send-msg-btn');
const sendLocButton = document.querySelector('#send-loc-btn');
const messageField = document.querySelector('#message');
const messageForm = document.querySelector('#message-form');
const sidebare = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New Message Element
    const newMessage = messages.lastElementChild;

    // Get Height of New Message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    //  Vsisible Heiht
    const visibleHeight = messages.offsetHeight;

    // Height of messages container
    const containerHeight = messages.scrollHeight;

    //  How far scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }


}

socket.on('message', (message) => {

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("hh:mm:ss a")
    });

    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("hh:mm:ss a")
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        users,
        room,
    });

    sidebar.innerHTML = html;

    console.log(room);
    console.log(users);
});


messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // disable form
    sendMsgButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        // enable form
        sendMsgButton.removeAttribute('disabled');
        messageField.value = '';
        messageField.focus();

        if (error) {
            return console.log(error);
        }

        console.log('The message was delivered', message);
    });
});

sendLocButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    sendLocButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('sendLocation', { latitude, longitude }, () => {
            console.log('message recieved captain');
            sendLocButton.removeAttribute('disabled');
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});