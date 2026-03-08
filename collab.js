// COLLABORATION PAGE LOGIC

const TOTAL_POSSIBLE_POINTS = 14;
let currentPoints = 0;

function updatePointsDisplay() {
    const pointsDisplay = document.getElementById('currentPoints');
    const progressFill = document.getElementById('progressFill');
    const feedback = document.getElementById('pointsFeedback');
    const enterBtn = document.getElementById('enterGiveawayBtn');

    pointsDisplay.innerText = currentPoints;
    const percentage = Math.min((currentPoints / TOTAL_POSSIBLE_POINTS) * 100, 100);
    progressFill.style.width = `${percentage}%`;

    // Update feedback and enable button
    if (currentPoints > 0) {
        enterBtn.removeAttribute('disabled');
        enterBtn.classList.add('active');
        feedback.innerText = "Awesome! Keep going or enter now.";
        feedback.style.color = "#5eead4";
    }

    if (currentPoints === TOTAL_POSSIBLE_POINTS) {
        feedback.innerText = "Max points reached! Excellent.";
    }
}

function processTaskComplete(points, taskCard) {
    if (taskCard.classList.contains('completed')) return;

    currentPoints += points;
    taskCard.classList.add('completed');

    const btn = taskCard.querySelector('.task-btn');
    if (btn) {
        btn.innerText = 'Completed';
        btn.style.opacity = '1';
    }

    updatePointsDisplay();
}

document.addEventListener('DOMContentLoaded', () => {

    // Countdown Timer Logic
    const countdownDate = new Date().getTime() + (2 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000) + (45 * 60 * 1000);

    const timerInterval = setInterval(function () {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('days');
        if (daysEl) {
            daysEl.innerText = days.toString().padStart(2, '0');
            document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
            document.getElementById('minutes').innerText = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').innerText = seconds.toString().padStart(2, '0');
        }

        if (distance < 0) {
            clearInterval(timerInterval);
            const giveaway = document.getElementById('giveaway');
            if (giveaway) {
                giveaway.style.display = 'none';
                document.getElementById('winnersSection').classList.add('visible');
            }
        }
    }, 1000);

    // Task Listeners
    const tasks = document.querySelectorAll('.task-card');
    tasks.forEach(task => {
        const btn = task.querySelector('.task-btn');
        const taskType = task.dataset.task;
        const points = parseInt(task.dataset.points);

        if (btn) {
            btn.addEventListener('click', (e) => {
                if (taskType === 'question') {
                    // Handled separately via modal
                    return;
                }

                if (taskType === 'hold') {
                    e.preventDefault();
                    const walletInput = document.getElementById('walletAddress');
                    const wallet = walletInput ? walletInput.value.trim() : '';
                    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
                    if (!wallet || !walletRegex.test(wallet)) {
                        if (walletInput) {
                            walletInput.focus();
                            walletInput.style.borderColor = '#ff6ec7';
                            const errorMsg = document.querySelector('.error-msg');
                            if (errorMsg) {
                                errorMsg.innerText = "Please enter a valid ETH address below first";
                                errorMsg.style.display = 'block';
                            }
                        }
                        return;
                    }
                    autoVerifyWallet(wallet);
                    return;
                }

                if (!task.classList.contains('completed')) {
                    btn.innerText = 'Checking...';
                    btn.style.opacity = '0.7';

                    setTimeout(() => {
                        processTaskComplete(points, task);
                    }, 1000);
                }
            });
        }
    });

    // Form validation and Auto-Verify handling
    const form = document.getElementById('giveawayForm');
    if (form) {
        const walletInput = document.getElementById('walletAddress');
        const errorMsg = document.querySelector('.error-msg');
        const enterBtn = document.getElementById('enterGiveawayBtn');
        let typingTimer;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!enterBtn.classList.contains('active')) return;

            const walletRegex = /^0x[a-fA-F0-9]{40}$/;
            if (!walletRegex.test(walletInput.value)) {
                errorMsg.innerText = "Please enter a valid ETH address";
                errorMsg.style.display = 'block';
                walletInput.style.borderColor = '#ff4d4f';
                return;
            }

            errorMsg.style.display = 'none';
            walletInput.style.borderColor = 'rgba(255, 255, 255, 0.15)';

            // Success state
            enterBtn.innerHTML = "Successfully Entered!";
            enterBtn.style.background = "#5eead4";
            enterBtn.style.color = "#0f0f14";
            enterBtn.style.pointerEvents = "none";

            setTimeout(() => {
                alert(`You've been entered with ${currentPoints} points! Good luck team Pippin.`);
            }, 500);
        });

        walletInput.addEventListener('input', () => {
            errorMsg.style.display = 'none';
            walletInput.style.borderColor = '';

            clearTimeout(typingTimer);
            if (walletInput.value) {
                typingTimer = setTimeout(() => autoVerifyWallet(walletInput.value), 800);
            }
        });
    }
});

async function autoVerifyWallet(wallet) {
    const taskCard = document.querySelector('.task-card[data-task="hold"]');
    if (!taskCard || taskCard.classList.contains('completed')) return;

    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!walletRegex.test(wallet)) return;

    const btn = taskCard.querySelector('.verify-btn');
    const points = parseInt(taskCard.dataset.points);

    if (btn) {
        btn.innerText = 'Verifying...';
        btn.style.opacity = '0.7';
    }

    try {
        // Contract mocked to Pudgy Penguins for realistic testing (Since Pippin is TBA)
        const PIPPIN_CONTRACT_ADDRESS = "0xbd3531da5cf5857e7cfaa92426877b022e612cf8";
        const url = `https://eth-mainnet.g.alchemy.com/nft/v3/docs-demo/getNFTsForOwner?owner=${wallet}&contractAddresses[]=${PIPPIN_CONTRACT_ADDRESS}&withMetadata=false`;

        const response = await fetch(url);
        const data = await response.json();

        let existingMsg = taskCard.querySelector('.verify-msg');
        if (!existingMsg) {
            existingMsg = document.createElement('div');
            existingMsg.className = 'verify-msg';
            existingMsg.style.fontSize = '0.85rem';
            existingMsg.style.marginTop = '6px';
            existingMsg.style.fontWeight = '600';
            const details = taskCard.querySelector('.task-details');
            if (details) details.appendChild(existingMsg);
        }

        if (data && data.ownedNfts && data.ownedNfts.length > 0) {
            processTaskComplete(points, taskCard);
            existingMsg.style.color = '#5eead4';
            existingMsg.innerHTML = "✅ Verified Pippin Holder";
            taskCard.style.borderColor = '#5eead4';

            if (btn) btn.style.display = 'none';
        } else {
            if (btn) {
                btn.innerText = 'Verify';
                btn.style.opacity = '1';
            }
            existingMsg.style.color = '#ff6ec7';
            existingMsg.innerHTML = "❌ No Pippin NFT detected";
        }
    } catch (err) {
        console.error("Verification error:", err);
        if (btn) {
            btn.innerText = 'Verify';
            btn.style.opacity = '1';
        }
    }
}

// Modal Logic for Question
function openQuestionModal() {
    const questionTask = document.querySelector('.task-card[data-task="question"]');
    if (questionTask && questionTask.classList.contains('completed')) return;
    const modal = document.getElementById('questionModal');
    if (modal) modal.style.display = 'flex';
}

function closeQuestionModal() {
    const modal = document.getElementById('questionModal');
    if (modal) modal.style.display = 'none';
}

function submitAnswer(isCorrect) {
    if (isCorrect) {
        closeQuestionModal();
        const questionTask = document.querySelector('.task-card[data-task="question"]');
        if (questionTask) {
            const points = parseInt(questionTask.dataset.points);
            processTaskComplete(points, questionTask);
        }
    } else {
        alert("Incorrect! Try again.");
    }
}

// Close modal if clicked out
window.onclick = function (event) {
    const modal = document.getElementById('questionModal');
    if (event.target == modal) {
        closeQuestionModal();
    }
}
