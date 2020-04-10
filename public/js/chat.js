socket = io();



const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');

const $locFormButton = document.querySelector('#geo-location');

const $messages = document.querySelector("#messages");
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('fromServer', (msg) => {
    console.log(msg);
    const message = Mustache.render(messageTemplate, {
        username: msg.username,
        message:msg.text,
        createdAt:moment(msg.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', message);
    autoScroll()
});

socket.on('locationMessage', (loc) => {
    console.log(loc)
    const html = Mustache.render(locationTemplate, {
        username: loc.username,
        location: loc.url,
        createdAt: moment(loc.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll()
})

socket.on('roomData', ({room, users})=> {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e)=> {
    e.preventDefault();
    //message = document.querySelector('input').value;
    $messageFormButton.setAttribute('disabled', 'disabled');
    message = e.target.elements.msg.value;
    socket.emit('clientMessage', message, (error)=> {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error) {
            return console.log(error);
        }
        console.log("Message delivered!");
    });
});

$locFormButton.addEventListener('click', ()=> {

    if(!navigator.geolocation) {
        alert('Browser is not supporting geolocation');
    }
    else {
        $locFormButton.setAttribute('disabled', 'disabled');
        navigator.geolocation.getCurrentPosition((position)=> {
            socket.emit('sendLocation', position.coords.latitude, position.coords.longitude, ()=> {
                $locFormButton.removeAttribute('disabled');
                console.log("Location shared!");
            });
        })
    }
});

socket.emit('join', {username, room}, (error)=> {
    if(error) {
        alert(error)
        location.href = '/'
    }
})