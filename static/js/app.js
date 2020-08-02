let connected = false;

const usernameInput = document.getElementById('username');
const roomIdInput = document.title;
const joinLeaveButton = document.getElementById('join_leave');
const container = document.getElementById('container');
const participantCount = document.getElementById('count');
let room;

joinLeaveButton.addEventListener('click', connectButtonHandler);

let mutedAudio = false;
let mutedScreen = false; 

addLocalVideo();

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById('local-video');

        video.appendChild(track.attach());

        const buttonDiv = document.createElement('div');
        buttonDiv.classList.add('buttonElements');

        // Create the mute audio and mute screen buttons here b/c it must be added to local video
        const muteAudioButton = createMuteAudioButton();
        const muteScreenButton = createMuteScreenButton();

        buttonDiv.appendChild(muteAudioButton);
        buttonDiv.appendChild(muteScreenButton);

        video.append(buttonDiv);

    });
};

function connectButtonHandler(event) {
    event.preventDefault();
    if (!connected) {
        let username = usernameInput.value;
        let room_id = roomIdInput;
        if (!username) {
            alert('Enter your name before connecting');
            return;
        }
        joinLeaveButton.disabled = true;
        joinLeaveButton.innerHTML = 'Connecting...';
        connect(username, room_id).then(() => {
            joinLeaveButton.innerHTML = 'Leave call';
            joinLeaveButton.disabled = false;
        }).catch(() => {
            alert('Connection failed. Is the backend running?');
            joinLeaveButton.innerHTML = 'Join call';
            joinLeaveButton.disabled = false;    
        });
    }
    else {
        disconnect();
        joinLeaveButton.innerHTML = 'Join call';
        connected = false;
    }
};

// pass in username and room_id for validation to enter that room
function connect(username, room_id) {
    console.log("Connecting with room_id:", room_id);
    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        fetch('/enterroom', {
            method: 'POST',
            body: JSON.stringify(
                {'username': username,
                'room_id': room_id
            })
        }).then(res => res.json()).then(data => {
            // join video call
            console.log("Joining room");
            return Twilio.Video.connect(data.token);
        }).then(_room => {
            room = _room;
            room.participants.forEach(participantConnected);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            connected = true;
            updateParticipantCount();

            configureMuteAudioButton(room);
            configureMuteScreenButton(room);

           resolve();

        }).catch(() => {
            reject();
        });
    });
    return promise;
};

function configureMuteAudioButton(room) {
    const muteAudioButton = document.getElementById('muteAudioButton');
    muteAudioButton.removeAttribute('hidden');

    muteAudioButton.addEventListener("click", function(e) {
        let button = event.currentTarget;
        if (mutedAudio) {
           console.log("Unmute");
           console.log("First child:", button.firstChild);
           button.firstChild.classList.remove('fa-microphone-slash');
           room.localParticipant.audioTracks.forEach(publication => {
            publication.track.enable();
          });
          button.firstChild.classList.add('fa-microphone');
          mutedAudio = false;
       } else {
           console.log("Mute");
           console.log("First child:", button.firstChild);
           button.firstChild.classList.remove('fa-microphone');
           room.localParticipant.audioTracks.forEach(publication => {
               publication.track.disable();
           });
           button.firstChild.classList.add('fa-microphone-slash');
           mutedAudio = true;
       }
   });
}

function configureMuteScreenButton(room) {
    const muteScreenButton = document.getElementById('muteScreenButton');
    muteScreenButton.removeAttribute('hidden');

    muteScreenButton.addEventListener("click", function(e) {
        let button = e.currentTarget;
        if (mutedScreen) {
            console.log("Unmute screen");
            button.firstChild.classList.remove('fa-eye-slash');
            room.localParticipant.videoTracks.forEach(publication => {
                publication.track.enable();
            });
            button.firstChild.classList.add('fa-eye');
            mutedScreen = false;
        } else {
            console.log("Mute screen");
            button.firstChild.classList.remove('fa-eye');
            room.localParticipant.videoTracks.forEach(publication => {
                publication.track.disable();
            });
            button.firstChild.classList.add('fa-eye-slash');
            mutedScreen = true; 
        }
   });
}

function updateParticipantCount() {
    if (!connected)
        participantCount.innerHTML = 'Disconnected.';
    else
        participantCount.innerHTML = (room.participants.size + 1) + ' joined';
};

function participantConnected(participant) {
    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    participantDiv.setAttribute('class', 'participant');

    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement('div');
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    updateParticipantCount();
};

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
};

function trackSubscribed(div, track) {
    div.appendChild(track.attach());
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => element.remove());
};

function disconnect() {
    room.disconnect();
    while (container.lastChild.id != 'local')
        container.removeChild(container.lastChild);
    joinLeaveButton.innerHTML = 'Join call';
    connected = false;

    // Remove the mute buttons 
    let muteAudioButton = document.getElementById('muteAudioButton');
    muteAudioButton.setAttribute('hidden','');
    let muteScreenButton = document.getElementById('muteScreenButton');
    muteScreenButton.setAttribute('hidden','');

    updateParticipantCount();
};

function createMuteAudioButton() {
    const muteAudioButton = document.createElement('button');
    muteAudioButton.classList.add('circle-button');
    muteAudioButton.setAttribute('id','muteAudioButton');
    muteAudioButton.setAttribute('hidden', '');
    const audioIcon = document.createElement('i');
    audioIcon.setAttribute('class', 'fa fa-microphone icon');
    muteAudioButton.appendChild(audioIcon);
    return muteAudioButton;
}

function createMuteScreenButton() {
    const muteScreenButton = document.createElement('button');
    muteScreenButton.classList.add('circle-button');
    muteScreenButton.setAttribute('id','muteScreenButton');
    muteScreenButton.setAttribute('hidden','');
    const screenIcon = document.createElement('i');
    screenIcon.setAttribute('class', 'fa fa-eye icon');
    muteScreenButton.appendChild(screenIcon);
    return muteScreenButton
}



