// ============================================
// FLOATING HEARTS
// ============================================

const heartsContainer = document.getElementById('hearts');
const heartEmojis = ['❤️', '💕', '💖', '💗', '💝', '🌹', '✨'];

function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    heart.style.left = Math.random() * 100 + '%';
    heart.style.animationDuration = 8 + Math.random() * 4 + 's';
    heart.style.animationDelay = Math.random() * 2 + 's';
    heart.style.fontSize = 1 + Math.random() * 1.5 + 'rem';
    heartsContainer.appendChild(heart);

    setTimeout(() => heart.remove(), 14000);
}

// Create hearts periodically
setInterval(createFloatingHeart, 800);
for (let i = 0; i < 8; i++) {
    setTimeout(createFloatingHeart, i * 200);
}

// ============================================
// CURSOR HEART TRAIL
// ============================================

let lastHeartTime = 0;
document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastHeartTime > 150) {
        lastHeartTime = now;
        if (Math.random() > 0.6) {
            const heart = document.createElement('div');
            heart.className = 'cursor-heart';
            heart.textContent = ['💕', '✨', '💖'][Math.floor(Math.random() * 3)];
            heart.style.left = e.clientX + 'px';
            heart.style.top = e.clientY + 'px';
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 800);
        }
    }
});

// ============================================
// NO BUTTON - REVOLVES AROUND CARD
// ============================================

const noBtn = document.getElementById('noBtn');
const funnyMessage = document.getElementById('funnyMessage');
const questionCard = document.querySelector('.question-card');

let noClickCount = 0;
let isEscaping = false;
let hasFlewAway = false;
let currentAngle = 0; // Track current angle around the card

const funnyMessages = [
    "Hehe, too slow! 😜",
    "Almost got me! 🏃",
    "Try again, Pattu! 💕",
    "Nope! 🙈",
    "Can't catch me! 😄",
    "You really want to click No? 🥺",
    "The bear is watching! 🧸",
