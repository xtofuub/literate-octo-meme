// JavaScript for Email Spoofing Tool

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Form submissions
    const emailForm = document.getElementById('emailForm');
    const testForm = document.getElementById('testForm');
    const serversForm = document.getElementById('serversForm');

    // Email form submission
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendEmail();
        });
    }

    // Test connection form submission
    if (testForm) {
        testForm.addEventListener('submit', function(e) {
            e.preventDefault();
            testConnection();
        });
    }

    // Test servers form submission
    if (serversForm) {
        serversForm.addEventListener('submit', function(e) {
            e.preventDefault();
            testServers();
        });
    }

    // Tab switching - copy SMTP settings between tabs
    const smtpFields = ['smtp_server', 'smtp_port', 'username', 'password'];
    
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const target = e.target.getAttribute('data-bs-target');
            
            if (target === '#test') {
                // Copy from send tab to test tab
                smtpFields.forEach(field => {
                    const sourceField = document.getElementById(field);
                    const targetField = document.getElementById('test_' + field);
                    if (sourceField && targetField) {
                        targetField.value = sourceField.value;
                    }
                });
            } else if (target === '#send') {
                // Copy from test tab to send tab
                smtpFields.forEach(field => {
                    const sourceField = document.getElementById('test_' + field);
                    const targetField = document.getElementById(field);
                    if (sourceField && targetField && sourceField.value) {
                        targetField.value = sourceField.value;
                    }
                });
            }
        });
    });

    // Auto-fill reply-to with from-email
    const fromEmailField = document.getElementById('from_email');
    const replyToField = document.getElementById('reply_to');
    
    if (fromEmailField && replyToField) {
        fromEmailField.addEventListener('blur', function() {
            if (!replyToField.value) {
                replyToField.value = this.value;
            }
        });
    }
});

function showLoading(text = 'Please wait while we process your request.') {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.textContent = text;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
    modal.show();
}

function hideLoading() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (modal) {
        modal.hide();
    }
}

function showAlert(message, type = 'success') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function sendEmail() {
    showLoading('Sending email...');
    
    const formData = new FormData(document.getElementById('emailForm'));
    
    fetch('/send_email', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showAlert(data.message, 'success');
            // Reset form
            document.getElementById('emailForm').reset();
        } else {
            showAlert(data.error, 'danger');
        }
    })
    .catch(error => {
        hideLoading();
        showAlert('An error occurred: ' + error.message, 'danger');
    });
}

function testConnection() {
    showLoading('Testing SMTP connection...');
    
    const formData = new FormData(document.getElementById('testForm'));
    
    fetch('/test_connection', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showAlert(data.message, 'success');
        } else {
            showAlert(data.error, 'danger');
        }
    })
    .catch(error => {
        hideLoading();
        showAlert('An error occurred: ' + error.message, 'danger');
    });
}

function testServers() {
    showLoading('Testing SMTP servers...');
    
    const formData = new FormData(document.getElementById('serversForm'));
    
    fetch('/test_servers', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showAlert(data.message, 'success');
            displayServerResults(data.working_servers);
        } else {
            showAlert(data.error, 'danger');
        }
    })
    .catch(error => {
        hideLoading();
        showAlert('An error occurred: ' + error.message, 'danger');
    });
}

function displayServerResults(servers) {
    const resultsDiv = document.getElementById('serversResults');
    const serversListDiv = document.getElementById('serversList');
    
    if (servers && servers.length > 0) {
        let html = '<div class="row">';
        
        servers.forEach(server => {
            html += `
                <div class="col-md-6 mb-3">
                    <div class="server-item server-success">
                        <div class="d-flex align-items-center">
                            <span class="status-indicator status-success"></span>
                            <div>
                                <h6 class="mb-1">${server.server}:${server.port}</h6>
                                <small class="text-muted">${server.username}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        serversListDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    } else {
        serversListDiv.innerHTML = '<p class="text-muted">No working servers found.</p>';
        resultsDiv.style.display = 'block';
    }
}

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateForm(formId) {
    const form = document.getElementById(formId);
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
        
        // Email validation
        if (field.type === 'email' && field.value) {
            if (!validateEmail(field.value)) {
                field.classList.add('is-invalid');
                isValid = false;
            }
        }
    });
    
    return isValid;
}

// Add form validation to all forms
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        if (!validateForm(this.id)) {
            e.preventDefault();
            showAlert('Please fill in all required fields correctly.', 'warning');
        }
    });
});

// Real-time validation
document.querySelectorAll('input[required], textarea[required]').forEach(field => {
    field.addEventListener('blur', function() {
        if (this.value.trim()) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
    });
});

// File upload validation
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', function() {
        const files = this.files;
        const maxSize = 16 * 1024 * 1024; // 16MB
        const allowedTypes = ['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'];
        
        for (let file of files) {
            // Check file size
            if (file.size > maxSize) {
                showAlert(`File ${file.name} is too large. Maximum size is 16MB.`, 'warning');
                this.value = '';
                return;
            }
            
            // Check file type
            const extension = file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(extension)) {
                showAlert(`File ${file.name} has an unsupported format.`, 'warning');
                this.value = '';
                return;
            }
        }
    });
});

// Auto-resize textarea
document.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
});

// Copy to clipboard functionality
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showAlert('Copied to clipboard!', 'success');
    }, function(err) {
        showAlert('Failed to copy to clipboard', 'danger');
    });
}

// Add copy buttons to server results
function addCopyButtons() {
    document.querySelectorAll('.server-item').forEach(item => {
        const serverInfo = item.querySelector('h6').textContent;
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-sm btn-outline-primary ms-auto';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.onclick = () => copyToClipboard(serverInfo);
        
        const flexDiv = item.querySelector('.d-flex');
        flexDiv.appendChild(copyBtn);
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to submit forms
    if (e.ctrlKey && e.key === 'Enter') {
        const activeForm = document.querySelector('form:not([style*="display: none"])');
        if (activeForm) {
            activeForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
        if (modal) {
            modal.hide();
        }
    }
});

// Auto-save form data to localStorage
function saveFormData(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem(`form_${formId}`, JSON.stringify(data));
}

function loadFormData(formId) {
    const data = localStorage.getItem(`form_${formId}`);
    if (data) {
        const formData = JSON.parse(data);
        const form = document.getElementById(formId);
        
        Object.keys(formData).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field && field.type !== 'file') {
                field.value = formData[key];
            }
        });
    }
}

// Auto-save and load for all forms
document.querySelectorAll('form').forEach(form => {
    // Load saved data on page load
    loadFormData(form.id);
    
    // Save data on input change
    form.addEventListener('input', function() {
        saveFormData(this.id);
    });
    
    // Clear saved data on successful submit
    form.addEventListener('submit', function() {
        setTimeout(() => {
            localStorage.removeItem(`form_${this.id}`);
        }, 1000);
    });
});
