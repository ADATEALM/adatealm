import { db, auth, doc, setDoc, getDoc } from './utils.js';

// Inject CSS for the modal
const style = document.createElement('style');
style.textContent = `
    .payment-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
        z-index: 9999; display: flex; justify-content: center; align-items: center;
        opacity: 0; visibility: hidden; transition: 0.3s;
    }
    .payment-overlay.active { opacity: 1; visibility: visible; }
    
    .payment-card {
        background: white; width: 90%; max-width: 400px;
        border-radius: 20px; padding: 25px;
        transform: translateY(20px); transition: 0.3s;
        box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        text-align: center; position: relative;
    }
    .payment-overlay.active .payment-card { transform: translateY(0); }
    
    .card-header { margin-bottom: 20px; }
    .card-header h3 { font-size: 1.5rem; font-weight: 800; color: #111827; }
    .card-header .price { font-size: 2.5rem; font-weight: 900; color: #3b82f6; }
    .card-header .period { font-size: 0.9rem; color: #6b7280; }
    
    .method-selector { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; }
    .method-btn {
        border: 2px solid #e5e7eb; border-radius: 10px; padding: 10px 15px;
        cursor: pointer; transition: 0.2s; background: transparent;
    }
    .method-btn.selected { border-color: #3b82f6; background: #eff6ff; }
    .method-btn i { font-size: 1.5rem; color: #1f2937; }
    
    .input-group { margin-bottom: 15px; text-align: right; }
    .input-group label { display: block; font-size: 0.8rem; font-weight: bold; color: #374151; margin-bottom: 5px; }
    .input-group input { 
        width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;
        font-family: inherit; outline: none; transition: 0.2s;
    }
    .input-group input:focus { border-color: #3b82f6; ring: 2px solid #3b82f6; }
    
    .pay-btn {
        width: 100%; background: #3b82f6; color: white;
        padding: 14px; border: none; border-radius: 12px;
        font-size: 1.1rem; font-weight: bold; cursor: pointer;
        transition: 0.3s; display: flex; justify-content: center; align-items: center; gap: 10px;
    }
    .pay-btn:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }
    .pay-btn:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }
    
    .spinner {
        width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3);
        border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

// HTML Template
const modalHTML = `
<div class="payment-overlay" id="paymentOverlay">
    <div class="payment-card">
        <button onclick="closePaymentModal()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #9ca3af;"><i class="fa-solid fa-xmark"></i></button>
        
        <div class="card-header">
            <h3 id="planName">Pro Plan</h3>
            <div><span class="price" id="planPrice">1000</span> <span class="period">DZD/سنة</span></div>
        </div>
        
        <div class="method-selector">
            <button class="method-btn selected" onclick="selectMethod(this)"><i class="fa-brands fa-cc-visa"></i></button>
            <button class="method-btn" onclick="selectMethod(this)"><i class="fa-regular fa-credit-card"></i></button>
        </div>
        
        <form id="paymentForm" onsubmit="handlePayment(event)">
            <div class="input-group">
                <label>رقم البطاقة (للتجربة: أي رقم)</label>
                <input type="text" placeholder="0000 0000 0000 0000" required>
            </div>
            <div style="display: flex; gap: 10px;">
                <div class="input-group" style="flex: 1">
                    <label>MM/YY</label>
                    <input type="text" placeholder="12/26" required>
                </div>
                <div class="input-group" style="flex: 1">
                    <label>CVC</label>
                    <input type="text" placeholder="123" required>
                </div>
            </div>
            
            <button type="submit" class="pay-btn" id="payBtn">
                <span>تأكيد الدفع</span>
                <div class="spinner" style="display: none;"></div>
            </button>
        </form>
    </div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', modalHTML);

// Logic
window.closePaymentModal = () => {
    document.getElementById('paymentOverlay').classList.remove('active');
};

window.selectMethod = (btn) => {
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
};

window.openPaymentModal = (plan, price) => {
    document.getElementById('planName').innerText = plan;
    document.getElementById('planPrice').innerText = price;
    document.getElementById('paymentOverlay').classList.add('active');
};

window.handlePayment = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('payBtn');
    const spinner = btn.querySelector('.spinner');

    // Check auth
    const user = auth.currentUser;
    if (!user) {
        alert("يرجى تسجيل الدخول أولاً!");
        window.location.href = "login.html";
        return;
    }

    // UI Loading
    btn.disabled = true;
    spinner.style.display = 'block';

    try {
        // Find user name for messaging
        let userName = "المستخدم";
        try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) userName = snap.data().displayName;
        } catch (err) { }

        // Simulate Network Delay
        await new Promise(r => setTimeout(r, 2000));

        // Update Firestore
        await setDoc(doc(db, "users", user.uid), {
            subscription: {
                status: 'active',
                plan: document.getElementById('planName').innerText,
                startDate: new Date().toISOString(),
                price: document.getElementById('planPrice').innerText
            }
        }, { merge: true });

        // Success
        await Swal.fire({
            icon: 'success',
            title: 'تم الدفع بنجاح!',
            text: `تم تفعيل حسابك، استمتع بمزايا Pro يا ${userName}!`,
            confirmButtonText: 'الذهاب للوحة التحكم',
            confirmButtonColor: '#3b82f6'
        });

        window.location.href = "srs_pro.html";

    } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء الدفع. يرجى المحاولة مرة أخرى.");
        btn.disabled = false;
        spinner.style.display = 'none';
    }
};
