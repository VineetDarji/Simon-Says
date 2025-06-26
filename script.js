// Game variables
let sequence = [];
let playerSequence = [];
let score = 0;
let highScore = 0;
let strictMode = false;
let gameStarted = false;
let buttonCooldown = false;
let sequenceInterval;

// Constants
const BUTTON_COOLDOWN_TIME = 300;
const SEQUENCE_SPEED = 600;
const MAX_LEVEL = 20;

// DOM elements
const startButton = document.getElementById('start-btn');
const stopButton = document.getElementById('stop-btn');
const clearButton = document.getElementById('clear-btn');
const strictCheckbox = document.getElementById('strict-checkbox');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');
const buttons = document.querySelectorAll('.button');
const currentYear = document.getElementById('current-year');

// Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound functions
function playSound(frequency, type = 'sine', duration = 0.3) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
}

const colorSounds = {
    green: 523.25,
    red: 392.00,
    yellow: 329.63,
    blue: 261.63
};

// Game functions
function startGame() {
    if (gameStarted) return;
    
    gameStarted = true;
    sequence = [];
    playerSequence = [];
    score = 0;
    updateScoreDisplay();
    messageDisplay.textContent = 'Watch the sequence!';
    
    startButton.disabled = true;
    stopButton.disabled = false;
    
    nextRound();
}

function stopGame() {
    if (!gameStarted) return;
    
    gameStarted = false;
    clearInterval(sequenceInterval);
    sequence = [];
    playerSequence = [];
    messageDisplay.textContent = 'Game stopped';
    startButton.disabled = false;
    stopButton.disabled = true;
    
    buttons.forEach(button => {
        button.classList.remove('active');
    });
}

function clearRecords() {
    if (!confirm('Are you sure you want to clear all records?')) return;
    
    localStorage.removeItem('simonHighScore');
    highScore = 0;
    updateScoreDisplay();
    messageDisplay.textContent = 'All records cleared!';
    
    if (gameStarted) {
        stopGame();
    }
}

function nextRound() {
    playerSequence = [];
    score++;
    updateScoreDisplay();
    
    const colors = ['green', 'red', 'yellow', 'blue'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    sequence.push(randomColor);
    
    playSequence();
}

function playSequence() {
    let i = 0;
    clearInterval(sequenceInterval);
    
    sequenceInterval = setInterval(() => {
        if (i >= sequence.length) {
            clearInterval(sequenceInterval);
            messageDisplay.textContent = 'Your turn! Repeat the sequence.';
            return;
        }
        
        const color = sequence[i];
        highlightButton(color);
        i++;
    }, SEQUENCE_SPEED);
}

async function highlightButton(color) {
    const button = document.querySelector(`.button[data-color="${color}"]`);
    button.classList.add('active');
    
    // Play sound with harmonics
    const baseFreq = colorSounds[color];
    playSound(baseFreq);
    playSound(baseFreq * 2, 'sine', 0.3, 0.05);
    
    setTimeout(() => {
        button.classList.remove('active');
    }, BUTTON_COOLDOWN_TIME);
}

function handleButtonPress(e) {
    if (e.cancelable) e.preventDefault();
    
    if (gameStarted && !buttonCooldown) {
        buttonCooldown = true;
        const color = this.dataset.color;
        
        this.classList.add('active');
        highlightButton(color);
        playerSequence.push(color);
        
        const index = playerSequence.length - 1;
        if (playerSequence[index] !== sequence[index]) {
            gameOver();
            return;
        }
        
        if (playerSequence.length === sequence.length) {
            if (score === MAX_LEVEL) {
                messageDisplay.textContent = 'Congratulations! You won!';
                setTimeout(() => {
                    resetGame();
                }, 3000);
            } else {
                messageDisplay.textContent = 'Correct! Next round...';
                setTimeout(() => {
                    nextRound();
                }, 1000);
            }
        }
        
        setTimeout(() => {
            buttonCooldown = false;
        }, BUTTON_COOLDOWN_TIME);
    }
}

function gameOver() {
    playSound(110, 'square', 1.5);
    messageDisplay.textContent = 'Wrong sequence! Game over.';
    
    if (strictMode) {
        setTimeout(() => {
            resetGame();
        }, 1500);
    } else {
        setTimeout(() => {
            messageDisplay.textContent = 'Try again...';
            playSequence();
        }, 1500);
    }
}

function resetGame() {
    updateHighScore();
    gameStarted = false;
    sequence = [];
    playerSequence = [];
    score = 0;
    updateScoreDisplay();
    messageDisplay.textContent = '';
    startButton.disabled = false;
    stopButton.disabled = true;
}

// Score functions
function updateHighScore() {
    highScore = Math.max(score, highScore);
    localStorage.setItem('simonHighScore', highScore);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `${score} (High: ${highScore})`;
}

// Theme functions
function initThemeSwitcher() {
    const themes = {
        default: {
            '--bg-color': '#1a1a2e',
            '--game-bg': 'rgba(255,255,255,0.1)',
            '--text-color': 'white'
        },
        dark: {
            '--bg-color': '#111',
            '--game-bg': 'rgba(0,0,0,0.5)',
            '--text-color': '#ddd'
        },
        neon: {
            '--bg-color': '#0f0f1a',
            '--game-bg': 'rgba(255,255,255,0.05)',
            '--text-color': '#0ff'
        }
    };
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = themes[btn.dataset.theme];
            Object.entries(theme).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value);
            });
            localStorage.setItem('simonTheme', btn.dataset.theme);
        });
    });
    
    const savedTheme = localStorage.getItem('simonTheme') || 'default';
    document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`).click();
}

// Initialization
function init() {
    // Load high score
    highScore = parseInt(localStorage.getItem('simonHighScore')) || 0;
    updateScoreDisplay();
    
    // Set current year
    currentYear.textContent = new Date().getFullYear();
    
    // Initialize buttons
    buttons.forEach(button => {
        button.addEventListener('click', handleButtonPress);
        button.addEventListener('touchstart', handleButtonPress, { passive: true });
    });
    
    // Event listeners
    startButton.addEventListener('click', startGame);
    stopButton.addEventListener('click', stopGame);
    clearButton.addEventListener('click', clearRecords);
    strictCheckbox.addEventListener('change', () => {
        strictMode = strictCheckbox.checked;
    });
    
    // Initialize theme switcher
    initThemeSwitcher();
    
    // Disable stop button initially
    stopButton.disabled = true;
}

// Start the game
window.addEventListener('DOMContentLoaded', init);