// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDX5cDeURV3svvdOpiMkbnmq_VQ3UZrHqk",
    authDomain: "imei-7c1cb.firebaseapp.com",
    projectId: "imei-7c1cb",
    storageBucket: "imei-7c1cb.firebasestorage.app",
    messagingSenderId: "910302998833",
    appId: "1:910302998833:web:2b6836250056d972d54010"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Scanner initialization
let selectedDeviceId;
const codeReader = new ZXing.BrowserMultiFormatReader();
let scannerInitialized = false;

// Get available video devices
async function getVideoDevices() {
    try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        return videoInputDevices;
    } catch (err) {
        console.error('Error listing video devices:', err);
        return [];
    }
}

// Initialize scanner
async function initScanner() {
    if (scannerInitialized) return;
    
    try {
        const devices = await getVideoDevices();
        if (devices.length === 0) {
            showToast('No camera found');
            return false;
        }
        
        // Try to find back camera
        selectedDeviceId = devices.find(d => d.label.toLowerCase().includes('back'))?.deviceId || devices[0].deviceId;
        
        // Setup device switching
        if (devices.length > 1) {
            document.getElementById('switchCamera').classList.remove('hidden');
            document.getElementById('switchCamera').onclick = () => {
                const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
                const nextIndex = (currentIndex + 1) % devices.length;
                selectedDeviceId = devices[nextIndex].deviceId;
                startScanner();
            };
        } else {
            document.getElementById('switchCamera').classList.add('hidden');
        }
        
        scannerInitialized = true;
        return true;
    } catch (err) {
        console.error('Error initializing scanner:', err);
        showToast('Failed to initialize camera');
        return false;
    }
}

// Start scanner
async function startScanner() {
    try {
        await codeReader.decodeFromVideoDevice(
            selectedDeviceId, 
            'interactive',
            (result, err) => {
                if (result) {
                    const imei = result.text.trim();
                    if (/^\d{15}$/.test(imei)) {
                        document.getElementById('imeiNumber').value = imei;
                        document.getElementById('scannerModal').classList.add('hidden');
                        showToast('IMEI scanned successfully');
                        stopScanner();
                    }
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('Scanner error:', err);
                }
            }
        );
    } catch (err) {
        console.error('Error starting scanner:', err);
        showToast('Failed to start camera');
    }
}

// Stop scanner
function stopScanner() {
    codeReader.reset();
    document.getElementById('scannerModal').classList.add('hidden');
}

// Scanner modal handlers (guard attachments)
const closeScannerBtn = document.getElementById('closeScannerModalBtn');
if (closeScannerBtn) closeScannerBtn.addEventListener('click', stopScanner);
const scannerOverlay = document.querySelector('#scannerModal .modal-overlay');
if (scannerOverlay) scannerOverlay.addEventListener('click', stopScanner);

// Torch control (use video element)
const toggleTorchBtn = document.getElementById('toggleTorch');
if (toggleTorchBtn) {
    toggleTorchBtn.addEventListener('click', async () => {
        try {
            const videoEl = document.getElementById('interactive');
            if (!videoEl || !videoEl.srcObject) return;
            const track = videoEl.srcObject.getVideoTracks()[0];
            if (!track) return;
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities && capabilities.torch) {
                const settings = track.getSettings ? track.getSettings() : {};
                const torchOn = !!settings.torch;
                await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
                toggleTorchBtn.querySelector('.material-icons').textContent = !torchOn ? 'flashlight_off' : 'flashlight_on';
            } else {
                toggleTorchBtn.classList.add('hidden');
            }
        } catch (err) {
            console.error('Error toggling torch:', err);
        }
    });
}

// Enable offline persistence (syncs automatically when back online)
firebase.firestore().enablePersistence({ synchronizeTabs: true }).then(() => {
    console.log('Firestore persistence enabled');
}).catch((err) => {
    // Multiple tabs open or browser not supported
    if (err.code === 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open. Persistence disabled.');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistence is not available in this browser.');
    } else {
        console.warn('Persistence error:', err);
    }
});

// DOM Elements - Auth
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userName = document.getElementById('userName');
const userPhoto = document.getElementById('userPhoto');

// Modals
const brandModal = document.getElementById('brandModal');
const modelModal = document.getElementById('modelModal');
const phoneModal = document.getElementById('phoneModal');
const confirmModal = document.getElementById('confirmModal');

// Buttons
const toggleViewBtn = document.getElementById('toggleViewBtn');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreFileInput = document.getElementById('restoreFileInput');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const addBrandBtn = document.getElementById('addBrandBtn');
const addPhoneBtn = document.getElementById('addPhoneBtn');
const addNewModelBtn = document.getElementById('addNewModelBtn');
const cancelNewModelBtn = document.getElementById('cancelNewModelBtn');

// Forms
const brandForm = document.getElementById('brandForm');
const modelForm = document.getElementById('modelForm');
const phoneForm = document.getElementById('phoneForm');

// Containers
const brandsContainer = document.getElementById('brandsContainer');
const listViewContainer = document.getElementById('listViewContainer');
const listViewBody = document.getElementById('listViewBody');
const emptyState = document.getElementById('emptyState');

// Search
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

// Stats
const totalStock = document.getElementById('totalStock');
const soldCount = document.getElementById('soldCount');
const availableStock = document.getElementById('availableStock');
const newStock = document.getElementById('newStock');
const secondStock = document.getElementById('secondStock');

// State
let currentUser = null;
let brands = [];
let models = [];
let phones = [];
let editingBrandId = null;
let editingModelId = null;
let editingPhoneId = null;
let confirmCallback = null;
let expandedBrands = new Set();
let activeFilter = 'all'; // all, sold, available, new, second
let isListView = false;

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        userName.textContent = user.displayName;
        userPhoto.src = user.photoURL;
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        initializeDefaultBrands();
        loadAllData();
        console.log('Auth: user signed in', user.uid, user.email);
    } else {
        currentUser = null;
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
        console.log('Auth: no user');
    }
});

// Initialize Default Brands
async function initializeDefaultBrands() {
    const defaultBrands = ['iPhone', 'Huawei/Honor', 'Oppo', 'Vivo', 'Redmi', 'Tecno'];
    
    const snapshot = await db.collection('brands')
        .where('userId', '==', currentUser.uid)
        .get();
    
    if (snapshot.empty) {
        showLoading();
        for (let i = 0; i < defaultBrands.length; i++) {
            await db.collection('brands').add({
                name: defaultBrands[i],
                userId: currentUser.uid,
                order: i,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        hideLoading();
    }
}

// Google Sign In
googleSignInBtn.addEventListener('click', async () => {
    try {
        showLoading();
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        showToast('Signed in successfully!');
    } catch (error) {
        console.error('Sign in error:', error);
        // Surface a more descriptive message to the user to aid debugging
        const message = (error && error.message) ? `${error.code || 'auth/error'}: ${error.message}` : 'Failed to sign in. Please try again.';
        showToast(message);
        // For critical auth problems, log instruction hint
        if (error && error.code === 'auth/unauthorized-domain') {
            console.warn('Unauthorized domain. Ensure your app domain is added to Firebase Console -> Authentication -> Authorized domains.');
        }
    } finally {
        hideLoading();
    }
});

// Sign Out
signOutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        showToast('Signed out successfully!');
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Failed to sign out.');
    }
});

// Export to Excel
exportExcelBtn.addEventListener('click', () => {
    if (phones.length === 0) {
        showToast('No data to export');
        return;
    }
    
    try {
        showLoading();
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Add summary sheet first
        const summaryData = [];
        summaryData.push(['PHONE IMEI INVENTORY - STOCK REPORT']);
        summaryData.push(['Generated: ' + new Date().toLocaleString()]);
        summaryData.push(['']);
        summaryData.push(['OVERALL SUMMARY']);
    const visiblePhones = getVisiblePhones();
    summaryData.push(['Total Inventory', visiblePhones.length]);
    summaryData.push(['Available Stock', visiblePhones.filter(p => !p.isSold).length]);
    summaryData.push(['Sold Units', visiblePhones.filter(p => p.isSold).length]);
        summaryData.push(['']);
        summaryData.push(['BREAKDOWN BY BRAND']);
        summaryData.push(['Brand', 'Total Units', 'Available', 'Sold', '% Sold']);
        
        brands.forEach(brand => {
            const brandPhones = getVisiblePhones().filter(p => p.brandId === brand.id);
            const available = brandPhones.filter(p => !p.isSold).length;
            const sold = brandPhones.filter(p => p.isSold).length;
            const soldPercent = brandPhones.length > 0 ? ((sold / brandPhones.length) * 100).toFixed(1) + '%' : '0%';
            summaryData.push([brand.name, brandPhones.length, available, sold, soldPercent]);
        });
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWs['!cols'] = [
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
        // Create a separate sheet for each brand
        brands.forEach(brand => {
            const brandModels = models.filter(m => m.brandId === brand.id);
            const brandPhones = getVisiblePhones().filter(p => p.brandId === brand.id);
            
            if (brandPhones.length === 0) return; // Skip brands with no phones
            
            const brandData = [];
            
            // Brand header
            brandData.push([brand.name.toUpperCase() + ' - INVENTORY']);
            brandData.push(['']);
            brandData.push(['Summary:', 'Total: ' + brandPhones.length, 'Available: ' + brandPhones.filter(p => !p.isSold).length, 'Sold: ' + brandPhones.filter(p => p.isSold).length]);
            brandData.push(['']);
            
            // Table for each model
            brandModels.forEach(model => {
                const modelPhones = phones.filter(p => p.modelId === model.id);
                
                if (modelPhones.length === 0) return;
                
                // Model header
                brandData.push(['MODEL: ' + model.name]);
                brandData.push(['IMEI Number', 'Condition', 'Status', 'Date Added', 'Date Sold']);
                
                // Model data
                modelPhones.forEach(phone => {
                    brandData.push([
                        phone.imeiNumber,
                        phone.condition === 'new' ? 'New' : 'Second Hand',
                        phone.isSold ? 'Sold' : 'Available',
                        phone.createdAt ? formatDateForExcel(phone.createdAt) : 'N/A',
                        phone.soldAt ? formatDateForExcel(phone.soldAt) : ''
                    ]);
                });
                
                // Subtotal
                const modelAvailable = modelPhones.filter(p => !p.isSold).length;
                const modelSold = modelPhones.filter(p => p.isSold).length;
                brandData.push(['Subtotal:', modelPhones.length + ' units', 'Available: ' + modelAvailable, 'Sold: ' + modelSold]);
                brandData.push(['']);
            });
            
            // Create worksheet for this brand
            const brandWs = XLSX.utils.aoa_to_sheet(brandData);
            brandWs['!cols'] = [
                { wch: 20 }, // IMEI
                { wch: 15 }, // Condition
                { wch: 12 }, // Status
                { wch: 20 }, // Date Added
                { wch: 20 }  // Date Sold
            ];
            
            // Sanitize sheet name (Excel limits)
            let sheetName = brand.name.substring(0, 31).replace(/[:\\/?*\[\]]/g, '');
            XLSX.utils.book_append_sheet(wb, brandWs, sheetName);
        });
        
        // Generate filename with current date
        const now = new Date();
        const filename = `Phone_Inventory_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
        
        // Download file
        XLSX.writeFile(wb, filename);
        
        showToast('Excel file exported successfully!');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showToast('Failed to export Excel file');
    } finally {
        hideLoading();
    }
});

function formatDateForExcel(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Return phones that are not soft-deleted
function getVisiblePhones() {
    return phones.filter(p => !p.deleted);
}

// -------------------- Backup & Restore --------------------
backupBtn.addEventListener('click', async () => {
    try {
        showLoading();
        const payload = {
            meta: {
                exportedAt: new Date().toISOString(),
                version: 1,
            },
            brands,
            models,
            phones,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imei_backup_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Backup downloaded');
    } catch (e) {
        console.error(e);
        showToast('Failed to create backup');
    } finally {
        hideLoading();
    }
});

restoreBtn.addEventListener('click', () => {
    restoreFileInput.click();
});

restoreFileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const text = await file.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        showToast('Invalid JSON file');
        return;
    }

    showConfirmDialog('Restore Backup', 'This will import brands, models and phones. Continue?', async () => {
        try {
            showLoading();
            // Use a batch to commit all writes atomically
            const batch = db.batch();

            // Maps to preserve links; attempt to reuse original IDs when possible
            const oldBrandIdToNew = {};
            const oldModelIdToNew = {};

            // Load existing brands and models to avoid duplicates by name
            const existingBrandsSnap = await db.collection('brands').where('userId', '==', currentUser.uid).get();
            const existingBrands = existingBrandsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Import brands
            for (const b of (data.brands || [])) {
                // Try to find an existing brand with same name
                const existing = existingBrands.find(x => x.name === b.name);
                if (existing) {
                    oldBrandIdToNew[b.id] = existing.id;
                    continue;
                }

                // Preserve original id if not in use
                let ref = db.collection('brands').doc(b.id);
                const docSnapshot = await ref.get();
                if (docSnapshot.exists) {
                    // fallback to adding a new doc
                    ref = db.collection('brands').doc();
                }
                batch.set(ref, {
                    name: b.name,
                    userId: currentUser.uid,
                    order: typeof b.order === 'number' ? b.order : 999,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                oldBrandIdToNew[b.id] = ref.id;
            }

            // Load existing models
            const existingModelsSnap = await db.collection('models').where('userId', '==', currentUser.uid).get();
            const existingModels = existingModelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Import models
            for (const m of (data.models || [])) {
                const brandId = oldBrandIdToNew[m.brandId] || m.brandId;
                const existing = existingModels.find(x => x.name === m.name && x.brandId === brandId);
                if (existing) {
                    oldModelIdToNew[m.id] = existing.id;
                    continue;
                }

                let ref = db.collection('models').doc(m.id);
                const docSnapshot = await ref.get();
                if (docSnapshot.exists) {
                    ref = db.collection('models').doc();
                }
                batch.set(ref, {
                    name: m.name,
                    brandId: brandId,
                    userId: currentUser.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                oldModelIdToNew[m.id] = ref.id;
            }

            // Import phones (deduplicate by IMEI)
            // First build a set of existing IMEIs for the user
            const existingPhonesSnap = await db.collection('phones').where('userId', '==', currentUser.uid).get();
            const existingImeis = new Set(existingPhonesSnap.docs.map(d => d.data().imeiNumber));

            for (const p of (data.phones || [])) {
                const imei = p.imeiNumber || p.imei;
                if (!imei) continue;
                if (existingImeis.has(imei)) continue; // skip duplicates

                // Build phone doc preserving ID if possible
                let ref = db.collection('phones').doc(p.id);
                const docSnapshot = await ref.get();
                if (docSnapshot.exists) {
                    ref = db.collection('phones').doc();
                }

                batch.set(ref, {
                    brandId: oldBrandIdToNew[p.brandId] || p.brandId,
                    modelId: oldModelIdToNew[p.modelId] || p.modelId,
                    condition: p.condition === 'second' ? 'second' : 'new',
                    imeiNumber: imei,
                    userId: currentUser.uid,
                    isSold: !!p.isSold || p.status === 'sold',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    soldAt: p.isSold || p.status === 'sold' ? firebase.firestore.FieldValue.serverTimestamp() : null
                });
                existingImeis.add(imei);
            }

            // Commit the batch
            await batch.commit();
            showToast('Restore completed');
        } catch (err) {
            console.error(err);
            showToast('Restore failed');
        } finally {
            hideLoading();
            restoreFileInput.value = '';
        }
    });
});

// Load All Data
function loadAllData() {
    showLoading();
    
    // Listen to brands
    db.collection('brands')
        .where('userId', '==', currentUser.uid)
        .orderBy('order')
        .onSnapshot((snapshot) => {
            brands = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            loadModels();
        });
}

function loadModels() {
    db.collection('models')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            models = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            loadPhones();
        });
}

function loadPhones() {
    db.collection('phones')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            phones = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            renderBrands();
            updateStats();
            hideLoading();
        });
}

// Render Brands
function renderBrands(searchTerm = '') {
    if (isListView) {
        renderListView(searchTerm);
        return;
    }
    
    brandsContainer.innerHTML = '';
    
    let filteredData = filterData(searchTerm);
    
    // Apply active filter
    filteredData.phones = applyActiveFilter(filteredData.phones);
    
    if (brands.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    brands.forEach(brand => {
        const brandModels = filteredData.models.filter(m => m.brandId === brand.id);
        const brandPhones = filteredData.phones.filter(p => p.brandId === brand.id);
        
        if (searchTerm && brandModels.length === 0 && brandPhones.length === 0) {
            if (!brand.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return;
            }
        }
        
    const availablePhones = brandPhones.filter(p => !p.isSold).length;
    const soldPhones = brandPhones.filter(p => p.isSold).length;
        const isExpanded = expandedBrands.has(brand.id);
        
        const brandSection = document.createElement('div');
        brandSection.className = 'brand-section';
        brandSection.innerHTML = `
            <div class="brand-header" onclick="toggleBrand('${brand.id}')">
                <div class="brand-title">
                    <h2>${escapeHtml(brand.name)}</h2>
                </div>
                <div class="brand-stats">
                    <span class="brand-stat" style="background: #E8F5E9; color: #2E7D32;">
                        Available: ${availablePhones}
                    </span>
                    <span class="brand-stat" style="background: #FFE0B2; color: #E65100;">
                        Sold: ${soldPhones}
                    </span>
                </div>
                <div class="brand-actions" onclick="event.stopPropagation()">
                    <button onclick="editBrand('${brand.id}')" title="Edit">Edit</button>
                    <button onclick="deleteBrand('${brand.id}')" title="Delete" class="btn-delete-text">Delete</button>
                </div>
                <span class="material-icons brand-expand ${isExpanded ? 'expanded' : ''}">expand_more</span>
            </div>
            <div class="models-container ${isExpanded ? 'expanded' : ''}" id="models-${brand.id}">
                ${renderModels(brand.id, brandModels, searchTerm)}
            </div>
        `;
        
        brandsContainer.appendChild(brandSection);
    });
}

// Render Models
function renderModels(brandId, brandModels, searchTerm = '') {
    if (brandModels.length === 0) {
        return '<div style="padding: 20px; text-align: center; color: #757575;">No models yet. Add a model to get started.</div>';
    }
    
    let html = '';
    brandModels.forEach(model => {
    const modelPhones = getVisiblePhones().filter(p => p.modelId === model.id);
        const filteredPhones = searchTerm 
            ? modelPhones.filter(p => p.imeiNumber.includes(searchTerm))
            : modelPhones;
        
        if (searchTerm && filteredPhones.length === 0 && !model.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return;
        }
        
        const availableCount = modelPhones.filter(p => !p.isSold).length;
        const soldCountModel = modelPhones.filter(p => p.isSold).length;
        
        html += `
            <div class="model-group">
                <div class="model-header">
                    <div class="model-title">
                        <span class="material-icons">smartphone</span>
                        <h3>${escapeHtml(model.name)}</h3>
                        <span class="model-count">${availableCount} / ${modelPhones.length}</span>
                    </div>
                    <div class="model-actions">
                        <button onclick="editModel('${model.id}')" title="Edit Model">
                            <span class="material-icons">edit</span>
                        </button>
                        <button onclick="deleteModel('${model.id}')" title="Delete Model">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
                <div class="phone-list">
                    ${renderPhones(model.id, filteredPhones)}
                </div>
            </div>
        `;
    });
    
    return html;
}

// Render Phones
function renderPhones(modelId, modelPhones) {
    if (modelPhones.length === 0) {
        return '<div style="padding: 12px; text-align: center; color: #999; font-size: 14px;">No IMEI numbers added</div>';
    }
    
    let html = '';
    modelPhones.forEach(phone => {
        html += `
            <div class="phone-item ${phone.isSold ? 'sold' : ''}">
                <div class="phone-info">
                    <div class="phone-icon">
                        <span class="material-icons">phone_android</span>
                    </div>
                    <div class="phone-details">
                        <h3>IMEI: ${escapeHtml(phone.imeiNumber)} <button class="btn-icon" title="Copy IMEI" onclick="copyImei('${phone.imeiNumber}')"><span class="material-icons">content_copy</span></button></h3>
                        <p>${phone.condition === 'new' ? '🆕 New Phone' : '🔄 Second Hand'} • Added: ${formatDate(phone.createdAt)}</p>
                    </div>
                </div>
                <div class="phone-status">
                    <span class="status-badge ${phone.isSold ? 'sold' : 'available'}">
                        ${phone.isSold ? 'Sold' : 'Available'}
                    </span>
                </div>
                <div class="phone-actions">
                    ${!phone.isSold ? `
                        <button onclick="markAsSold('${phone.id}')" class="btn-action btn-sold">Mark Sold</button>
                        <button onclick="editPhone('${phone.id}')" class="btn-action btn-edit">Edit</button>
                    ` : `
                        <button onclick="markAsAvailable('${phone.id}')" class="btn-action btn-undo">Undo (Available)</button>
                    `}
                    <button onclick="deletePhone('${phone.id}')" class="btn-action btn-delete">Delete</button>
                </div>
            </div>
        `;
    });
    
    return html;
}

// Toggle Brand Expand/Collapse
window.toggleBrand = function(brandId) {
    if (expandedBrands.has(brandId)) {
        expandedBrands.delete(brandId);
    } else {
        expandedBrands.add(brandId);
    }
    renderBrands(searchInput.value.trim());
};

// Brand Operations
addBrandBtn.addEventListener('click', () => {
    editingBrandId = null;
    document.getElementById('brandModalTitle').textContent = 'Add Brand';
    document.getElementById('brandName').value = '';
    brandModal.classList.remove('hidden');
});

brandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const brandName = document.getElementById('brandName').value.trim();
    
    try {
        showLoading();
        if (editingBrandId) {
            await db.collection('brands').doc(editingBrandId).update({
                name: brandName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Brand updated successfully!');
        } else {
            await db.collection('brands').add({
                name: brandName,
                userId: currentUser.uid,
                order: brands.length,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Brand added successfully!');
        }
        brandModal.classList.add('hidden');
    } catch (error) {
        console.error('Error saving brand:', error);
        showToast('Failed to save brand.');
    } finally {
        hideLoading();
    }
});

window.editBrand = function(brandId) {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    
    editingBrandId = brandId;
    document.getElementById('brandModalTitle').textContent = 'Edit Brand';
    document.getElementById('brandName').value = brand.name;
    brandModal.classList.remove('hidden');
};

window.deleteBrand = function(brandId) {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;
    
    const brandModels = models.filter(m => m.brandId === brandId);
    const brandPhones = phones.filter(p => p.brandId === brandId);
    
    if (brandModels.length > 0 || brandPhones.length > 0) {
        showToast('Cannot delete brand with existing models or phones. Delete them first.');
        return;
    }
    
    showConfirmDialog(
        'Delete Brand',
        `Are you sure you want to delete "${brand.name}"?`,
        async () => {
            try {
                showLoading();
                await db.collection('brands').doc(brandId).delete();
                showToast('Brand deleted successfully!');
            } catch (error) {
                console.error('Error deleting brand:', error);
                showToast('Failed to delete brand.');
            } finally {
                hideLoading();
            }
        }
    );
};

// New Model Section in Phone Modal
addNewModelBtn.addEventListener('click', () => {
    document.getElementById('newModelSection').classList.remove('hidden');
    document.getElementById('phoneModel').disabled = true;
    addNewModelBtn.disabled = true;
    document.getElementById('newModelName').focus();
});

cancelNewModelBtn.addEventListener('click', () => {
    document.getElementById('newModelSection').classList.add('hidden');
    document.getElementById('newModelName').value = '';
    const brandId = document.getElementById('phoneBrand').value;
    if (brandId) {
        document.getElementById('phoneModel').disabled = false;
    }
    addNewModelBtn.disabled = false;
});

modelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const brandId = document.getElementById('modelBrand').value;
    const modelName = document.getElementById('modelName').value.trim();
    
    try {
        showLoading();
        if (editingModelId) {
            await db.collection('models').doc(editingModelId).update({
                name: modelName,
                brandId: brandId,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Model updated successfully!');
        } else {
            await db.collection('models').add({
                name: modelName,
                brandId: brandId,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Model added successfully!');
        }
        modelModal.classList.add('hidden');
    } catch (error) {
        console.error('Error saving model:', error);
        showToast('Failed to save model.');
    } finally {
        hideLoading();
    }
});

window.editModel = function(modelId) {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    
    editingModelId = modelId;
    document.getElementById('modelModalTitle').textContent = 'Edit Model';
    populateBrandSelect('modelBrand', model.brandId);
    document.getElementById('modelName').value = model.name;
    modelModal.classList.remove('hidden');
};

window.deleteModel = function(modelId) {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    
    const modelPhones = phones.filter(p => p.modelId === modelId);
    if (modelPhones.length > 0) {
        showToast('Cannot delete model with existing IMEI numbers. Delete them first.');
        return;
    }
    
    showConfirmDialog(
        'Delete Model',
        `Are you sure you want to delete "${model.name}"?`,
        async () => {
            try {
                showLoading();
                await db.collection('models').doc(modelId).delete();
                showToast('Model deleted successfully!');
            } catch (error) {
                console.error('Error deleting model:', error);
                showToast('Failed to delete model.');
            } finally {
                hideLoading();
            }
        }
    );
};

// Phone Operations
addPhoneBtn.addEventListener('click', () => {
    editingPhoneId = null;
    document.getElementById('phoneModalTitle').textContent = 'Add IMEI';
    document.getElementById('phoneCondition').value = 'new';
    document.getElementById('imeiNumber').value = '';
    populateBrandSelect('phoneBrand');
    document.getElementById('phoneModel').innerHTML = '<option value="">Choose a brand first...</option>';
    document.getElementById('phoneModel').disabled = true;
    addNewModelBtn.disabled = true;
    document.getElementById('newModelSection').classList.add('hidden');
    document.getElementById('newModelName').value = '';
    phoneModal.classList.remove('hidden');
});

document.getElementById('phoneBrand').addEventListener('change', (e) => {
    const brandId = e.target.value;
    populateModelSelect(brandId);
    
    // Enable "New Model" button when brand is selected
    if (brandId) {
        addNewModelBtn.disabled = false;
    } else {
        addNewModelBtn.disabled = true;
    }
    
    // Hide new model section if visible
    document.getElementById('newModelSection').classList.add('hidden');
    document.getElementById('newModelName').value = '';
});

phoneForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const brandId = document.getElementById('phoneBrand').value;
    let modelId = document.getElementById('phoneModel').value;
    const phoneCondition = document.getElementById('phoneCondition').value;
    const imeiNumber = document.getElementById('imeiNumber').value.trim();
    const newModelName = document.getElementById('newModelName').value.trim();
    
    if (!/^\d{15}$/.test(imeiNumber)) {
        showToast('IMEI must be exactly 15 digits');
        return;
    }
    
    try {
        showLoading();
        
        // Create new model if in new model mode
        if (!document.getElementById('newModelSection').classList.contains('hidden')) {
            if (!newModelName) {
                showToast('Please enter model name');
                hideLoading();
                return;
            }
            
            const newModelRef = await db.collection('models').add({
                name: newModelName,
                brandId: brandId,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            modelId = newModelRef.id;
        }
        
        if (editingPhoneId) {
            // Prevent duplicate IMEI when editing: ensure no other document has same IMEI
            const dupSnapshot = await db.collection('phones')
                .where('userId', '==', currentUser.uid)
                .where('imeiNumber', '==', imeiNumber)
                .get();
            if (!dupSnapshot.empty) {
                const duplicate = dupSnapshot.docs.find(d => d.id !== editingPhoneId);
                if (duplicate) {
                    showToast('Another phone with this IMEI already exists!');
                    hideLoading();
                    return;
                }
            }

            await db.collection('phones').doc(editingPhoneId).update({
                brandId: brandId,
                modelId: modelId,
                condition: phoneCondition,
                imeiNumber: imeiNumber,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('IMEI updated successfully!');
        } else {
            // Check if IMEI exists
            const snapshot = await db.collection('phones')
                .where('userId', '==', currentUser.uid)
                .where('imeiNumber', '==', imeiNumber)
                .get();
            
            if (!snapshot.empty) {
                showToast('This IMEI number already exists!');
                hideLoading();
                return;
            }
            
            const phoneData = {
                brandId: brandId,
                modelId: modelId,
                condition: phoneCondition,
                imeiNumber: imeiNumber,
                userId: currentUser.uid,
                isSold: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (navigator.onLine) {
                await db.collection('phones').add(phoneData);
                showToast('IMEI added successfully!');
            } else {
                // offline: add to pending writes with a temporary id
                const tempId = 'temp-' + Date.now();
                const clone = Object.assign({}, phoneData);
                clone._tempId = tempId;
                phones.unshift({ id: tempId, ...clone });
                addPendingWrite({ type: 'addPhone', data: clone });
                showToast('Added locally. Will sync when online.');
            }
        }
        phoneModal.classList.add('hidden');
        // Reset new model section
        document.getElementById('newModelSection').classList.add('hidden');
        document.getElementById('newModelName').value = '';
    } catch (error) {
        console.error('Error saving phone:', error);
        showToast('Failed to save IMEI.');
    } finally {
        hideLoading();
    }
});

window.editPhone = function(phoneId) {
    const phone = phones.find(p => p.id === phoneId);
    if (!phone) return;
    
    editingPhoneId = phoneId;
    document.getElementById('phoneModalTitle').textContent = 'Edit IMEI';
    populateBrandSelect('phoneBrand', phone.brandId);
    populateModelSelect(phone.brandId, phone.modelId);
    document.getElementById('phoneCondition').value = phone.condition || 'new';
    document.getElementById('imeiNumber').value = phone.imeiNumber;
    phoneModal.classList.remove('hidden');
};

window.markAsSold = function(phoneId) {
    const phone = phones.find(p => p.id === phoneId);
    if (!phone) return;
    
    showConfirmDialog(
        'Mark as Sold',
        `Are you sure you want to mark IMEI "${phone.imeiNumber}" as sold?`,
        async () => {
            try {
                showLoading();
                await db.collection('phones').doc(phoneId).update({
                    isSold: true,
                    soldAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast('Marked as sold!');
            } catch (error) {
                console.error('Error marking as sold:', error);
                showToast('Failed to mark as sold.');
            } finally {
                hideLoading();
            }
        }
    );
};

window.markAsAvailable = function(phoneId) {
    const phone = phones.find(p => p.id === phoneId);
    if (!phone) return;
    
    showConfirmDialog(
        'Mark as Available',
        `Are you sure you want to mark IMEI "${phone.imeiNumber}" back as available?`,
        async () => {
            try {
                showLoading();
                await db.collection('phones').doc(phoneId).update({
                    isSold: false,
                    soldAt: null,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast('Marked as available!');
            } catch (error) {
                console.error('Error marking as available:', error);
                showToast('Failed to mark as available.');
            } finally {
                hideLoading();
            }
        }
    );
};

window.deletePhone = function(phoneId) {
    const phone = phones.find(p => p.id === phoneId);
    if (!phone) return;

    showConfirmDialog(
        'Delete IMEI',
        `Are you sure you want to delete IMEI "${phone.imeiNumber}"? (You can restore from Trash)`,
        async () => {
            try {
                showLoading();
                // Soft-delete: mark as deleted rather than remove
                    if (navigator.onLine) {
                        await db.collection('phones').doc(phoneId).update({
                            deleted: true,
                            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            deletedBy: currentUser.uid
                        });
                    } else {
                        // queue soft-delete
                        addPendingWrite({ type: 'softDeletePhone', id: phoneId, userId: currentUser.uid });
                    }
                    // Optimistically update local state so UI updates immediately
                    const idx = phones.findIndex(p => p.id === phoneId);
                    if (idx !== -1) {
                        phones[idx].deleted = true;
                        phones[idx].deletedAt = { toDate: () => new Date() };
                        phones[idx].deletedBy = currentUser.uid;
                    }
                renderBrands(searchInput.value.trim());
                renderTrash();
                updateStats();
                showToast('Moved to Trash');
            } catch (error) {
                console.error('Error deleting phone:', error);
                showToast('Failed to delete IMEI.');
            } finally {
                hideLoading();
            }
        }
    );
};

// Trash modal handlers
const trashBtn = document.getElementById('trashBtn');
const trashModal = document.getElementById('trashModal');
const trashList = document.getElementById('trashList');
const closeTrashModalBtn = document.getElementById('closeTrashModalBtn');
const closeTrashBtn = document.getElementById('closeTrashBtn');
const emptyTrashBtn = document.getElementById('emptyTrashBtn');

trashBtn.addEventListener('click', () => {
    renderTrash();
    trashModal.classList.remove('hidden');
});

closeTrashModalBtn.addEventListener('click', () => trashModal.classList.add('hidden'));
closeTrashBtn.addEventListener('click', () => trashModal.classList.add('hidden'));

emptyTrashBtn.addEventListener('click', () => {
    showConfirmDialog('Empty Trash', 'Permanently delete all items in Trash? This cannot be undone.', async () => {
        try {
            showLoading();
            const deletedPhones = phones.filter(p => p.deleted && p.userId === currentUser.uid);
            const batch = db.batch();
            deletedPhones.forEach(p => {
                const ref = db.collection('phones').doc(p.id);
                batch.delete(ref);
            });
            await batch.commit();
                // Remove deleted phones from local state and re-render
                const deletedIds = new Set(deletedPhones.map(p => p.id));
                phones = phones.filter(p => !deletedIds.has(p.id));
                showToast('Trash emptied');
                trashModal.classList.add('hidden');
                renderBrands(searchInput.value.trim());
                updateStats();
        } catch (err) {
            console.error('Error emptying trash:', err);
            showToast('Failed to empty trash');
        } finally {
            hideLoading();
        }
    });
});

function renderTrash() {
    trashList.innerHTML = '';
    const deletedPhones = phones.filter(p => p.deleted && p.userId === currentUser.uid);
    if (deletedPhones.length === 0) {
        trashList.innerHTML = '<div style="padding: 12px; color: #666;">Trash is empty.</div>';
        return;
    }

    deletedPhones.forEach(p => {
        const item = document.createElement('div');
        item.className = 'phone-item';
        item.style.marginBottom = '8px';
        item.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                <div style="flex:1">
                    <div style="font-weight:600">IMEI: ${escapeHtml(p.imeiNumber)}</div>
                    <div style="color:#666; font-size:13px">${escapeHtml(p.condition)} • Deleted: ${formatDate(p.deletedAt)}</div>
                </div>
                <div style="display:flex; gap:8px">
                    <button class="btn-secondary" data-action="restore" data-id="${p.id}">Restore</button>
                    <button class="btn-danger" data-action="permadelete" data-id="${p.id}">Delete Permanently</button>
                </div>
            </div>
        `;
        trashList.appendChild(item);
    });

    // Attach handlers
    trashList.querySelectorAll('button[data-action="restore"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            try {
                showLoading();
                await db.collection('phones').doc(id).update({
                    deleted: false,
                    deletedAt: null,
                    deletedBy: null,
                    restoredAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                // Update local state optimistically
                const idx = phones.findIndex(p => p.id === id);
                if (idx !== -1) {
                    phones[idx].deleted = false;
                    phones[idx].deletedAt = null;
                    phones[idx].deletedBy = null;
                    phones[idx].restoredAt = { toDate: () => new Date() };
                }
                showToast('Phone restored');
                renderTrash();
                renderBrands(searchInput.value.trim());
                updateStats();
            } catch (err) {
                console.error('Error restoring phone:', err);
                showToast('Failed to restore');
            } finally {
                hideLoading();
            }
        });
    });

    trashList.querySelectorAll('button[data-action="permadelete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            showConfirmDialog('Delete Permanently', 'This will permanently delete the record. Continue?', async () => {
                try {
                    showLoading();
                    if (navigator.onLine) {
                        await db.collection('phones').doc(id).delete();
                    } else {
                        addPendingWrite({ type: 'permanentDelete', id });
                    }
                    // Remove from local state
                    phones = phones.filter(p => p.id !== id);
                    showToast('Record permanently deleted');
                    renderTrash();
                    renderBrands(searchInput.value.trim());
                    updateStats();
                } catch (err) {
                    console.error('Error permanently deleting:', err);
                    showToast('Failed to delete');
                } finally {
                    hideLoading();
                }
            });
        });
    });
}

// Helper Functions
function populateBrandSelect(selectId, selectedId = '') {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Choose a brand...</option>';
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name;
        if (brand.id === selectedId) option.selected = true;
        select.appendChild(option);
    });
}

function populateModelSelect(brandId, selectedId = '') {
    const select = document.getElementById('phoneModel');
    const brandModels = models.filter(m => m.brandId === brandId);
    
    select.innerHTML = '<option value="">Choose a model...</option>';
    
    if (brandModels.length === 0) {
        select.innerHTML = '<option value="">No models for this brand</option>';
        select.disabled = true;
        return;
    }
    
    select.disabled = false;
    brandModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        if (model.id === selectedId) option.selected = true;
        select.appendChild(option);
    });
}

function filterData(searchTerm) {
    if (!searchTerm) {
        return { models, phones };
    }
    
    const term = searchTerm.toLowerCase();
    
    const filteredModels = models.filter(m => 
        m.name.toLowerCase().includes(term) ||
        brands.find(b => b.id === m.brandId)?.name.toLowerCase().includes(term)
    );
    
    const filteredPhones = phones.filter(p => 
        p.imeiNumber.includes(searchTerm) ||
        models.find(m => m.id === p.modelId)?.name.toLowerCase().includes(term) ||
        brands.find(b => b.id === p.brandId)?.name.toLowerCase().includes(term)
    );
    
    return { models: filteredModels, phones: filteredPhones };
}

function applyActiveFilter(phonesList) {
    switch(activeFilter) {
        case 'sold':
            return phonesList.filter(p => p.isSold === true);
        case 'available':
            return phonesList.filter(p => p.isSold === false);
        case 'new':
            return phonesList.filter(p => p.condition === 'new');
        case 'second':
            return phonesList.filter(p => p.condition === 'second');
        case 'all':
        default:
            return phonesList;
    }
}

// Render List View
function renderListView(searchTerm = '') {
    listViewBody.innerHTML = '';
    
    // filter only visible phones
    let visible = getVisiblePhones();
    // apply search/filter on visible phones
    let filteredData = filterData(searchTerm);
    filteredData.phones = applyActiveFilter(filteredData.phones.filter(p => visible.find(v => v.id === p.id)));
    
    if (filteredData.phones.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    filteredData.phones.forEach(phone => {
        const brand = brands.find(b => b.id === phone.brandId);
        const model = models.find(m => m.id === phone.modelId);
        
        const row = document.createElement('tr');
        row.className = phone.isSold ? 'sold' : '';
        row.innerHTML = `
            <td>${brand ? escapeHtml(brand.name) : 'N/A'}</td>
            <td>${model ? escapeHtml(model.name) : 'N/A'}</td>
            <td style="font-family: 'Courier New', monospace;">${escapeHtml(phone.imeiNumber)} <button class="btn-icon" title="Copy IMEI" onclick="copyImei('${phone.imeiNumber}')"><span class="material-icons">content_copy</span></button></td>
            <td>
                <span class="list-condition-badge ${phone.condition === 'new' ? 'new' : 'second'}">
                    ${phone.condition === 'new' ? '🆕 New' : '🔄 Second Hand'}
                </span>
            </td>
            <td>
                <span class="list-status-badge ${phone.isSold ? 'sold' : 'available'}">
                    ${phone.isSold ? 'Sold' : 'Available'}
                </span>
            </td>
            <td>${formatDate(phone.createdAt)}</td>
            <td>
                <div class="list-actions">
                    ${!phone.isSold ? `
                        <button onclick="markAsSold('${phone.id}')" title="Mark as Sold">
                            <span class="material-icons btn-sold">shopping_cart</span>
                        </button>
                        <button onclick="editPhone('${phone.id}')" title="Edit">
                            <span class="material-icons btn-edit">edit</span>
                        </button>
                    ` : `
                        <button onclick="markAsAvailable('${phone.id}')" title="Undo - Mark Available">
                            <span class="material-icons btn-undo">undo</span>
                        </button>
                    `}
                    <button onclick="deletePhone('${phone.id}')" title="Delete">
                        <span class="material-icons btn-delete">delete</span>
                    </button>
                </div>
            </td>
        `;
        listViewBody.appendChild(row);
    });
}

// Toggle View
toggleViewBtn.addEventListener('click', () => {
    isListView = !isListView;
    
    if (isListView) {
        brandsContainer.classList.add('hidden');
        listViewContainer.classList.remove('hidden');
        toggleViewBtn.innerHTML = '<span class="material-icons">view_module</span> Brand View';
        renderListView(searchInput.value.trim());
    } else {
        brandsContainer.classList.remove('hidden');
        listViewContainer.classList.add('hidden');
        toggleViewBtn.innerHTML = '<span class="material-icons">view_list</span> List View';
        renderBrands(searchInput.value.trim());
    }
});

// Search
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    
    if (searchTerm) {
        clearSearchBtn.classList.remove('hidden');
        brands.forEach(b => expandedBrands.add(b.id));
    } else {
        clearSearchBtn.classList.add('hidden');
    }
    
    renderBrands(searchTerm);
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderBrands();
});

// Update Stats
function updateStats() {
    const visible = getVisiblePhones();
    const total = visible.length;
    const sold = visible.filter(p => p.isSold).length;
    const available = total - sold;
    const newPhones = visible.filter(p => p.condition === 'new').length;
    const secondPhones = visible.filter(p => p.condition === 'second').length;
    
    totalStock.textContent = total;
    soldCount.textContent = sold;
    availableStock.textContent = available;
    newStock.textContent = newPhones;
    secondStock.textContent = secondPhones;
    
    // Update active filter visual state
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    
    const activeCard = document.querySelector(`[data-filter="${activeFilter}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }
}

// Stat Card Click Handlers
document.getElementById('statTotal').addEventListener('click', () => {
    activeFilter = activeFilter === 'all' ? 'all' : 'all';
    renderBrands(searchInput.value.trim());
    updateStats();
});

document.getElementById('statSold').addEventListener('click', () => {
    activeFilter = activeFilter === 'sold' ? 'all' : 'sold';
    renderBrands(searchInput.value.trim());
    updateStats();
});

document.getElementById('statAvailable').addEventListener('click', () => {
    activeFilter = activeFilter === 'available' ? 'all' : 'available';
    renderBrands(searchInput.value.trim());
    updateStats();
});

document.getElementById('statNew').addEventListener('click', () => {
    activeFilter = activeFilter === 'new' ? 'all' : 'new';
    renderBrands(searchInput.value.trim());
    updateStats();
});

document.getElementById('statSecond').addEventListener('click', () => {
    activeFilter = activeFilter === 'second' ? 'all' : 'second';
    renderBrands(searchInput.value.trim());
    updateStats();
});

// Modal Close Handlers
document.getElementById('closeBrandModalBtn').addEventListener('click', () => {
    brandModal.classList.add('hidden');
});

document.getElementById('cancelBrandBtn').addEventListener('click', () => {
    brandModal.classList.add('hidden');
});

document.getElementById('closeModelModalBtn').addEventListener('click', () => {
    modelModal.classList.add('hidden');
});

document.getElementById('cancelModelBtn').addEventListener('click', () => {
    modelModal.classList.add('hidden');
});

document.getElementById('closePhoneModalBtn').addEventListener('click', () => {
    phoneModal.classList.add('hidden');
});

document.getElementById('cancelPhoneBtn').addEventListener('click', () => {
    phoneModal.classList.add('hidden');
});

// Modal Overlays
brandModal.querySelector('.modal-overlay').addEventListener('click', () => {
    brandModal.classList.add('hidden');
});

modelModal.querySelector('.modal-overlay').addEventListener('click', () => {
    modelModal.classList.add('hidden');
});

phoneModal.querySelector('.modal-overlay').addEventListener('click', () => {
    phoneModal.classList.add('hidden');
});

confirmModal.querySelector('.modal-overlay').addEventListener('click', () => {
    confirmModal.classList.add('hidden');
});

// Confirmation Dialog
function showConfirmDialog(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    confirmModal.classList.remove('hidden');
}

document.getElementById('confirmOkBtn').addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
    confirmModal.classList.add('hidden');
});

document.getElementById('confirmCancelBtn').addEventListener('click', () => {
    confirmCallback = null;
    confirmModal.classList.add('hidden');
});

// Utilities
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Network status feedback
window.addEventListener('online', () => {
    showToast('Back online. Syncing changes...');
    processPendingWrites();
    // Try to register background sync if available
    if (navigator.serviceWorker && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            if (reg.sync) {
                try { reg.sync.register('sync-phones'); } catch(e) { /* ignore */ }
            }
        });
    }
});

window.addEventListener('offline', () => {
    showToast('You are offline. Changes will sync when back online.');
});

// IndexedDB helper for pending queue (simple wrapper)
const DB_NAME = 'phoneimei-db';
const DB_STORE = 'pendingWrites';

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function addPendingWrite(op) {
    try {
        const db = await openDb();
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).add(Object.assign({}, op, { createdAt: Date.now() }));
        await tx.complete;
        // register sync
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(reg => { if (reg.sync) reg.sync.register('sync-phones').catch(()=>{}); });
        }
    } catch (err) {
        console.error('Failed to add pending write to IndexedDB', err);
    }
}

async function getAllPendingWrites() {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function removePendingWrite(id) {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    return tx.complete;
}

async function processPendingWrites() {
    if (!navigator.onLine) return;
    const queue = await getAllPendingWrites();
    if (!queue || queue.length === 0) return;
    showToast('Syncing local changes...');
    for (const op of queue) {
        try {
            if (op.type === 'addPhone') {
                const data = Object.assign({}, op.data);
                const tempId = data._tempId;
                delete data._tempId;
                const ref = await db.collection('phones').add(data);
                const idx = phones.findIndex(p => p.id === tempId);
                if (idx !== -1) phones[idx].id = ref.id;
            } else if (op.type === 'updatePhone') {
                await db.collection('phones').doc(op.id).update(op.data);
            } else if (op.type === 'softDeletePhone') {
                await db.collection('phones').doc(op.id).update({ deleted: true, deletedAt: firebase.firestore.FieldValue.serverTimestamp(), deletedBy: op.userId });
            } else if (op.type === 'permanentDelete' || op.type === 'permanentDelete') {
                await db.collection('phones').doc(op.id).delete();
            }
            await removePendingWrite(op.id);
        } catch (err) {
            console.error('Error processing pending op', op, err);
            break;
        }
    }
    renderBrands(searchInput.value.trim());
    renderTrash();
    updateStats();
}

// Listen to messages from service worker
if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (evt) => {
        if (!evt.data) return;
        if (evt.data.type === 'sync-phones') {
            processPendingWrites();
        }
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    text = String(text);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
}

// Copy IMEI to clipboard with fallback
function copyImei(imei) {
    if (!imei) return;
    // Prefer modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(imei).then(() => {
            showToast('IMEI copied to clipboard');
        }).catch(err => {
            console.error('Clipboard write failed:', err);
            // Fallback to execCommand
            fallbackCopy(imei);
        });
    } else {
        fallbackCopy(imei);
    }

    function fallbackCopy(text) {
        try {
            const input = document.createElement('input');
            input.style.position = 'fixed';
            input.style.left = '-9999px';
            input.value = text;
            document.body.appendChild(input);
            input.select();
            input.setSelectionRange(0, 99999); // for mobile
            const successful = document.execCommand('copy');
            document.body.removeChild(input);
            if (successful) {
                showToast('IMEI copied to clipboard');
            } else {
                showToast('Unable to copy IMEI');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showToast('Unable to copy IMEI');
        }
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}


