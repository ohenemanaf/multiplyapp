// Simple multiplication quiz game.
// Generates random numbers, checks answers, updates score.

// Generate random numbers 1-10
const num1 = Math.ceil(Math.random() *12);
const num2 = Math.ceil(Math.random() * 12);

// Get HTML elements
const answerEl = document.getElementById('answer');
const formEl = document.getElementById('form');
const scoreDisplayEl = document.getElementById('scoreDisplay');
const questionEl = document.getElementById('question');
const question2El = document.getElementById('question2');

// Display question
questionEl.innerText = `What is ${num1} multiplied by ${num2}?`;
question2El.innerText = `${num1} × ${num2}`;


// Calculate correct answer
let answer = num1 * num2;

// Handle form submission
formEl.addEventListener('submit', function(event) {
    event.preventDefault(); // Stop page reload

    const userAnswer = +answerEl.value; // Get user input as number

    let score = JSON.parse(localStorage.getItem('score')); // Load score

    if (userAnswer === answer) {
        score++; // Correct: +1
    } else if (score > 0) {
        score--; // Wrong: -1 if score > 0
    }

    localStorage.setItem('score', JSON.stringify(score)); // Save score

    window.location.reload(); // New question
});

// Initialize score if not set
if (!localStorage.getItem('score')) {
    localStorage.setItem('score', JSON.stringify(0));
}

// Display current score
let finalScore = JSON.parse(localStorage.getItem('score'));
scoreDisplayEl.innerText = `Score: ${finalScore} %`;

if (finalScore ===50) {
 alert("Wow! You have a high score of 50%! Great job!");
}
else if (finalScore === 0) {
 alert("Your score is below 0. Don't give up, keep trying!");
}