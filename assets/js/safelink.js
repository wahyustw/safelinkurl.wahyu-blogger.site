// SafeLink Page - Main JavaScript
// Version 1.0.0

// Security measures
(function() {
    const noop = function() {};
    const methods = ['log', 'warn', 'error', 'info', 'debug'];
    methods.forEach(function(method) {
        console[method] = noop;
    });
})();

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('keydown', function(e) {
    if (e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
        (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
    }
});

// NEW: SHA-256 Password Hashing for verification
async function hashPassword(password) {
    if (!password) return null;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// IMPROVED: Enhanced decryption with better error handling
function decryptURL(encrypted) {
    try {
        if (!encrypted) {
            throw new Error('No encrypted data provided');
        }

        const decompressed = LZString.decompressFromEncodedURIComponent(encrypted);
        
        if (decompressed) {
            try {
                const dataObject = JSON.parse(decompressed);
                
                if (!dataObject.url) {
                    throw new Error('Invalid data structure');
                }
                
                return dataObject;
            } catch(e) {
                return { url: decompressed, pwd: null };
            }
        }
        
        const base64Decoded = atob(encrypted);
        
        if (!base64Decoded || base64Decoded.length < 10) {
            throw new Error('Invalid decoded data');
        }
        
        return { url: base64Decoded, pwd: null };
    } catch (e) {
        console.error('Decryption error:', e);
        return null;
    }
}

// IMPROVED: URL validation before redirect
function isValidURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
        const urlObj = new URL(url);
        
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false;
        }
        
        if (!urlObj.hostname || urlObj.hostname.length < 3) {
            return false;
        }
        
        if (!urlObj.hostname.includes('.')) {
            return false;
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const encryptedURL = urlParams.get('url') || 
                    urlParams.get('go') || 
                    urlParams.get('link') || 
                    urlParams.get('to') || 
                    urlParams.get('redirect') ||
                    urlParams.get('s') ||
                    urlParams.get('d');

let targetURL = null;
let requiredPassword = null;
let countdown = 5;
let startTime = Date.now();
let duration = countdown * 1000;
let isVerified = false;

// IMPROVED: Enhanced initialization with validation
if (encryptedURL) {
    try {
        const decryptedData = decryptURL(encryptedURL);
        
        if (decryptedData && decryptedData.url) {
            if (isValidURL(decryptedData.url)) {
                targetURL = decryptedData.url;
                requiredPassword = decryptedData.pwd;
            } else {
                throw new Error('Invalid target URL format');
            }
        } else {
            throw new Error('Failed to decrypt URL');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('error').style.display = 'block';
        document.getElementById('countdownBox').style.display = 'none';
    }
} else {
    document.getElementById('error').textContent = '❌ No encrypted URL provided. Please check your link.';
    document.getElementById('error').style.display = 'block';
    document.getElementById('countdownBox').style.display = 'none';
}

// Countdown function
function updateCountdown() {
    if (!targetURL) return;

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    const seconds = Math.ceil(remaining / 1000);
    
    document.getElementById('countdown').textContent = seconds;
    
    const progress = ((duration - remaining) / duration) * 100;
    document.getElementById('progress').style.width = progress + '%';
    
    if (remaining <= 0) {
        showButton();
    } else {
        requestAnimationFrame(updateCountdown);
    }
}

function showButton() {
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('countdownLabel').textContent = 'Link ready to access!';
    document.getElementById('countdown').textContent = '✓';
    
    if (requiredPassword) {
        document.getElementById('passwordBox').classList.add('show');
        document.getElementById('passwordInput').focus();
    } else {
        document.getElementById('verifyBtn').style.display = 'inline-block';
    }
}

// IMPROVED: Password verification with hashing
async function checkPassword() {
    const inputPassword = document.getElementById('passwordInput').value;
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('passwordError');
    
    if (!inputPassword) {
        errorMsg.textContent = '⚠️ Please enter a password';
        errorMsg.classList.add('show');
        passwordInput.focus();
        return;
    }

    try {
        const hashedInput = await hashPassword(inputPassword);
        
        if (hashedInput === requiredPassword) {
            errorMsg.classList.remove('show');
            document.getElementById('passwordBox').style.display = 'none';
            document.getElementById('verifyBtn').style.display = 'inline-block';
        } else {
            errorMsg.textContent = '❌ Incorrect password! Please try again.';
            errorMsg.classList.add('show');
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        errorMsg.textContent = '❌ Error verifying password. Please try again.';
        errorMsg.classList.add('show');
        console.error('Password verification error:', error);
    }
}

function verifyLink() {
    if (isVerified) return;
    
    const verifyURL = 'https://offensivefountainrabbit.com/a90dwxa6?key=702e03348d76e695e837465455e9e37b';
    
    try {
        const newWindow = window.open(verifyURL, '_blank', 'noopener,noreferrer');
        
        if (newWindow) {
            newWindow.opener = null;
        }
        
        isVerified = true;
        
        document.getElementById('verifyBtn').style.display = 'none';
        document.getElementById('accessBtn').style.display = 'inline-block';
    } catch (error) {
        alert('❌ Unable to open verification window. Please allow pop-ups for this site.');
        console.error('Verification error:', error);
    }
}

// IMPROVED: Secure redirect with validation
function redirectToTarget() {
    if (!targetURL) {
        alert('❌ No target URL available');
        return;
    }

    if (!isVerified) {
        alert('⚠️ Please verify the link first by clicking "Verify Link" button');
        return;
    }

    if (!isValidURL(targetURL)) {
        alert('❌ Invalid target URL. Cannot redirect.');
        return;
    }

    try {
        const a = document.createElement('a');
        a.href = targetURL;
        a.rel = 'noopener noreferrer';
        a.target = '_self';
        
        if (document.referrer) {
            window.location.replace(targetURL);
        } else {
            window.location.href = targetURL;
        }
    } catch (error) {
        alert('❌ Error redirecting to target URL: ' + error.message);
        console.error('Redirect error:', error);
    }
}

// Start countdown
if (targetURL) {
    updateCountdown();
}

// Security: History management
window.addEventListener('beforeunload', function() {
    if (window.history && window.history.pushState) {
        window.history.pushState(null, '', window.location.href);
    }
});

if (window.history && window.history.pushState) {
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', function() {
        window.history.pushState(null, '', window.location.href);
    });
}
