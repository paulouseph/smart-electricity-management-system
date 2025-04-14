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

// Listen for form submission
document.getElementById('changeCredentialsForm')?.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();

    // Get the current username from localStorage
    const currentUsername = localStorage.getItem('username');

    if (currentUsername) {
        if (newUsername && newPassword) {
            // Reference to the correct path in the Realtime Database (authentication/users)
            const usersRef = database.ref('authentication/users');
            const userKeyToUpdate = "user1"; // Assuming there's only one user (user1)

            // Debug: Log the new data before updating
            console.log(`Updating user: ${userKeyToUpdate}, New Username: ${newUsername}, New Password: ${newPassword}`);

            // Update the user's credentials in the correct path
            usersRef.child(userKeyToUpdate).update({
                username: newUsername,
                password: newPassword
            }).then(() => {
                // Debug: Fetch the updated data for verification
                usersRef.child(userKeyToUpdate).once('value').then((snapshot) => {
                    console.log('Updated User Data:', snapshot.val());
                });

                // Update localStorage and notify the user
                localStorage.setItem('username', newUsername);
                localStorage.setItem('password', newPassword);
                alert('Credentials updated successfully!');
                window.location.href = 'index.html'; // Redirect to login page
            }).catch((error) => {
                console.error('Error updating credentials:', error);
                alert('Failed to update credentials. Please try again.');
            });
        } else {
            alert('Please fill out both fields.');
        }
    } else {
        alert('No user logged in.');
        window.location.href = 'index.html'; // Redirect to login page
    }
});

