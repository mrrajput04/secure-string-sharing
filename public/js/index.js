// Form submission handler
document.getElementById('secure-string-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('file-input');
    const secretInput = document.getElementById('secret-input');
    const password = document.getElementById('password-input').value.trim();
    const expiration = document.getElementById('expiration-select').value;
    
    if (!password || !expiration) {
        alert('Please enter all required fields.');
        return;
    }

    try {
        let response;
        if (fileInput.files.length > 0) {
            // Handle file upload
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('password', password);
            formData.append('expiration', expiration);
            response = await fetch('/api/files', {
                method: 'POST',
                body: formData
            });
        } else if (secretInput.value.trim()) {
            // Handle text input
            response = await fetch('/api/strings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    string: secretInput.value.trim(),
                    password,
                    expiration
                })
            });
        } else {
            alert('Please enter either text or select a file.');
            return;
        }

        const data = await response.json();
        
        if (data.success && data.shareUrl) {
            document.getElementById('generated-link').innerHTML = 
                `<strong>Share this link:</strong> 
                 <div class="input-group mb-3">
                    <input type="text" class="form-control" value="${data.shareUrl}" readonly>
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onclick="copyToClipboard('${data.shareUrl}')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                 </div>`;
            
            // Display QR code if available
            if (data.qrCode) {
                document.getElementById('qr-code-display').innerHTML = 
                    `<img src="${data.qrCode}" alt="QR Code" class="img-fluid" style="max-width: 200px;">`;
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the secure link.');
    }
});

// Theme handling
function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('preferred-theme', theme);
}

// Initialize theme
const savedTheme = localStorage.getItem('preferred-theme') || 'light';
document.getElementById('theme-select').value = savedTheme;
changeTheme(savedTheme);