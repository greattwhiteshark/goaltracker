let db;
const request = indexedDB.open('GoalTrackerV2', 1);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('goals')) {
        const goalStore = db.createObjectStore('goals', { keyPath: 'goalId', autoIncrement: true });
        goalStore.createIndex('isSuccess', 'isSuccess', { unique: false });
    }
};

// Function to check for an ongoing goal on app load
function checkOngoingGoal() {
    const transaction = db.transaction('goals', 'readonly');
    const goalStore = transaction.objectStore('goals');
    const request = goalStore.getAll();

    request.onsuccess = (event) => {
        const goals = event.target.result;
        const ongoingGoal = goals.find(goal => goal.goalState == 'inprogress');

        if (ongoingGoal) {
            showCurrentGoalName(ongoingGoal);
            showChallanges(currentGoal);
        } else {
            // No ongoing goal, show the goal input form
            goalForm.style.display = 'block';
            currentGoalForm.style.display = 'none';
        }
    };

    request.onerror = () => {
        console.error('Error retrieving goals.');
    };
}

// Handling db open success
request.onsuccess = (event) => {
    db = event.target.result;
    checkOngoingGoal(); // Check for an ongoing goal on app load
    showAllGoals(); // Load and display goal history
};

request.onerror = () => {
    console.error('Error opening database.');
};

// All variable declarations
const savegoalButton = document.getElementById('savegoal');
const goalNameInput = document.getElementById('goalname');
const goalForm = document.getElementById('goal-form');
const currentGoalForm = document.getElementById('current-goal');
const currentGoalName = document.getElementById('current-goal-name');
const remarks = document.getElementById('challangename');

const multipleActionBtn = document.getElementById('multiple-action-btn');
const challengesList = document.getElementById('challenges-list');
const challanges = document.getElementById('challanges');
const currentGoalDetails = document.getElementById('current-goal-details');
const goalChallangeData = document.getElementById('goal-challange-history');
const goalChallangeHeading = document.getElementById('goalChallangeHeading');

// Constants for dropdown
const MILESTONE = 'milestone';
const CHALLENGE = 'challenge';
const QUIT = 'quit';
const BREAK = 'planned break';
const CONTINUE = 'continue';
const COMPLETED_SUCCESSFULLY = 'completed';

// Goal state
const GOAL_FAILED = 'failed';
const GOAL_INPROGRESS = 'inprogress';
const GOAL_SUCCESS = 'success';

let currentGoal;

savegoalButton.addEventListener('click', () => {
    console.log('save goal');
    const goalName = goalNameInput.value.trim();
    if(!goalName) {
        alert('enter goal');
        return;
    }
    if (goalName) {
        currentGoal = {
            goalName: goalName,
            startTime: new Date().toISOString(),
            actions: [],
            goalState: GOAL_INPROGRESS
        };
        saveGoal(currentGoal);
        showAllGoals();
    }
});

function clearData() {
    remarks.value = '';
}

function saveGoal(goal) {
    const transaction = db.transaction('goals', 'readwrite');
    const goalStore = transaction.objectStore('goals');
    const request = goalStore.add(goal);

    request.onsuccess = (event) => {
        goal.goalId = event.target.result; // Assign the generated ID to the goal
        showCurrentGoalName(goal);
    };

    goalForm.style.display = 'none';
    currentGoalForm.style.display = 'block';
    currentGoalName.textContent = `Your current goal is ${goal.goalName}`;
    goalNameInput.value = '';
    challengesList.classList.add('d-none');
}

multipleActionBtn.addEventListener('click', () => {


    let actionType = document.getElementById('selectedAction').value;
    let remarksValue = remarks.value.trim(); // Renamed to avoid conflict

    if(!actionType) {
        alert('select the dropdown');
        return;
    }
    if(!remarksValue) {
        alert('enter remarks');
        return;
    }

    if (remarksValue) {
        let action = {
            remarks: remarksValue,
            startTime: new Date().toISOString(),
            actionType: actionType
        };

        if (actionType == QUIT) {
            currentGoal.goalState = GOAL_FAILED;
            goalForm.style.display = 'block';
            currentGoalForm.style.display = 'none';
        } else if(actionType == COMPLETED_SUCCESSFULLY) {
            currentGoal.goalState = GOAL_SUCCESS;
            goalForm.style.display = 'block';
            currentGoalForm.style.display = 'none';
            //checkOngoingGoal(); // Check for an ongoing goal on app load
        } else {
            currentGoal.goalState = GOAL_INPROGRESS;
        }

        currentGoal.actions.push(action);
        commonFunctionality();
    }
});

function commonFunctionality() {
    updateGoal(currentGoal);
    showChallanges(currentGoal);
    showAllGoals();
    clearData();
}

function updateGoal(goal) {
    const transaction = db.transaction('goals', 'readwrite');
    const goalStore = transaction.objectStore('goals');
    goalStore.put(goal);
}

function showChallanges(goal) {
    const challengesList = document.getElementById('challenges-list');
    challengesList.value = '';
    const challanges = document.getElementById('challanges');
    challanges.innerHTML = ''; // Clear previous challenges
    challengesList.classList.remove('d-none'); // Show challenges list

    let prevChallangeTime = goal.startTime;
    let timeDifference = '';
    let prevMileStoneTime = goal.startTime;
    let prevBreakTime = null;

    goal.actions.forEach(action => {
        let listItem = document.createElement('li'); // Define listItem here to avoid reference errors

        if (action.actionType == CHALLENGE) {
            timeDifference = getTimeDifference(prevChallangeTime, action.startTime);
            prevChallangeTime = action.startTime;
            listItem.innerHTML = `<span class="badge bg-primary ms-2">${action.actionType}</span> ${action.remarks} - ${new Date(action.startTime).toLocaleString()} -  time between two challenges: ${timeDifference}`;
            listItem.classList.add('list-group-item', 'list-group-item-primary');
        } else if (action.actionType == MILESTONE) {
            timeDifference = getTimeDifference(prevMileStoneTime, action.startTime);
            prevMileStoneTime = action.startTime;
            listItem.innerHTML = `<span class="badge bg-primary ms-2">${action.actionType}</span>  ${action.remarks} - ${new Date(action.startTime).toLocaleString()} - time between two mile stones: ${timeDifference}`;
            listItem.classList.add('list-group-item', 'list-group-item-success');
        } else if (action.actionType == BREAK) {
            prevBreakTime = action.startTime;
            listItem.innerHTML = `- <span class="badge bg-primary ms-2">${action.actionType}</span>  ${action.remarks} - ${new Date(action.startTime).toLocaleString()} `;
            listItem.classList.add('list-group-item', 'list-group-item-light');
        } else if (action.actionType == CONTINUE) {
            timeDifference = getTimeDifference(prevBreakTime, action.startTime);
            prevBreakTime = null;
            listItem.innerHTML = `- <span class="badge bg-primary ms-2">${action.actionType}</span>  ${action.remarks} - ${new Date(action.startTime).toLocaleString()} - You have taken break for : ${timeDifference}`;
            listItem.classList.add('list-group-item', 'list-group-item-secondary');
        } else if (action.actionType == QUIT) {
            timeDifference = getTimeDifference(prevChallangeTime, action.startTime);
            prevChallangeTime = action.startTime;
            listItem.innerHTML = `- <span class="badge bg-primary ms-2">${action.actionType}</span>  ${action.remarks} - ${new Date(action.startTime).toLocaleString()} - time gap: ${timeDifference}`;
            listItem.classList.add('list-group-item', 'list-group-item-danger');
        } 
        

        challanges.appendChild(listItem); // Now listItem will always be defined before appending
    });
}

function markGoalAsCompleted() {
        currentGoal.goalState = GOAL_SUCCESS;

        // Update in IndexedDB
        updateGoal(currentGoal);

        // Update UI
        currentGoalForm.style.display = 'none';
        goalForm.style.display = 'block';
        checkOngoingGoal(); // Check for an ongoing goal on app load
        showAllGoals(); // Load and display goal history
        clearData();
}




function getTimeDifference(startTime1, startTime2) {
    const start1 = new Date(startTime1);
    const start2 = new Date(startTime2);
    const differenceInMs = start2 - start1;

    const seconds = differenceInMs / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    if (minutes < 1) {
        return `${seconds.toFixed(0)} seconds`;
    } else if (hours < 1) {
        return `${minutes.toFixed(0)} minutes`;
    } else if (days < 1) {
        return `${hours.toFixed(0)} hours`;
    } else {
        return `${days.toFixed(0)} days`;
    }
}

function showCurrentGoalDetails() {
    currentGoalDetails.innerHTML = `Goal <mark>${currentGoal.goalName}</mark> was started on <mark>${new Date(currentGoal.startTime).toLocaleString()} </mark> <br> <br>`;
    currentGoalDetails.classList.add('d-flex', 'justify-content-center', 'align-items-center', 'mx-auto');
    currentGoalDetails.classList.toggle('d-none');
}

function showCurrentGoalName(goal) {
    currentGoal = goal;
    goalForm.style.display = 'none';
    currentGoalForm.style.display = 'block';
    currentGoalName.textContent = `Your current goal is ${goal.goalName}`;
}

// Function to display all goals in the history section
function showAllGoals() {
    const goalsHistoryDiv = document.getElementById('goal-history');
    const transaction = db.transaction('goals', 'readonly');
    const goalStore = transaction.objectStore('goals');
    const request = goalStore.getAll();

    request.onsuccess = (event) => {
        const goals = event.target.result;
        const goalHistoryList = document.getElementById('goal-history-list');
        goalHistoryList.innerHTML = ''; // Clear previous list

        if (goals.length > 0) {
            goalsHistoryDiv.classList.remove('d-none');// Show the heading or container
        } else {
            goalsHistoryDiv.classList.add('d-none');// Hide the heading or container

        }

        goals.forEach(goal => {
          
            const listItem = document.createElement('li');

            listItem.textContent = `${goal.goalName} - ${goal.goalState}`;
            listItem.classList.add('list-group-item');
            if(goal.goalState == 'inprogress') {
                listItem.classList.add('list-group-item-primary');
            } else if(goal.goalState == 'failed') {
                listItem.classList.add('list-group-item-danger');

            } else if(goal.goalState == 'success'){
                listItem.classList.add('list-group-item-success');
            }
            
            // Attach an event listener to each goal item to display challenges
            listItem.addEventListener('click', () => showChallengesOfGoal(goal));
            goalHistoryList.appendChild(listItem);
        });
    };

    request.onerror = () => {
        console.error('Error fetching goal history.');
    };
}

function showChallengesOfGoal(goal) { 
    
    goalChallangeHeading.classList.remove('d-none');
    goalChallangeHeading.innerHTML = `
        Challenges faced in ${goal.goalName}
    `;

    let prevChallangeTime = goal.startTime;
    let timeDifference = '';
    let prevMileStoneTime = goal.startTime;
    let prevBreakTime = null;

    goal.actions.forEach(action => {
        let listItem = document.createElement('li'); // Define listItem here to avoid reference errors

        if (action.actionType == CHALLENGE) {
            timeDifference = getTimeDifference(prevChallangeTime, action.startTime);
            prevChallangeTime = action.startTime;
            listItem.innerHTML = `<span class="badge bg-primary ms-2">${action.actionType}</span> ${action.remarks} - ${new Date(action.startTime).toLocaleString()} -  time between two challenges: ${timeDifference}`;
            listItem.classList.add('list-group-item', 'list-group-item-primary');
        } else if (action.actionType == MILESTONE) {
            timeDifference = getTimeDifference(prevMileStoneTime, action.startTime);
            prevMileStoneTime = action.startTime;
            listItem.innerHTML = `<span class="badge bg-primary ms-2">${action.actionType}</span>  ${action.remarks} - ${new Date(action.startTime).toLocaleString()} - time between two mile stones: ${timeDifference}`;
            listItem.classList.add('list-group-item', 'list-group-item-success');
        } else if (action.actionType == BREAK) {
            prevBreakTime = action.startTime;
            listItem.innerHTML = `- <span class="badge bg-primary ms-2">${action.actionType}</span>  ${action.remarks} - ${new Date(action.startTime).toLocaleString()} `;
            listItem.classList.add('list-group-item', 'list-group-item-light');
        } else if (action.actionType == CONTINUE) {
            timeDifference = getTimeDifference(prevBreakTime, action.startTime);
            prevBreakTime = null;
            listItem.innerHTML = `- <span class="badge bg-primary ms-2">${action.actionType}</span>  ${action.remarks} - ${new Date(action.startTime).toLocaleString()} - You have taken break for : ${timeDifference}`;
            listItem.classList.add('list-group-item', 'list-group-item-secondary');
        } else if (action.actionType == QUIT) {
            timeDifference = getTimeDifference(prevChallangeTime, action.startTime);
            prevChallangeTime = action.startTime;
            listItem.innerHTML = `- <span class="badge bg-primary ms-2">${action.actionType}</span>  ${action.remarks} - ${new Date(action.startTime).toLocaleString()} - time gap: ${timeDifference}`;
            listItem.classList.add('list-group-item', 'list-group-item-danger');
        } 
        
        goalChallangeData.appendChild(listItem); // Add challenge to the list
    });
}




