// Firebase Configuration and Initialization
const firebaseConfig = {
    apiKey: "AIzaSyAi0Ja_F9gS6bacZwSC5AX8ma7PiRV-gYk",
    authDomain: "sem-system-93f17.firebaseapp.com",
    databaseURL: "https://sem-system-93f17-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sem-system-93f17",
    storageBucket: "sem-system-93f17.firebasestorage.app",
    messagingSenderId: "181076857349",
    appId: "1:181076857349:web:44e5efa46c027eed47026c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Listen for login form submission
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();  // Prevent the form from submitting normally

    // Get the username and password entered by the user
    const username = document.getElementById('username').value;  // Username input
    const password = document.getElementById('password').value;  // Password input

    // Check Realtime Database for the user credentials
    const usersRef = database.ref('authentication/users');
    usersRef.orderByChild('username').equalTo(username).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Assuming the password is stored in plain text (not recommended for production)
                snapshot.forEach(function(userSnapshot) {
                    const userData = userSnapshot.val();
                    if (userData.password === password) {
                        // Successfully logged in
                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('userId', userSnapshot.key);  // Store the user ID for future use
                        window.location.href = 'website-prototype.html';  // Redirect to website-prototype.html
                    } else {
                        alert('Incorrect password!');
                    }
                });
            } else {
                alert('No such user found!');
            }
        })
        .catch((error) => {
            console.error('Error getting user data: ', error);
            alert('Error during login!');
        });
});


