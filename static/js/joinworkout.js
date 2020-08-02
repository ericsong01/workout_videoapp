// Store workout_id in local storage so app.js can pull the workout_id to connect to the room
document.title = localStorage["w_id"];

// Configure current exercise highlighter for first element 
highlightFirstExercise();

function highlightFirstExercise() {
    let exercises = document.getElementsByClassName('exercise-group');
    exercises[0].classList.add('highlight-ex');

    if (exercises[0].classList.contains('sets-reps')) {
        // Make visible the selector box and label for first element
        document.getElementById('selector_label_1').removeAttribute('hidden');
        document.getElementById('selector_1').removeAttribute('hidden'); 
    } else {
        // Make visible the timer button 
        document.getElementById('play_button_1').removeAttribute('hidden');
    }
}

// When checkbox is checked 
function selectedDone(event) {
    // Get id of selector 
    let selectorId = event.target.id;
    let index = selectorId.trimLeft('selector_');
    
    // Hide selector on current object
    document.getElementById(selectorId).setAttribute('hidden','');
    document.getElementById(`selector_label_${index}`).setAttribute('hidden','');

    // Remove current div's highlighter
    document.getElementById(`group${index}`).classList.remove('highlight-ex');

    shiftHighlightToNextExercise(index);

}

function shiftHighlightToNextExercise(index) {
    // Shift to the next index
    nextIndex = parseInt(index) + 1
    let nextExerciseGroup = document.getElementById(`group${nextIndex}`);
    console.log(`Getting new id: group${nextIndex}`);
    if (nextExerciseGroup != null) {
        nextExerciseGroup.classList.add('highlight-ex');
        if (nextExerciseGroup.classList.contains('sets-reps')) {
            document.getElementById(`selector_label_${nextIndex}`).removeAttribute('hidden');
            document.getElementById(`selector_${nextIndex}`).removeAttribute('hidden'); 
        } else {
            document.getElementById(`play_button_${nextIndex}`).removeAttribute('hidden');
        }
    };
}

// Configure timer 
let timeText;
let trimmedText;
let splitText;
let minutes;
let seconds;

let exerciseTimer;
let globalIndex;

let playing = false; 

function handleTimerClick(event) {

    console.log("Clicking timer");
    console.log("Playing:" + playing);

    // Get play button index
    id = event.target.id;
    globalIndex = parseInt(id.trimLeft('play_button_'));

    // Get minutes and seconds from text 
    timeText = document.getElementById(`time_label_${globalIndex}`).innerHTML
    trimmedText = timeText.trimRight(' sec');
    splitText = trimmedText.split(' min ');
    minutes = parseInt(splitText[0]);
    seconds = parseInt(splitText[1]);

    timeText = minutes + " min " + seconds + " sec";

    playButtonIcon = document.getElementById(`play_button_${globalIndex}_icon`);

    if (playing) {
        // Change to play icon 
        playButtonIcon.classList.remove("fa-pause");
        playButtonIcon.classList.add("fa-play");

        // Stop the clock 
        clearInterval(exerciseTimer);
        playing = false;
    } else {
        // Change to pause icon 
        playButtonIcon.classList.remove("fa-play");
        playButtonIcon.classList.add("fa-pause");

        // Start clock 
        exerciseTimer = setInterval(timer, 1000);
        playing = true;
    };

};

// Countdown timer 
function timer() {
    if (seconds > 0) {
            seconds -= 1;
            document.getElementById(`time_label_${globalIndex}`).innerHTML = minutes + " min " + seconds + " sec";
    } else {
        if (minutes >= 1) {
            minutes -= 1;
            seconds = 59;
            document.getElementById(`time_label_${globalIndex}`).innerHTML = minutes + " min " + seconds + " sec";
        } else {
            minutes = 0;
            seconds = 0;
            document.getElementById(`time_label_${globalIndex}`).innerHTML = minutes + " min " + seconds + " sec";
            clearInterval(exerciseTimer);
            playing = false;
            moveExerciseHighlighterFromTimer();
        }
    }
};

function moveExerciseHighlighterFromTimer() {
    // Hide timer button on current object 
    console.log("moving timer");
    let timerButton = document.getElementById(`play_button_${globalIndex}`);
    timerButton.setAttribute('hidden','');

    // Remove current div's highlighter 
    document.getElementById(`group${globalIndex}`).classList.remove('highlight-ex');

    // Shift to the next index
    shiftHighlightToNextExercise(globalIndex);
}

String.prototype.trimLeft = function(chars) {
    if (chars === undefined)
    chars = "\s";

    return this.replace(new RegExp("^[" + chars + "]+"), "");
};

String.prototype.trimRight = function(chars) {
    if (chars === undefined)
    chars = "\s";

    return this.replace(new RegExp("[" + chars + "]+$"), "");
};