// loginpag.js
async function checkpassword() {
    const uid = document.getElementById('input-email').value;
    const password = document.getElementById('input-pass').value;
    const checkbox = document.getElementById('input-check');

    if (!checkbox.checked) {
        alert('Please agree to the terms and conditions');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = '/vote';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
    }
}

// app.js (for voting page)
async function vote() {
    const selectedCandidate = document.querySelector('input[name="vote"]:checked');
    
    if (!selectedCandidate) {
        alert('Please select a candidate');
        return;
    }

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ candidateId: selectedCandidate.id })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Vote cast successfully!');
            window.location.href = '/';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
    }
}