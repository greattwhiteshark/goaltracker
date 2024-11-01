let db;
const request = indexedDB.open('GoalTrackerV2',1);

request.onupgradeneeded = (event) => {
    console.log('adsadad');
    db = event.target.result;
    if (!db.objectStoreNames.contains('goals')) {
      const goalStore = db.createObjectStore('goals', { keyPath: 'goalId', autoIncrement: true });
      goalStore.createIndex('isSuccess', 'isSuccess', { unique: false });
    }
  };
  

  request.onsuccess = (event) => {
    db = event.target.result;
    checkOngoingGoal(); // Check for an ongoing goal on app load

   
  };


// Call this function after db is initialized
request.onsuccess = (event) => {
    db = event.target.result;
    checkOngoingGoal(); // Check for an ongoing goal on app load
    showAllGoals(); // Load and display goal history
};


  request.onerror = () => {
    console.error('Error opening database.');
  };

//all variables declarations
const savegoalButton = document.getElementById('savegoal');
const goalNameInput = document.getElementById('goalname');
const goalForm = document.getElementById('goal-form');
const currentGoalForm = document.getElementById('current-goal');
const currentGoalName = document.getElementById('current-goal-name');
const addchallangeBtn = document.getElementById('addchallange');
const challangenameInput = document.getElementById('challangename');
const isQuit = document.getElementById('isQuit');
const challengesList = document.getElementById('challenges-list');
const challanges = document.getElementById('challanges');
const currentGoalDetailsBtn = document.getElementById('current-goal-details-btn');
const currentGoalDetails = document.getElementById('current-goal-details');
const goalChallangeData = document.getElementById('goal-challange-history');
const goalChallangeHeading = document.getElementById('goalChallangeHeading');

let currentGoal;


savegoalButton.addEventListener('click', () => {
    console.log('save goal');
    const goalName = goalNameInput.value.trim();
    if(goalName) {
         currentGoal = {
            goalName,
            startTime: new Date().toISOString(),
            challenges: [],
            goalState: 'inprogress'
        };
        saveGoal (currentGoal);
    }
});

function clearData() {
    challangenameInput.value = '';
    isQuit.checked = false;

}


function saveGoal(goal) {
    const transaction = db.transaction('goals', 'readwrite');
    const goalStore = transaction.objectStore('goals');
    const request = goalStore.add(goal);

    request.onsuccess = (event) => {
        goal.goalId = event.target.result; // Assign the generated ID to the goal
        currentGoal = goal; // Set currentGoal to the saved goal with ID
        goalForm.style.display = 'none';
        currentGoalForm.style.display = 'block';
        currentGoalName.innerHTML = `Your current goal is <span id="current-goal-details-btn" onclick="showCurrentGoalDetails()" style="background-color: lightgreen; border-radius: 20px; padding: 8px;">${goal.goalName}</span>`;
    };

    goalForm.style.display = 'none';
    currentGoalForm.style.display = 'block';
    currentGoalName.textContent = `Your current goal is ${goal.goalName}`;
    goalNameInput.value = '';
}

addchallangeBtn.addEventListener('click', () => {
    let challengename = challangenameInput.value.trim(); 
    let isSuccess = !isQuit.checked;

    if(challengename) {
        let challenge = {
            challengename,
            startTime : new Date().toISOString(),
            isSuccess : isSuccess
        };
        currentGoal.challenges.push(challenge);
        if(isSuccess) {
            currentGoal.goalState = 'inprogress';
        } else {
            currentGoal.goalState = 'failed';
            goalForm.style.display = 'block';
            currentGoalForm.style.display='none';
            challengesList.style.display='none';
            showAllGoals(); 
        }
        updateGoal(currentGoal);
        showChallanges(currentGoal);
        clearData();
    }
});

function updateGoal(goal) {
const transaction = db.transaction('goals', 'readwrite');
  const goalStore = transaction.objectStore('goals');
  goalStore.put(goal);
}

function showChallanges(goal) {
    document.getElementById('challanges').innerHTML= '';
    challengesList.style.display = 'block';
    challanges.innerHTML = '';
    let prevChallangeTime = null;
    let timeDifference = '';
    
    goal.challenges.forEach(challenge => {
        if (prevChallangeTime != null) {
            timeDifference = getTimeDifference(prevChallangeTime, challenge.startTime);
        } else {
            timeDifference = 'N/A'; // For the first challenge
        }
        prevChallangeTime = challenge.startTime;
        
        const listItem = document.createElement('li');
        listItem.textContent = `${challenge.challengename} - ${new Date(challenge.startTime).toLocaleString()} -
         ${challenge.isSuccess ? 'Success' : 'Failed'} - time gap: ${timeDifference}`;
        
        listItem.classList.add(challenge.isSuccess ? 'success' : 'failed');
        document.getElementById('challanges').appendChild(listItem);
    });
}

function getTimeDifference(startTime1, startTime2) {
    const start1 = new Date(startTime1);
    const start2 = new Date(startTime2);
    const differenceInMs = start2 - start1;

    // Convert milliseconds to different units
    const seconds = differenceInMs / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    // Conditional formatting based on time range
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



// currentGoalDetailsBtn.addEventListener('click', () => {
//     currentGoalDetails.innerHTML = `${currentGoal.startTime}`;
// });

function showCurrentGoalDetails() {
    currentGoalDetails.innerHTML = `Goal <mark>${currentGoal.goalName}</mark> was started on <mark>${new Date(currentGoal.startTime).toLocaleString()} </mark> <br> <br>`;
}


  // Function to check for an ongoing goal on app load
  function checkOngoingGoal() {
    const transaction = db.transaction('goals', 'readonly');
    const goalStore = transaction.objectStore('goals');
    const request = goalStore.getAll();

    request.onsuccess = (event) => {
        const goals = event.target.result;
        const ongoingGoal = goals.find(goal => goal.goalState == 'inprogress');

        if (ongoingGoal) {
            // Assign ongoing goal to currentGoal and display it
            currentGoal = ongoingGoal;
            goalForm.style.display = 'none';
            currentGoalForm.style.display = 'block';
            currentGoalName.innerHTML = `Your current goal is <span id="current-goal-details-btn" onclick="showCurrentGoalDetails()" style="background-color: lightgreen; border-radius: 20px; padding: 8px;">${currentGoal.goalName}</span>`;
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
            goalsHistoryDiv.style.display = 'block'; // Show the heading or container
        } else {
            goalsHistoryDiv.style.display = 'none'; // Hide the heading or container

        }

        goals.forEach(goal => {
          
            const listItem = document.createElement('li');

            listItem.textContent = `${goal.goalName} - ${goal.goalState}`;
            listItem.classList.add('goal-history-item');
            if(goal.goalState == 'inprogress') {
                listItem.classList.add('goal-history-item-inprogress');
            } else if(goal.goalState == 'failed') {
                listItem.classList.add('goal-history-item-failed');

            } else if(goal.goalState == 'success'){
                listItem.classList.add('goal-history-item-success');
            }
            
            // Attach an event listener to each goal item to display challenges
            listItem.addEventListener('click', () => showChallenges(goal));
            goalHistoryList.appendChild(listItem);
        });
    };

    request.onerror = () => {
        console.error('Error fetching goal history.');
    };
}

// Function to show challenges for the selected goal
function showChallenges(goal) {
    
    goalChallangeHeading.style.display = 'block';
    goalChallangeHeading.innerHTML = `
        Challenges faced in ${goal.goalName}
    `;

    goalChallangeData.style.display = 'block';
    goalChallangeData.innerHTML = ''; // Clear existing challenges list

    let prevChallengeTime = null;
    // Loop through each challenge in the selected goal and display it
    goal.challenges.forEach(challenge => {
        let timeDifference = prevChallengeTime ? getTimeDifference(prevChallengeTime, challenge.startTime) : 'N/A';
        prevChallengeTime = challenge.startTime;

        const listItem = document.createElement('li');
        listItem.textContent = `${challenge.challengename} - ${new Date(challenge.startTime).toLocaleString()} - 
            ${challenge.isSuccess ? 'Success' : 'Failed'} - time gap: ${timeDifference}`;
        listItem.classList.add(challenge.isSuccess ? 'success' : 'failed');
        
        goalChallangeData.appendChild(listItem); // Add challenge to the list
    });
}

function markGoalAsCompleted() {
    if (currentGoal) {
        currentGoal.goalState = 'success';

        // Update in IndexedDB
        updateGoal(currentGoal);

        // Update UI
        currentGoalForm.style.display = 'none';
        goalForm.style.display = 'block';
        checkOngoingGoal(); // Check for an ongoing goal on app load
        showAllGoals(); // Load and display goal history
    }
}
