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
let currentAngle = 0; // Track angle around the card

const funnyMessages = [
    "Hehe, too slow! 😜",
    "Almost got me! 🏃",
    "Try again, Pattu! 💕",
    "Nope! 🙈",
    "Can't catch me! 😄",
    "You really want to click No? 🥺",
    "The bear is watching! 🧸",
    "One more try? 💖"
];

const caughtMessages = [
    "You caught me! But... are you sure? 🥺",
    "Okay okay, you got me! But reconsider? 💕",
    "Fine, you win! But please? 🧸",
    "Alright, I give up! But think about it! 💖",
    "You're fast! But... really? 😢"
];

function showMessage(msg) {
    funnyMessage.textContent = msg;
    funnyMessage.classList.add('show');
    setTimeout(() => {
        funnyMessage.classList.remove('show');
    }, 2000);
}

function getRandomMessage() {
    return funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
}

// Get card center and dimensions
function getCardInfo() {
    const cardRect = questionCard.getBoundingClientRect();
    return {
        centerX: cardRect.left + cardRect.width / 2,
        centerY: cardRect.top + cardRect.height / 2,
        width: cardRect.width,
        height: cardRect.height
    };
}

// Calculate orbit radius based on card size and screen
function getOrbitRadius() {
    const cardInfo = getCardInfo();
    const baseRadius = Math.max(cardInfo.width, cardInfo.height) / 2;
    // Add some padding so button orbits outside the card
    return baseRadius + 80;
}

// Position button at a specific angle around the card
function positionButtonAtAngle(angle) {
    const cardInfo = getCardInfo();
    const orbitRadius = getOrbitRadius();
    const btnRect = noBtn.getBoundingClientRect();
    
    // Calculate position on the elliptical orbit
    const radiusX = orbitRadius + 20;
    const radiusY = orbitRadius - 20;
    
    let newX = cardInfo.centerX + Math.cos(angle) * radiusX - btnRect.width / 2;
    let newY = cardInfo.centerY + Math.sin(angle) * radiusY - btnRect.height / 2;
    
    // Keep within viewport with padding
    const padding = 20;
    newX = Math.max(padding, Math.min(window.innerWidth - padding - btnRect.width, newX));
    newY = Math.max(padding, Math.min(window.innerHeight - padding - btnRect.height, newY));
    
    noBtn.style.left = newX + 'px';
    noBtn.style.top = newY + 'px';
}

// Start escaping behavior
function startEscaping() {
    if (isEscaping || hasFlewAway) return;
    isEscaping = true;
    
    noBtn.classList.add('escaping');
    
    // Get current position and calculate initial angle
    const btnRect = noBtn.getBoundingClientRect();
    const cardInfo = getCardInfo();
    currentAngle = Math.atan2(
        btnRect.top + btnRect.height / 2 - cardInfo.centerY,
        btnRect.left + btnRect.width / 2 - cardInfo.centerX
    );
    
    // Position at current angle
    positionButtonAtAngle(currentAngle);
}

// Escape from mouse - revolve around the card
function escapeFromPoint(mouseX, mouseY) {
    if (hasFlewAway) return;
    
    const btnRect = noBtn.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;
    
    const distance = Math.sqrt(
        Math.pow(mouseX - btnCenterX, 2) + 
        Math.pow(mouseY - btnCenterY, 2)
    );
    
    // If mouse is within detection range of button, escape!
    const detectionRange = window.innerWidth < 600 ? 80 : 100;
    
    if (distance < detectionRange) {
        // Start escaping mode if not already
        if (!isEscaping) {
            startEscaping();
        }
        
        // Calculate which direction to rotate (away from mouse)
        const cardInfo = getCardInfo();
        const mouseAngleToCard = Math.atan2(mouseY - cardInfo.centerY, mouseX - cardInfo.centerX);
        const btnAngleToCard = Math.atan2(btnCenterY - cardInfo.centerY, btnCenterX - cardInfo.centerX);
        
        // Determine rotation direction (clockwise or counter-clockwise)
        let angleDiff = mouseAngleToCard - btnAngleToCard;
        
        // Normalize to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Move in the opposite direction from the mouse
        const rotationSpeed = 0.4 + Math.random() * 0.3;
        if (angleDiff > 0) {
            currentAngle -= rotationSpeed; // Rotate counter-clockwise
        } else {
            currentAngle += rotationSpeed; // Rotate clockwise
        }
        
        // Keep angle in bounds
        if (currentAngle > Math.PI * 2) currentAngle -= Math.PI * 2;
        if (currentAngle < 0) currentAngle += Math.PI * 2;
        
        // Position button at new angle
        positionButtonAtAngle(currentAngle);
        
        // Add slight rotation for fun
        noBtn.style.transform = `rotate(${Math.sin(currentAngle * 3) * 15}deg)`;
        
        // Sometimes show a teasing message
        if (Math.random() > 0.92) {
            showMessage(getRandomMessage());
        }
    }
}

// Mouse move handler
document.addEventListener('mousemove', (e) => {
    escapeFromPoint(e.clientX, e.clientY);
});

// Touch support for mobile
document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    escapeFromPoint(touch.clientX, touch.clientY);
});

// Handle No button click (when user manages to catch it)
noBtn.addEventListener('click', handleNoClick);

function handleNoClick() {
    if (hasFlewAway) return;
    
    noClickCount++;
    
    if (noClickCount < 5) {
        // Show caught message
        showMessage(caughtMessages[noClickCount - 1] || caughtMessages[0]);
        
        // Make Yes button grow slightly
        const yesBtn = document.querySelector('.btn-yes');
        const scale = 1 + (noClickCount * 0.05);
        yesBtn.style.transform = `scale(${scale})`;
        
        // After being caught, jump to opposite side of card
        currentAngle += Math.PI + (Math.random() - 0.5);
        if (isEscaping) {
            positionButtonAtAngle(currentAngle);
        }
    } else {
        // After 5 catches, button gives up and flies away
        showMessage("Okay, okay! I'm leaving! 😭💨");
        flyAway();
    }
}

function flyAway() {
    hasFlewAway = true;
    noBtn.classList.add('flying-away');
    
    // Remove button after animation
    setTimeout(() => {
        noBtn.style.display = 'none';
    }, 1000);
}

// ============================================
// YES BUTTON
// ============================================

function sayYes() {
    document.getElementById('successScreen').classList.add('show');
    createConfetti();
    document.body.style.overflow = 'hidden';
}

// Make sayYes globally accessible
window.sayYes = sayYes;

// ============================================
// CONFETTI
// ============================================

function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    const colors = ['#e57373', '#ef9a9a', '#ffcdd2', '#ffd54f', '#81c784', '#64b5f6', '#ba68c8'];
    const shapes = ['❤️', '💕', '✨', '🧸', '💖', '🌸'];
    
    for (let i = 0; i < 120; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            
            if (Math.random() > 0.35) {
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            } else {
                confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
                confetti.style.background = 'none';
                confetti.style.fontSize = '1.3rem';
            }
            
            confetti.style.animationDuration = 2.5 + Math.random() * 1.5 + 's';
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }, i * 25);
    }
}

// ============================================
// INITIALIZATION
// ============================================

function initNoButton() {
    // Reset position on window resize when not escaping
    if (!isEscaping && !hasFlewAway) {
        const btnRect = noBtn.getBoundingClientRect();
        noBtn.dataset.originalLeft = btnRect.left;
        noBtn.dataset.originalTop = btnRect.top;
    } else if (isEscaping && !hasFlewAway) {
        // Reposition at current angle on resize
        positionButtonAtAngle(currentAngle);
    }
}

window.onload = initNoButton;
window.onresize = initNoButton;
