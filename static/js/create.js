// Add click event to Create Workout button
const submitButton = document.getElementById("create-button");
submitButton.addEventListener('click', (event) => {

    // Get the workout schedule info
    workoutName = document.getElementById('workout-name-field').value;
    startTime = document.getElementById('start-time-input').value;
    endTime = document.getElementById('end-time-input').value;

    // Get the exercises info 
    let exercisesArray = [];
    const formElements = document.getElementsByClassName('input-row');
    for (i = 0; i < formElements.length; i++) {
        index = i + 1;
        let exerciseDict = fillUpExerciseDict(index);
        exercisesArray.push(exerciseDict);
    }

    // Connect to app.py to upload workout info to db
    fetch('/createworkout', {
        method: 'POST',
        body: JSON.stringify(
            {
                'workoutName': workoutName,
                'startTime': startTime,
                'endTime': endTime,
                'exercises': exercisesArray
            })
    })
});

function fillUpExerciseDict(index) {
    let exerciseDict = {};
    exerciseDict["ex_name"] = document.getElementById(`exercise-name${index}`).value;
    exerciseDict["sets_min"] = document.getElementById(`sets${index}`).value;
    exerciseDict["reps_sec"] = document.getElementById(`reps${index}`).value;
    exerciseDict["ex_type"] = document.getElementById(`exercise-type${index}`).value;
    return exerciseDict;
}

// Setup selector value change listener on first exercise selector
setupSelectorChangeListener(1);

// Create new exercise group whenever add button is clicked 
const addButton = document.getElementById('add-button');
addButton.addEventListener('click', (event) => {

    // See how many current forms there are
    const existingGroups = document.getElementsByClassName("exercise-type")
    const num = existingGroups.length

    // The parent container 
    const container = document.getElementById('add-exercises');

    let formDiv = document.createElement('div');
    formDiv.setAttribute('class', 'form-row input-row');

    // Create exercise name form group 
    createExerciseNameGroup(formDiv, num+1);

    // Create sets/min number form group 
    createSetsMinNumberGroup(formDiv, num+1);

    // Create reps/sec number form group 
    createRepsSecNumberGroup(formDiv, num+1);

    // Create exercise type selector
    createSelectorGroup(formDiv, num+1);

    container.appendChild(formDiv);

    setupSelectorChangeListener(num+1);

});

function setupSelectorChangeListener(index) {
    const selectElement = document.getElementById(`exercise-type${index}`)
    selectElement.addEventListener('change', (event) => {
        if (event.target.value == 'Sets') {
            document.getElementById(`setslabel${index}`).innerHTML = "Sets"
            document.getElementById(`repslabel${index}`).innerHTML = "Reps"
        } else {
            document.getElementById(`setslabel${index}`).innerHTML = "Minutes"
            document.getElementById(`repslabel${index}`).innerHTML = "Seconds"
        }
    });
}

// Creator functions 
function createExerciseNameGroup(parentDiv, index) {
    let nameDiv = document.createElement('div');
    nameDiv.setAttribute('class', 'form-group col-md-5');
    let label = document.createElement('label');
    label.setAttribute('for', `exercise-name${index}`);
    label.innerHTML = 'Exercise name';
    let input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('class', 'form-control');
    input.setAttribute('id', `exercise-name${index}`);
    input.setAttribute('required','');
    nameDiv.appendChild(label);
    nameDiv.appendChild(input);
    parentDiv.appendChild(nameDiv);
}

function createSetsMinNumberGroup(parentDiv, index) {
    let numberDiv = document.createElement('div');
    numberDiv.setAttribute('class', 'form-group col-md-2');
    let numLabel = document.createElement('label');
    numLabel.setAttribute('for', `sets${index}`);
    numLabel.setAttribute('id', `setslabel${index}`)
    numLabel.innerHTML = 'Sets';
    let numInput = document.createElement('input');
    numInput.setAttribute('type', 'number');
    numInput.setAttribute('class', 'form-control');
    numInput.setAttribute('min', '0');
    numInput.setAttribute('id', `sets${index}`);
    numInput.setAttribute('value', '0');
    numInput.setAttribute('oninput', "validity.valid||(value='0');");
    numberDiv.appendChild(numLabel);
    numberDiv.appendChild(numInput);
    parentDiv.appendChild(numberDiv);
}

function createRepsSecNumberGroup(parentDiv, index) {
    let repsDiv = document.createElement('div');
    repsDiv.setAttribute('class', 'form-group col-md-2');
    let repsLabel = document.createElement('label');
    repsLabel.setAttribute('for', `reps${index}`);
    repsLabel.setAttribute('id', `repslabel${index}`)
    repsLabel.innerHTML = 'Reps';
    let repsInput = document.createElement('input');
    repsInput.setAttribute('type', 'number');
    repsInput.setAttribute('class', 'form-control');
    repsInput.setAttribute('id', `reps${index}`);
    repsInput.setAttribute('min', '0');
    repsInput.setAttribute('value', '0');
    repsInput.setAttribute('oninput', "validity.valid||(value='0');");
    repsDiv.appendChild(repsLabel);
    repsDiv.appendChild(repsInput);
    parentDiv.appendChild(repsDiv);
}

function createSelectorGroup(parentDiv, index) {
    let selectDiv = document.createElement('div');
    selectDiv.setAttribute('class', 'form-group col-md-3');

    let selectLabel = document.createElement('label');
    selectLabel.setAttribute('for', `exercise-type${index}`);
    selectLabel.innerHTML = 'Type';

    let selector = document.createElement('select');
    selector.setAttribute('class', 'exercise-type form-control');
    selector.setAttribute('id', `exercise-type${index}`);
    let option1 = document.createElement('option');
    option1.value = 'Sets';
    option1.innerHTML = 'Sets';
    let option2 = document.createElement('option');
    option2.value = 'Time';
    option2.innerHTML = 'Time';

    selector.appendChild(option1);
    selector.appendChild(option2);

    selectDiv.appendChild(selectLabel);
    selectDiv.appendChild(selector);

    parentDiv.appendChild(selectDiv);
}