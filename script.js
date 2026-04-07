// Simple SPA Router & Logic Wrapper
const app = {
    init() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM() {
        this.navLinks = document.querySelectorAll('.nav-links a[data-target]');
        this.views = document.querySelectorAll('.view');
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-links');

        // Tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');

        // Login Logic
        this.loginForm = document.getElementById('login-form');
        this.loginFormContainer = document.getElementById('login-form-container');
        this.registerForm = document.getElementById('register-form');
        this.registerFormContainer = document.getElementById('register-form-container');
        this.userDashboard = document.getElementById('user-dashboard');
        this.logoutBtn = document.getElementById('logout-btn');

        // Checkout Logic
        this.paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
        this.cardPaymentForm = document.getElementById('card-payment-form');
        this.qrPaymentSection = document.getElementById('qr-payment-section');
        this.cartPlanName = document.getElementById('cart-plan-name');
        this.cartTotal = document.getElementById('cart-total');
        this.paymentQr = document.getElementById('payment-qr');
        this.qrAmountDisplay = document.getElementById('qr-amount-display');
        
        // New Payment Elements
        this.upiIdPaymentSection = document.getElementById('upi-id-payment-section');
        this.upiIdInput = document.getElementById('upi-id-input');
        this.upiAmountDisplay = document.getElementById('upi-amount-display');
        
        // Success Overlay
        this.successOverlay = document.getElementById('success-overlay');
        this.successPlanName = document.getElementById('success-plan-name');
        this.detailPlan = document.getElementById('detail-plan');
        this.detailAmount = document.getElementById('detail-amount');
        this.detailStart = document.getElementById('detail-start');
        this.detailEnd = document.getElementById('detail-end');
        this.transactionId = document.getElementById('transaction-id');
    },

    bindEvents() {
        // Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = e.currentTarget.getAttribute('data-target');
                this.navigate(targetId);

                // close mobile menu if open
                if (this.navMenu.classList.contains('active')) {
                    this.navMenu.classList.remove('active');
                }
            });
        });

        // Mobile Menu
        this.hamburger.addEventListener('click', () => {
            this.navMenu.classList.toggle('active');
        });

        // Payment Method Toggle
        if (this.paymentMethodRadios) {
            this.paymentMethodRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    // Hide all sections first
                    if (this.cardPaymentForm) this.cardPaymentForm.classList.add('hidden');
                    if (this.qrPaymentSection) this.qrPaymentSection.classList.add('hidden');
                    if (this.upiIdPaymentSection) this.upiIdPaymentSection.classList.add('hidden');

                    if (e.target.value === 'qr') {
                        if (this.qrPaymentSection) this.qrPaymentSection.classList.remove('hidden');
                    } else if (e.target.value === 'upi-id') {
                        if (this.upiIdPaymentSection) this.upiIdPaymentSection.classList.remove('hidden');
                    } else {
                        if (this.cardPaymentForm) this.cardPaymentForm.classList.remove('hidden');
                    }
                });
            });
        }

        // Initialize Scroll Reveal
        this.initScrollReveal();

        // Tabs (Workouts & Diet)
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.getAttribute('data-tab');
                const parentSection = e.currentTarget.closest('section');

                // Remove active classes in scope
                parentSection.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                parentSection.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                // Add active
                e.currentTarget.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });

        // Login Flow (Connected to Backend)
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;

                try {
                    const response = await fetch('http://localhost:8080/api/users/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    if (response.ok) {
                        const user = await response.json();
                        this.updateUserStateFromDb(user);
                        this.loginFormContainer.classList.add('hidden');
                        this.userDashboard.classList.remove('hidden');
                        this.renderDashboard();
                    } else {
                        const error = await response.json();
                        if (error.message === 'User not found') {
                            alert('Details not found in database. Please register.');
                            this.toggleAuthMode('register');
                        } else {
                            alert('Login Failed: ' + (error.message || 'Invalid credentials'));
                        }
                    }
                } catch (err) {
                    console.error('Error logging in:', err);
                    alert('Could not connect to backend. Make sure the Java backend is running on port 8080.');
                }
            });
        }

        // Register Flow (Connected to Backend)
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value;
                const age = document.getElementById('reg-age').value;
                const mobile = document.getElementById('reg-mobile').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;

                try {
                    const response = await fetch('http://localhost:8080/api/users/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, age, mobile, email, password })
                    });

                    if (response.ok) {
                        const user = await response.json();
                        this.updateUserStateFromDb(user);
                        this.registerFormContainer.classList.add('hidden');
                        this.userDashboard.classList.remove('hidden');
                        this.renderDashboard();
                    } else {
                        const error = await response.json();
                        alert('Registration Failed: ' + (error.message || 'Error occurred'));
                    }
                } catch (err) {
                    console.error('Error registering:', err);
                    alert('Could not connect to backend. Make sure the Java backend is running on port 8080.');
                }
            });
        }

        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => {
                this.userDashboard.classList.add('hidden');
                this.loginFormContainer.classList.remove('hidden');
            });
        }
    },

    mockUserState: {
        id: null,
        email: '',
        mobile: '',
        name: 'Alex',
        status: 'active', // 'active', 'expired', 'no_plan'
        plan: 'PRO TIER',
        startDate: 'Oct 25, 2025',
        endDate: 'Oct 25, 2026',
        workoutsLogged: 128,
        workoutsThisMonth: 14
    },

    updateUserStateFromDb(user) {
        this.mockUserState.id = user.id;
        this.mockUserState.name = user.name;
        this.mockUserState.email = user.email;
        this.mockUserState.mobile = user.mobile || '';
        this.mockUserState.status = user.status || 'no_plan';
        this.mockUserState.plan = user.plan || 'None';
        this.mockUserState.startDate = user.startDate || 'N/A';
        this.mockUserState.endDate = user.endDate || 'N/A';
        this.mockUserState.workoutsLogged = user.workoutsLogged || 0;
        this.mockUserState.workoutsThisMonth = user.workoutsThisMonth || 0;
    },

    toggleAuthMode(mode) {
        if (mode === 'register') {
            this.loginFormContainer.classList.add('hidden');
            this.registerFormContainer.classList.remove('hidden');
        } else {
            this.registerFormContainer.classList.add('hidden');
            this.loginFormContainer.classList.remove('hidden');
        }
    },

    setMockState(status) {
        this.mockUserState.status = status;
        this.renderDashboard();
    },

    renderDashboard() {
        const statsContainer = document.getElementById('dash-stats-container');
        const nameEl = document.getElementById('dash-user-name');
        if (!statsContainer || !nameEl) return;

        nameEl.innerText = this.mockUserState.name + '!';
        const user = this.mockUserState;
        let html = '';

        if (user.status === 'active') {
            html = `
                <div class="stat-card">
                    <h4>Subscription Status</h4>
                    <div class="stat-value active-status">Active</div>
                    <p>Ends on: <strong>${user.endDate}</strong></p>
                    <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.5rem;">Started: ${user.startDate}</p>
                </div>
                <div class="stat-card">
                    <h4>Current Plan</h4>
                    <div class="stat-value">${user.plan}</div>
                    <button class="btn-outline small" onclick="app.navigate('subscription-view')">Manage</button>
                </div>
            `;
        } else if (user.status === 'expired') {
            html = `
                <div class="stat-card">
                    <h4>Subscription Status</h4>
                    <div class="stat-value status-expired">Expired</div>
                    <p class="text-muted">Expired on: ${user.endDate}</p>
                </div>
                <div class="stat-card">
                    <h4>Current Plan</h4>
                    <div class="stat-value">${user.plan}</div>
                    <button class="btn-primary small" onclick="app.navigate('membership-view')" style="margin-top: 0.5rem;">Renew Plan</button>
                </div>
            `;
        } else {
            html = `
                <div class="stat-card" style="grid-column: span 2;">
                    <h4>Subscription Status</h4>
                    <div class="stat-value status-none">No Active Plan</div>
                    <p style="margin-bottom: 1rem;">Choose a membership plan to unlock gym access.</p>
                    <button class="btn-primary" onclick="app.navigate('membership-view')">Subscribe / Take Plan</button>
                </div>
            `;
        }

        html += `
            <div class="stat-card">
                <h4>Workouts Logged</h4>
                <div class="stat-value">${user.workoutsLogged}</div>
                <p>This month: <strong>${user.workoutsThisMonth}</strong></p>
            </div>
        `;

        statsContainer.innerHTML = html;
    },

    selectPlan(planName, amountStr) {
        if (!this.mockUserState.id) {
            alert('Please login first to access the gym & subscribe to a plan.');
            this.navigate('login-view');
            return;
        }

        if (this.cartPlanName) this.cartPlanName.innerText = planName + ' TIER';
        if (this.cartTotal) this.cartTotal.innerText = '₹' + amountStr + '.00';
        if (this.qrAmountDisplay) this.qrAmountDisplay.innerText = '₹' + amountStr + '.00';
        if (this.upiAmountDisplay) this.upiAmountDisplay.innerText = '₹' + amountStr + '.00';

        if (this.paymentQr) {
            const upiStr = `upi://pay?pa=prathamsurve191-1@okicici&pn=S3+Fitness&am=${amountStr}.00&cu=INR`;
            this.paymentQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiStr)}`;
        }

        this.navigate('subscription-view');
    },

    viewProgramDetails(programName) {
        alert("Detailed routine for '" + programName + "' will be available soon! Ensure your membership is active to access premium routines.");
    },

    completePayment() {
        if (!this.mockUserState.id) {
            alert('Please login first to process payment.');
            this.navigate('login-view');
            return;
        }

        const plan = this.cartPlanName ? this.cartPlanName.innerText : 'PRO TIER';
        const amount = this.cartTotal ? this.cartTotal.innerText : '₹4,999.00';

        // Simulate network delay
        const btn = event.target.closest('button') || document.querySelector('#card-payment-form button');
        const originalText = btn.innerText;
        btn.innerText = 'Processing...';
        btn.disabled = true;

        setTimeout(() => {
            fetch(`http://localhost:8080/api/users/${this.mockUserState.id}/subscription`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: plan })
            }).then(res => res.json()).then(user => {
                this.updateUserStateFromDb(user);
                this.showSuccessMessage(plan, amount);
            }).catch(err => {
                console.error(err);
                // Fallback for local testing
                this.mockUserState.plan = plan;
                this.mockUserState.status = 'active';
                this.mockUserState.startDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const end = new Date();
                end.setMonth(end.getMonth() + (plan.includes('1 MONTH') ? 1 : plan.includes('3 MONTH') ? 3 : plan.includes('6 MONTH') ? 6 : 12));
                this.mockUserState.endDate = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                this.showSuccessMessage(plan, amount);
            }).finally(() => {
                btn.innerText = originalText;
                btn.disabled = false;
            });
        }, 1500);
    },

    completeUpiIdPayment() {
        if (!this.mockUserState.id) {
            alert('Please login first.');
            this.navigate('login-view');
            return;
        }

        const upiId = this.upiIdInput.value;
        if (!upiId || !upiId.includes('@')) {
            alert('Please enter a valid UPI ID');
            return;
        }

        const plan = this.cartPlanName ? this.cartPlanName.innerText : 'PRO TIER';
        const amount = this.cartTotal ? this.cartTotal.innerText : '₹4,999.00';

        // Simulate UPI Request
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = 'Sending Request...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerText = 'Waiting for mobile confirmation...';
            setTimeout(() => {
                // Assume user confirmed on mobile
                this.completePayment();
                btn.innerText = originalText;
                btn.disabled = false;
            }, 2500);
        }, 1500);
    },

    showSuccessMessage(plan, amount) {
        if (this.successPlanName) this.successPlanName.innerText = plan;
        if (this.detailPlan) this.detailPlan.innerText = plan;
        if (this.detailAmount) this.detailAmount.innerText = amount;
        if (this.detailStart) this.detailStart.innerText = this.mockUserState.startDate;
        if (this.detailEnd) this.detailEnd.innerText = this.mockUserState.endDate;
        if (this.transactionId) this.transactionId.innerText = '#S3FIT-' + Math.floor(Math.random() * 9000 + 1000) + '-TX' + Math.floor(Math.random() * 90 + 10);

        if (this.successOverlay) this.successOverlay.classList.remove('hidden');
    },

    closeSuccessOverlay() {
        if (this.successOverlay) this.successOverlay.classList.add('hidden');
        this.navigate('login-view');
        this.renderDashboard();
    },

    initScrollReveal() {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => observer.observe(el));
    },

    navigate(viewId) {
        // Hide all views
        this.views.forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Update nav active states
        this.navLinks.forEach(link => {
            if (link.getAttribute('data-target') === viewId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
