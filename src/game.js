let mario = document.getElementById('mario-character');
let jumpHeight = 0;

// Function to make Mario jump
function jump() {
    if (mario.classList != 'jump') {
        mario.classList.add('jump');

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 300); // Adjust the time to match the jump duration
    }
}

// Mock function to simulate BLE value changes
// Replace this with actual BLE data retrieval logic
function mockBLEValue() {
    return Math.floor(Math.random() * 100); // Random value between 0 and 9
}

// Game loop
// setInterval(() => {
//     jumpHeight = mockBLEValue(); // Get BLE value
//     // console.log('Jump height:', jumpHeight);
//     if (jumpHeight > 5) { // Set a threshold for jump
//         jump();
//     }
// }, 1000); // Check every second
