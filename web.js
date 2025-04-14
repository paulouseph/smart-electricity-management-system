
// 1. Switches the theme of the webpage............................................................ 
function switchTheme(theme) {
    // Set the href of the theme stylesheet to the selected theme
    document.getElementById('themeStylesheet').href = theme;

    // Save the selected theme in Firebase
    const themeRef = firebase.database().ref('userTheme');
    themeRef.set(theme)
        .then(() => console.log('Theme saved to Firebase:', theme))
        .catch(error => console.error('Error saving theme to Firebase:', error));
}


document.addEventListener('DOMContentLoaded', function () {
    const themeRef = firebase.database().ref('userTheme');

    themeRef.get().then((snapshot) => {
        if (snapshot.exists()) {
            const savedTheme = snapshot.val();
            console.log('Retrieved theme from Firebase:', savedTheme);
            document.getElementById('themeStylesheet').href = savedTheme;
        } else {
            console.log('No theme found in Firebase, applying default theme.');
        }
    }).catch((error) => {
        console.error('Error retrieving theme from Firebase:', error);
    });
});




// 2. Function to toggle the dropdown visibility for theme buttons......................................................
function toggleDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    dropdown.style.display = (dropdown.style.display === 'none' || dropdown.style.display === '') ? 'block' : 'none';
}



// 3. // Function to toggle the status of each appliance.............................................................................................
function toggleStatus(appliance) {
    // Check the current status (whether it's ON or OFF based on the button visibility)
    var relayState = document.getElementById("application" + appliance + "-off").classList.contains("hidden") ? "OFF" : "ON";
  
    // Construct the Firebase path for the desired relay state
    var relayStatePath = "/Appliance" + appliance + "/DesiredRelayState";
  
    // Update Firebase with the desired relay state
    firebase.database().ref(relayStatePath).set(relayState).then(function() {
      console.log("Relay state for Appliance " + appliance + " set to " + relayState);
    }).catch(function(error) {
      console.error("Error setting relay state: ", error);
    });
  
    // Toggle the button visibility
    document.getElementById("application" + appliance + "-on").classList.toggle("hidden");
    document.getElementById("application" + appliance + "-off").classList.toggle("hidden");
  }
  




        



// 4. Calendar Functionality.........................................................................................
// Function to initialize or update the calendar
function updateCalendar() {
  const monthSelect = document.getElementById('month');
  const yearSelect = document.getElementById('year');

  // Get the currently selected month and year
  const month = monthSelect.value.padStart(2, '0'); // Ensure 2-digit month
  const year = yearSelect.value;

  const calendar = document.getElementById('calendar');

  // Clear previous dates and empty slots
  const dateElements = document.querySelectorAll('.date, .empty');
  dateElements.forEach((el) => el.remove());

  // Calculate the number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in the selected month/year

  // Calculate the first day of the month (Sunday = 0, Monday = 1, etc.)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  // Adjust so that Monday is the start of the week (if Sunday, adjust to 6, otherwise subtract 1)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Add empty divs to align the first day of the month
  for (let i = 0; i < startDay; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('empty');
    calendar.appendChild(emptyDiv);
  }

  // Generate date elements for the days in the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateDiv = document.createElement('div');
    dateDiv.classList.add('date');
    dateDiv.innerText = day;
    dateDiv.onclick = function () {
      handleDateClick(day, month, year, daysInMonth);
    };
    calendar.appendChild(dateDiv);
  }
}

// Function to set the current year and month on page load
function setCurrentDate() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // Month is 0-indexed

  // Set the current year and month in the select elements
  document.getElementById('year').value = currentYear;
  document.getElementById('month').value = currentMonth;
}

// Example function to handle date clicks
function handleDateClick(day, month, year) {
  alert(`Selected Date: ${day}/${month}/${year}`);
}

// Set the current date and initialize the calendar on page load
window.onload = function () {
  setCurrentDate();
  updateCalendar();
};











// 5. Unit in Realtime (combined units)...........................................................................
// Function to fetch real-time data from Firebase
function fetchCombinedUnits() {
    const appliance1Ref = database.ref("Appliance1/Power");
    const appliance2Ref = database.ref("Appliance2/Power");
    const relay1Ref = database.ref("Appliance1/DesiredRelayState");
    const relay2Ref = database.ref("Appliance2/DesiredRelayState");
  
    Promise.all([
      appliance1Ref.once("value"),
      appliance2Ref.once("value"),
      relay1Ref.once("value"),
      relay2Ref.once("value"),
    ])
      .then(([appliance1Snap, appliance2Snap, relay1Snap, relay2Snap]) => {
        let appliance1KW = relay1Snap.val() === "ON" ? appliance1Snap.val() : 0;
        let appliance2KW = relay2Snap.val() === "ON" ? appliance2Snap.val() : 0;
  
        // Calculate Combined Units
        const combinedUnits = (appliance1KW + appliance2KW) * 0.000278;
  
        // Update the UI
        document.getElementById("units-realtime").textContent = combinedUnits.toFixed(6);
      })
      .catch((error) => {
        console.error("Error fetching data from Firebase:", error);
      });
  }
  
  // Refresh combined units every second
  setInterval(fetchCombinedUnits, 1000);







// 6.  Unit in Days.......................................................................................................
// Initialize global variables
let totalUnitsConsumedToday = 0;
let startTime = new Date();
let currentDay = formatDate(startTime); // Track current day as formatted string

// Function to format date with leading zero
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Main function to calculate units and handle day changes
async function getApplianceDataAndCalculateUnits() {
  try {
    const appliance1Snapshot = await database.ref('Appliance1').get();
    const appliance2Snapshot = await database.ref('Appliance2').get();

    const appliance1 = appliance1Snapshot.val();
    const appliance2 = appliance2Snapshot.val();

    let power1KW = appliance1?.DesiredRelayState === "ON" ? appliance1.Power : 0;
    let power2KW = appliance2?.DesiredRelayState === "ON" ? appliance2.Power : 0;

    const currentTime = new Date();
    const today = formatDate(currentTime);

    // Check if the day has changed
    if (today !== currentDay) {
      // Save previous day's data only if it's greater than 0
      if (totalUnitsConsumedToday > 0) {
        await database.ref('PowerUsage/DailyUnits').child(currentDay).set(totalUnitsConsumedToday);
        console.log(`Saved ${currentDay} units:`, totalUnitsConsumedToday);
      }

      // Reset counters for new day
      totalUnitsConsumedToday = 0;
      startTime = currentTime;
      currentDay = today;
      document.getElementById("units-day").innerText = "0.0000";
    }

    // Calculate units consumed since last update
    const elapsedTimeInSeconds = Math.floor((currentTime - startTime) / 1000);
    startTime = currentTime;

    totalUnitsConsumedToday += (power1KW + power2KW) * 0.000278 * elapsedTimeInSeconds;

    // Update display
    document.getElementById("units-day").innerText = totalUnitsConsumedToday.toFixed(4);
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

// Regular upload function with check to prevent sending 0 data
async function uploadDailyUnitsToRealtimeDatabase() {
  try {
    if (totalUnitsConsumedToday > 0) {
      await database.ref('PowerUsage/DailyUnits').child(currentDay).set(totalUnitsConsumedToday);
    }
  } catch (error) {
    console.error("Error in daily upload:", error);
  }
}

// Update every 40 seconds
setInterval(() => {
  getApplianceDataAndCalculateUnits();
  uploadDailyUnitsToRealtimeDatabase(); // Only uploads if data is greater than 0
}, 40000);













//7.unit in months..................................................................................................
// Initialize global variables
let totalUnitsConsumedThisMonth = 0; // For tracking monthly consumption

// Function to fetch appliance data and calculate units
async function getApplianceDataAndCalculateUnits() {
  try {
    // Fetch Appliance data from Firebase
    const appliance1Snapshot = await database.ref('Appliance1').get();
    const appliance2Snapshot = await database.ref('Appliance2').get();

    const appliance1 = appliance1Snapshot.val();
    const appliance2 = appliance2Snapshot.val();

    // Get power values only if appliances are ON
    const appliance1PowerKW = appliance1?.DesiredRelayState === "ON" ? appliance1.Power : 0;
    const appliance2PowerKW = appliance2?.DesiredRelayState === "ON" ? appliance2.Power : 0;

    // Calculate elapsed time in seconds
    const currentTime = new Date();
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
    startTime = currentTime; // Reset start time

    // Calculate units consumed
    const unitsConsumed = (appliance1PowerKW + appliance2PowerKW) * 0.000278 * elapsedTimeInSeconds;

    // Update daily and monthly totals
    totalUnitsConsumedToday += unitsConsumed;
    totalUnitsConsumedThisMonth += unitsConsumed;

    // Update frontend
    document.getElementById('units-day').innerText = totalUnitsConsumedToday.toFixed(4);
    document.getElementById('units-month').innerText = totalUnitsConsumedThisMonth.toFixed(4);

  } catch (error) {
    console.error('Error fetching appliance data:', error);
  }
}

// Function to upload daily and monthly units to Firebase **only if data is greater than 0**
async function uploadUnitsToFirebase() {
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentMinute = currentDate.getMinutes();

  try {
    // Upload daily units at 11:59 PM **only if it's greater than 0**
    if (currentHour === 23 && currentMinute === 59 && totalUnitsConsumedToday > 0) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      await database.ref(`PowerUsage/DailyUnits/${dateKey}`).set(totalUnitsConsumedToday);
      totalUnitsConsumedToday = 0; // Reset daily total after upload
    }

    // Upload monthly units **only if it's greater than 0**
    if (totalUnitsConsumedThisMonth > 0) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      await database.ref(`PowerUsage/MonthlyUnits/${monthKey}`).set(totalUnitsConsumedThisMonth);
    }

  } catch (error) {
    console.error('Error uploading units to Firebase:', error);
  }
}

// Initialize Firebase listeners
function initializeFirebaseListeners() {
  // Listener for Appliance 1 Power
  database.ref('Appliance1/Power').on('value', (snapshot) => {
    appliance1PowerKW = snapshot.val() || 0;
  });

  // Listener for Appliance 2 Power
  database.ref('Appliance2/Power').on('value', (snapshot) => {
    appliance2PowerKW = snapshot.val() || 0;
  });
}

// Start the logic
initializeFirebaseListeners();

// Run calculations and uploads at regular intervals
setInterval(() => {
  getApplianceDataAndCalculateUnits();
  uploadUnitsToFirebase();
}, 40000); // Update every 40 seconds














// 8.Cost per unit day................................................................................
const unitCost = 4.0118110236220472440944881889764; 

function calculateUsageCost() {
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  database.ref(`PowerUsage/DailyUnits/${formattedDate}`).on('value', (snapshot) => {
    const dailyUnits = snapshot.val() || 0;
    const totalCost = dailyUnits * unitCost;

    document.getElementById('usage-cost-day').innerText = `₹${totalCost.toFixed(2)}`;
  }, (error) => {
    console.error('Error fetching daily units:', error);
  });
}

// Fetch data from Firebase in real-time
calculateUsageCost();

// Ensure UI updates every 40 seconds even if Firebase doesn't update instantly
setInterval(calculateUsageCost, 40000);






//9. cost calaculation month.........................................................................................
// Constants for cost calculation
const UNIT_RATE = 4.0118110236220472440944881889764; // Cost per unit
const ADDITIONAL_CHARGES = {
    duty: 166.37,
    fuelSurcharge: 22.86,
    fixedCharge: 190.00,
    meterRent: 6.00,
    monthlyFuelSurcharge: 25.40,
};

// Function to fetch the monthly units and calculate cost
function calculateMonthlyUsageCost() {
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"

    database.ref('PowerUsage/MonthlyUnits').on('value', (snapshot) => {
        const data = snapshot.val();
        const monthlyUnits = data?.[currentMonth] || 0;

        // Calculate the usage cost
        const usageCost = (monthlyUnits * UNIT_RATE) +
            ADDITIONAL_CHARGES.duty +
            ADDITIONAL_CHARGES.fuelSurcharge +
            ADDITIONAL_CHARGES.fixedCharge +
            ADDITIONAL_CHARGES.meterRent +
            ADDITIONAL_CHARGES.monthlyFuelSurcharge;

        // Display the cost in the "usage-cost-month" box
        const usageCostElement = document.getElementById('usage-cost-month');
        if (usageCostElement) {
            usageCostElement.textContent = `₹${usageCost.toFixed(2)}`; // Display cost with 2 decimal places
        } else {
            console.error("Usage cost element not found!");
        }

        console.log(`Monthly usage cost updated: ₹${usageCost.toFixed(2)}`);
    }, (error) => {
        console.error("Error fetching monthly units from database:", error);
    });
}

// Fetch data from Firebase in real-time
calculateMonthlyUsageCost();

// Ensure UI updates every 40 seconds even if Firebase doesn't update instantly
setInterval(calculateMonthlyUsageCost, 40000);




// 10.unit in Realtime of Appliance 1...............................................................................
// Conversion factor: 1 second in hours
const secondToHour = 0.000278;

// Function to fetch power of Appliance 1 and calculate units per second
function updateRealtimeUnitForAppliance1() {
  // Reference to the Firebase database for Appliance1's power
  database
    .ref('Appliance1/Power')
    .once('value')
    .then((snapshot) => {
      const powerInKW = snapshot.val(); // Power in kilowatts (kW)

      if (powerInKW !== null) {
        // Calculate unit consumption per second
        const unitPerSecond = powerInKW * secondToHour;

        // Display the calculated unit in the specified HTML element
        document.querySelector('#units-appliance1 .box').innerText = unitPerSecond.toFixed(6); // 6 decimal precision
      } else {
        console.warn('Power value for Appliance 1 not available.');
      }
    })
    .catch((error) => {
      console.error('Error fetching power data for Appliance 1:', error);
    });
}

// Update the displayed unit value every second
setInterval(updateRealtimeUnitForAppliance1, 1000);

// Initial call to display the first value immediately
updateRealtimeUnitForAppliance1();












//11. appliances 2 realtime units...................................................................................
// Conversion factor for 1 second to hours

// Function to fetch and display real-time units consumed by Appliance 2
function updateAppliance2Units() {
  // Reference to Appliance2's power in the database
  database
    .ref('Appliance2/Power')
    .on('value', (snapshot) => {
      const power = snapshot.val(); // Retrieve power value

      if (power !== null) {
        // Calculate the unit consumption per second
        const unitsPerSecond = power * secondToHour;

        // Update the HTML element with the calculated value
        document.querySelector('#units-appliance2 .box').innerText = unitsPerSecond.toFixed(8);
      } else {
        console.warn('No power data available for Appliance 2');
      }
    });
}

// Call the function to continuously update units for Appliance 2
updateAppliance2Units();



// 12.Weekly Units Usage Graph sending...................................................................................
async function updateWeeklyUsage() {
    const usageRef = database.ref("PowerUsage/DailyUnits");
    const weeklyUsageRef = database.ref("PowerUsage/weeklyUsage");
    const resetRef = database.ref("PowerUsage/lastReset");

    try {
        const snapshot = await usageRef.get();
        if (!snapshot.exists()) return;

        const dailyUnits = snapshot.val();
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
        const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        // Fetch last reset timestamp
        const resetSnapshot = await resetRef.get();
        const lastResetDate = resetSnapshot.exists() ? new Date(resetSnapshot.val()) : null;

        // Reset weekly usage if it's Monday and last reset was not today
        if (currentDay === 1 && (!lastResetDate || lastResetDate.getDate() !== today.getDate())) {
            await weeklyUsageRef.set({
                "Monday": 0, "Tuesday": 0, "Wednesday": 0,
                "Thursday": 0, "Friday": 0, "Saturday": 0, "Sunday": 0
            });
            await resetRef.set(today.toISOString()); // Store last reset date
            console.log("Weekly usage reset to 0.");
            return;
        }

        // Update current day's usage
        const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const todayUsage = dailyUnits[todayDateString] || 0;

        // Update only today's usage in weeklyUsage
        const todayKey = weekDays[currentDay]; // Get weekday name
        await weeklyUsageRef.child(todayKey).set(todayUsage);

        console.log(`Updated ${todayKey} usage to ${todayUsage}`);
    } catch (error) {
        console.error("Error updating weekly usage:", error);
    }
}

// Run function every **30 seconds**
setInterval(updateWeeklyUsage, 30000);




// 13 history usage in selected date.................................................
// Reference to the database
const databaseRef = firebase.database().ref("PowerUsage/DailyUnits");

// Function to fetch daily units for the selected date
function fetchDailyUnits(day, month, year) {
  // Ensure the month and day are two digits (e.g., 01 for January)
  const formattedMonth = month.padStart(2, "0");
  const formattedDay = day.toString().padStart(2, "0");

  const selectedDate = `${year}-${formattedMonth}-${formattedDay}`;

  // Fetch data from Firebase
  databaseRef.child(selectedDate).once("value", (snapshot) => {
    if (snapshot.exists()) {
      let value = snapshot.val();
      document.getElementById("his-day").innerText = parseFloat(value).toFixed(4); // Round to 4 decimal places
    } else {
      document.getElementById("his-day").innerText = "No data";
    }
  }).catch((error) => {
    console.error("Error fetching data:", error);
    document.getElementById("his-day").innerText = "Error";
  });
}

// Modify the existing handleDateClick function in your calendar code
function handleDateClick(day, month, year) {
  fetchDailyUnits(day, month, year);
}








// 14 history usage in selected date........................................................................
window.onload = function () {
  const monthDropdown = document.getElementById("month");
  const yearDropdown = document.getElementById("year");
  const historyMonth = document.getElementById("his-month");

  if (monthDropdown && yearDropdown && historyMonth) {
    const fetchMonthlyUnits = () => {
      const month = monthDropdown.value.padStart(2, "0");
      const year = yearDropdown.value;
      const monthYearKey = `${year}-${month}`;

      database.ref(`PowerUsage/MonthlyUnits/${monthYearKey}`).once("value")
        .then(snapshot => {
          const monthlyUnits = snapshot.val();
          // Round the monthlyUnits to 4 decimal places
          const roundedUnits = monthlyUnits !== null ? parseFloat(monthlyUnits).toFixed(4) : "0.0000";
          historyMonth.innerText = roundedUnits;
        })
        .catch(error => {
          console.error("Error fetching data:", error);
        });
    };

    monthDropdown.addEventListener("change", fetchMonthlyUnits);
    yearDropdown.addEventListener("change", fetchMonthlyUnits);
    
    fetchMonthlyUnits(); // Fetch data on page load
  } else {
    console.error("Dropdown elements not found in the DOM.");
  }
};































