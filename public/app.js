

// Get constituency from session
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const constituencyElement = document.querySelector('.constituency p');
        if (constituencyElement) {
            // You could fetch this from a /api/user-info endpoint if needed
            constituencyElement.textContent = sessionStorage.getItem('constituency') || 'Not Set';
        }
    } catch (error) {
        console.error('Error loading constituency:', error);
    }
});

// Toggle password visibility in login form
const eyeIcon = document.getElementById('input-icon');
if (eyeIcon) {
    eyeIcon.addEventListener('click', () => {
        const passwordInput = document.getElementById('input-pass');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.remove('ri-eye-off-line');
            eyeIcon.classList.add('ri-eye-line');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('ri-eye-line');
            eyeIcon.classList.add('ri-eye-off-line');
        }
    });
}

// Handle voting
async function vote() {
    const selectedCandidate = document.querySelector('input[name="vote"]:checked');
    const messageElement = document.querySelector('.message');
    
    if (!selectedCandidate) {
        messageElement.textContent = 'Please select a candidate first!';
        messageElement.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                candidateId: selectedCandidate.id
            })
        });

        const data = await response.json();

        if (response.ok) {
            messageElement.textContent = 'Vote cast successfully!';
            messageElement.style.color = 'green';
            
            // Show success message and redirect
            alert('Thank you for voting!');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            messageElement.textContent = data.message || 'Error casting vote';
            messageElement.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        messageElement.textContent = 'An error occurred while casting your vote';
        messageElement.style.color = 'red';
    }
}

// Handle candidate selection
const candidates = document.querySelectorAll('.candidate');
candidates.forEach(candidate => {
    candidate.addEventListener('click', () => {
        // Find the radio button within this candidate div
        const radio = candidate.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = true;
            
            // Remove selected class from all candidates
            candidates.forEach(c => c.classList.remove('selected'));
            // Add selected class to clicked candidate
            candidate.classList.add('selected');
            
            // Update message
            const messageElement = document.querySelector('.message');
            messageElement.textContent = 'Click Vote button to confirm your choice';
            messageElement.style.color = 'black';
        }
    });
});

// Prevent multiple votes
window.addEventListener('beforeunload', () => {
    const hasVoted = sessionStorage.getItem('hasVoted');
    if (hasVoted) {
        sessionStorage.clear();
    }
});

// Add loading indicators
function showLoading() {
    const button = document.querySelector('.submit');
    if (button) {
        button.disabled = true;
        button.textContent = 'Processing...';
    }
}

function hideLoading() {
    const button = document.querySelector('.submit');
    if (button) {
        button.disabled = false;
        button.textContent = 'Vote';
    }
}

// Enhance form submission with loading state
document.querySelector('.submit')?.addEventListener('click', async (e) => {
    e.preventDefault();
    showLoading();
    await vote();
    hideLoading();
});

// Add client-side validation
function validateVote() {
    const selectedCandidate = document.querySelector('input[name="vote"]:checked');
    const messageElement = document.querySelector('.message');
    
    if (!selectedCandidate) {
        messageElement.textContent = 'Please select a candidate!';
        messageElement.style.color = 'red';
        return false;
    }
    
    return true;
}

// Add confirmation dialog
function confirmVote() {
    const selectedCandidate = document.querySelector('input[name="vote"]:checked');
    const candidateName = selectedCandidate?.closest('.candidate')?.querySelector('.name')?.textContent;
    
    return confirm(`Are you sure you want to vote for ${candidateName}? This action cannot be undone.`);
}

// Update vote function to include validation and confirmation
const originalVote = vote;
window.vote = async function() {
    if (validateVote() && confirmVote()) {
        await originalVote();
    }
};
