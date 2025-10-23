// SafeLink Generator - Main JavaScript
// Version 1.0.0

// Security: Disable right-click
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Security: Disable F12, Ctrl+Shift+I, Ctrl+U
document.addEventListener('keydown', function(e) {
    if (e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
        (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
    }
});

// IMPROVED: Enhanced URL Validation
function validateURL(url) {
    const validationMsg = document.getElementById('urlValidation');
    const input = document.getElementById('targetUrl');
    
    if (!url || url.trim() === '') {
        input.classList.remove('success');
        input.classList.add('error');
        validationMsg.className = 'validation-message error';
        validationMsg.textContent = '❌ URL cannot be empty';
        return false;
    }

    if (url.length < 10) {
        input.classList.remove('success');
        input.classList.add('error');
        validationMsg.className = 'validation-message error';
        validationMsg.textContent = '❌ URL too short. Please enter a valid URL';
        return false;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        input.classList.remove('success');
        input.classList.add('error');
        validationMsg.className = 'validation-message error';
        validationMsg.textContent = '❌ URL must start with http:// or https://';
        return false;
    }

    try {
        const urlObj = new URL(url);
        
        if (!urlObj.hostname || urlObj.hostname.length < 3) {
            throw new Error('Invalid hostname');
        }

        if (!urlObj.hostname.includes('.')) {
            throw new Error('Invalid domain - missing TLD');
        }

        const hostname = urlObj.hostname.toLowerCase();
        const privatePatterns = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
        if (privatePatterns.some(pattern => hostname === pattern || hostname.startsWith(pattern))) {
            input.classList.remove('success');
            input.classList.add('error');
            validationMsg.className = 'validation-message error';
            validationMsg.textContent = '⚠️ Local URLs cannot be used for public SafeLinks';
            return false;
        }

        const tld = urlObj.hostname.split('.').pop();
        if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
            throw new Error('Invalid TLD');
        }

        input.classList.remove('error');
        input.classList.add('success');
        validationMsg.className = 'validation-message success';
        validationMsg.textContent = '✓ Valid URL';
        return true;

    } catch (e) {
        input.classList.remove('success');
        input.classList.add('error');
        validationMsg.className = 'validation-message error';
        validationMsg.textContent = '❌ Invalid URL format. Please check your URL';
        return false;
    }
}

// Real-time URL validation
document.getElementById('targetUrl').addEventListener('input', function(e) {
    const url = e.target.value.trim();
    if (url.length > 0) {
        validateURL(url);
    } else {
        e.target.classList.remove('success', 'error');
        document.getElementById('urlValidation').style.display = 'none';
    }
});

// NEW: SHA-256 Password Hashing Function
async function hashPassword(password) {
    if (!password) return null;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// IMPROVED: Generate SafeLink with better error handling
async function generateSafeLink() {
    const baseUrl = 'https://safelinkurl.wahyu-blogger.site';
    const targetUrl = document.getElementById('targetUrl').value.trim();
    const paramName = document.getElementById('paramName').value;
    const password = document.getElementById('password').value.trim();
    const generateBtn = document.getElementById('generateBtn');

    if (!validateURL(targetUrl)) {
        return;
    }

    generateBtn.disabled = true;
    generateBtn.classList.add('btn-loading');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = 'Generating...';

    try {
        const hashedPassword = await hashPassword(password);
        
        const dataObject = {
            url: targetUrl,
            pwd: hashedPassword
        };
        
        const jsonString = JSON.stringify(dataObject);
        const compressed = LZString.compressToEncodedURIComponent(jsonString);
        
        const safeLink = `${baseUrl}/safelink.html?${paramName}=${compressed}`;

        const originalLength = targetUrl.length;
        const shortenedLength = compressed.length;
        const compressionRate = Math.round((1 - shortenedLength / originalLength) * 100);

        document.getElementById('safelink').textContent = safeLink;
        document.getElementById('previewLink').href = safeLink;
        document.getElementById('originalLength').textContent = originalLength;
        document.getElementById('shortenedLength').textContent = shortenedLength;
        document.getElementById('compression').textContent = compressionRate + '%';
        document.getElementById('result').classList.add('show');

        setTimeout(() => {
            document.getElementById('result').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 100);

    } catch (error) {
        alert('❌ Error generating SafeLink: ' + error.message + '\n\nPlease try again or contact support if the problem persists.');
        console.error('Generation error:', error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.classList.remove('btn-loading');
        generateBtn.textContent = originalText;
    }
}

function shortenManually() {
    const safelink = document.getElementById('safelink').textContent;
    
    if (!safelink) {
        alert('⚠️ Please generate a SafeLink first!');
        return;
    }

    navigator.clipboard.writeText(safelink).then(function() {
        const tinyUrlCreate = `https://tinyurl.com/create.php?url=${encodeURIComponent(safelink)}`;
        const newWindow = window.open(tinyUrlCreate, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
        
        alert('✅ Link already copied!\n\n📋 TinyURL opened in new tab with link pre-filled.\n\nClick "Make TinyURL!" to shorten link.\n\n💡 Short link will redirect to your SafeLink - countdown & ads still appear!');
    }, function(err) {
        const tinyUrlCreate = `https://tinyurl.com/create.php?url=${encodeURIComponent(safelink)}`;
        const newWindow = window.open(tinyUrlCreate, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
        
        alert('📋 TinyURL opened in new tab.\n\nPaste (Ctrl+V) link in the available field, then click "Make TinyURL!"');
    });
}

function copySafeLink() {
    const safelink = document.getElementById('safelink').textContent;
    const copyBtn = event.target;

    if (!safelink) {
        alert('⚠️ No link to copy!');
        return;
    }

    navigator.clipboard.writeText(safelink).then(function() {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.classList.add('copied');

        setTimeout(function() {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    }, function(err) {
        alert('❌ Failed to copy: ' + err.message);
    });
}

// Allow Enter key to generate
document.getElementById('targetUrl').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        generateSafeLink();
    }
});

// Security: Add noopener noreferrer to all external links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[target="_blank"]');
    links.forEach(function(link) {
        link.rel = 'noopener noreferrer';
    });
});
