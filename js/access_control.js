import { auth, db, getDoc, doc, onAuthStateChanged } from './utils.js';

// Configuration: Mapping filenames to required codes
// If the URL contains "KEY", the user MUST have "VALUE" in their access_list.
const ACCESS_RULES = [
    { keyword: 'MED01', required: 'MED01' },
    { keyword: 'MED02', required: 'MED02' },
    { keyword: 'MED03', required: 'MED03' },
    { keyword: 'DENT01', required: 'DENT01' },
    { keyword: 'DENT02', required: 'DENT02' },
    { keyword: 'PHARM01', required: 'PHARM01' },
];

// List of pages that are ALWAYS allowed for everyone (whitelist)
const PUBLIC_PAGES = [
    'index.html',
    'login.html',
    'pricing.html',
    'contact.html',
    'dashboard.html', // The new hub
    'admin_dashboard.html',
    'srs_pro.html'
];

async function checkAccess(user) {
    const currentPath = window.location.pathname;
    const items = currentPath.split('/');
    const fileName = items[items.length - 1]; // e.g., "MED01.html"

    // 1. Skip checks for public pages
    if (PUBLIC_PAGES.some(page => fileName.includes(page))) return;

    // 2. Identify required specialization from filename
    const rule = ACCESS_RULES.find(r => fileName.toUpperCase().includes(r.keyword));

    if (!rule) {
        // No specific rule found -> Allow or generic content
        return;
    }

    console.log(`[Security] Checking access to ${fileName}. Required: ${rule.required}`);

    // 3. Fetch User Profile
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
            window.location.href = 'login.html';
            return;
        }

        const userData = userDoc.data();
        const accessList = userData.access_list || []; // Array of codes
        const isAdmin = userData.role === 'admin';

        if (isAdmin) return; // Admins can go anywhere

        // 4. Compare using Array
        if (!accessList.includes(rule.required)) {
            document.body.innerHTML = ''; // Hide content immediately

            await Swal.fire({
                icon: 'error',
                title: 'وصول غير مصرّح',
                text: `عذراً، هذا المحتوى مخصص لطلاب ${rule.required}. أنت لم تشترك في هذه السنة بعد.`,
                confirmButtonText: 'العودة لمساحتي',
                allowOutsideClick: false
            });

            // Redirect to the new dashboard where they can buy it
            window.location.href = 'dashboard.html';
        }

    } catch (e) {
        console.error("Access Check Failed:", e);
    }
}

// Init
onAuthStateChanged(auth, (user) => {
    if (user) {
        checkAccess(user);
    } else {
        const fileName = window.location.pathname.split('/').pop();
        // If restricted page and not logged in -> Login
        if (ACCESS_RULES.some(r => fileName.toUpperCase().includes(r.keyword))) {
            window.location.href = 'login.html';
        }
    }
});
