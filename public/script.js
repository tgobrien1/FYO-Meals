class RFIDCheckIn {
    constructor() {
        this.rfidInput = document.getElementById('rfidInput');
        this.status = document.getElementById('status');
        this.form = document.getElementById('rfidForm');
        this.successCount = 0;
        this.failureCount = 0;
        this.processing = false;
        this.timeout = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUserInfo();
        this.keepInputFocused();
    }
    
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Auto-submit when RFID is scanned
        this.rfidInput.addEventListener('input', () => {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                if (this.rfidInput.value.length >= 8 && !this.processing) {
                    this.form.dispatchEvent(new Event('submit'));
                }
            }, 150);
        });
        
        // Keep focus on input
        this.rfidInput.addEventListener('blur', () => {
            setTimeout(() => this.rfidInput.focus(), 100);
        });
        
        // Prevent form auto-complete
        this.rfidInput.setAttribute('autocomplete', 'off');
    }
   
    async loadUserInfo() {
        // In a real app, you'd fetch this from an API
        // For now, we'll just show a placeholder
        document.getElementById('userInfo').textContent = 'Authenticated User';
    }
    
    keepInputFocused() {
        // Ensure input stays focused
        setInterval(() => {
            if (document.activeElement !== this.rfidInput && !this.processing) {
                this.rfidInput.focus();
            }
        }, 1000);
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.processing) return;
        
        const rfidId = this.rfidInput.value.trim();
        if (!rfidId) return;
        
        this.processing = true;
        this.showStatus('🔍 Looking up student...', 'loading');
        
        try {
            const response = await fetch('/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rfidId })
            });
            
            if (response.status === 401) {
                window.location.href = '/auth/login';
                return;
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.handleSuccess(result.student);
            } else {
                this.handleFailure(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            this.handleFailure('System error. Please try again.');
        }
    }
    
    handleSuccess(student) {
        this.successCount++;
        this.updateStats();
        this.showStatus(
            `✅ Welcome, ${student.name}! (${student.andrewid})`, 
            'success'
        );
    }
    
    handleFailure(error) {
        this.failureCount++;
        this.updateStats();
        this.showStatus(`❌ ${error}`, 'failure');
    }
    
    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = 'status ' + type;
        this.status.style.display = 'block';
        
        if (type === 'success' || type === 'failure') {
            setTimeout(() => {
                this.status.style.display = 'none';
                this.resetForm();
            }, 3000);
        }
    }
    
    resetForm() {
        this.rfidInput.value = '';
        this.rfidInput.focus();
        this.processing = false;
    }
    
    updateStats() {
        document.getElementById('successCount').textContent = this.successCount;
        document.getElementById('failureCount').textContent = this.failureCount;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RFIDCheckIn();
});
 
