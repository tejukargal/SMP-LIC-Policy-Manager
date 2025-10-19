// Global variables
let staffData = [];
let currentStaff = null;
let policyCounter = 1;
let licRecords = {};
let isViewMode = false;

// DOM Elements
const staffList = document.getElementById('staffList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const licModal = document.getElementById('licModal');
const closeModal = document.querySelector('.close');
const licForm = document.getElementById('licForm');
const addMorePolicyBtn = document.getElementById('addMorePolicy');
const cancelBtn = document.getElementById('cancelBtn');
const policyEntries = document.getElementById('policyEntries');
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');

// Hamburger menu elements
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const restoreFileInput = document.getElementById('restoreFileInput');

// Stats elements
const totalStaffEl = document.getElementById('totalStaff');
const staffWithLICEl = document.getElementById('staffWithLIC');
const totalPoliciesEl = document.getElementById('totalPolicies');

// Edit modal elements
const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const editForm = document.getElementById('editForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadCSV();
    setupEventListeners();
    await fetchLICRecords();
    displayStaff();
    updateStats();

    // Focus search input on page load
    setTimeout(() => {
        searchInput.focus();
    }, 100);
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality - on button click
    searchBtn.addEventListener('click', filterStaff);

    // Search functionality - on Enter key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            filterStaff();
        }
    });

    // Clear button functionality
    clearBtn.addEventListener('click', clearSearch);

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterStaff();
        });
    });

    // Modal close
    closeModal.addEventListener('click', closeLICModal);
    cancelBtn.addEventListener('click', closeLICModal);

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === licModal) {
            closeLICModal();
        }
    });

    // Add more policy button
    addMorePolicyBtn.addEventListener('click', addPolicyEntry);

    // Form submission
    licForm.addEventListener('submit', saveLICDetails);

    // Hamburger menu
    hamburgerBtn.addEventListener('click', openSidebar);
    closeSidebar.addEventListener('click', closeSidebarMenu);
    sidebarOverlay.addEventListener('click', closeSidebarMenu);

    // Menu actions
    backupBtn.addEventListener('click', handleBackup);
    restoreBtn.addEventListener('click', () => restoreFileInput.click());
    restoreFileInput.addEventListener('change', handleRestore);
    deleteAllBtn.addEventListener('click', handleDeleteAll);

    // Edit modal
    closeEditModal.addEventListener('click', closeEditModalFunc);
    cancelEditBtn.addEventListener('click', closeEditModalFunc);
    editForm.addEventListener('submit', updatePolicy);

    // Click outside edit modal to close
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModalFunc();
        }
    });
}

// Load and parse CSV
async function loadCSV() {
    try {
        const response = await fetch('staff.csv');
        const csvText = await response.text();
        parseCSV(csvText);
    } catch (error) {
        showToast('Error loading staff data: ' + error.message, 'error');
        console.error('Error loading CSV:', error);
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    staffData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = line.split(',');
            return {
                sl: values[0]?.trim(),
                name: values[1]?.trim(),
                dept: values[2]?.trim(),
                designation: values[3]?.trim(),
                type: values[4]?.trim()
            };
        })
        .filter(staff => staff.name) // Filter out empty entries
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
}

// Display staff list
function displayStaff(filteredData = null) {
    const dataToDisplay = filteredData || staffData;
    staffList.innerHTML = '';

    if (dataToDisplay.length === 0) {
        staffList.innerHTML = '<p style="text-align: center; padding: 40px; color: #64748b;">No staff members found.</p>';
        return;
    }

    dataToDisplay.forEach(staff => {
        const staffItem = createStaffItem(staff);
        staffList.appendChild(staffItem);
    });
}

// Create staff item element
function createStaffItem(staff) {
    const div = document.createElement('div');
    div.className = 'staff-item';
    div.setAttribute('data-staff-sl', staff.sl);

    const hasLIC = licRecords[staff.sl] && licRecords[staff.sl].length > 0;
    if (hasLIC) {
        div.classList.add('has-lic');
    }

    const badgeClass = staff.type === 'TEACHING' ? 'badge-teaching' : 'badge-non-teaching';

    let licStatusHTML = '';
    if (hasLIC) {
        const policyCount = licRecords[staff.sl].length;
        const totalPremium = licRecords[staff.sl].reduce((sum, policy) => sum + parseFloat(policy.premium_amount || 0), 0);
        licStatusHTML = `
            <div class="lic-info">
                <span class="lic-text"><strong style="color: #10b981;">Total Policies:</strong> <span style="color: #059669;">${policyCount}</span></span>
                <span class="lic-text"><strong style="color: #2563eb;">Total Premium:</strong> <span style="color: #1e40af;">Rs. ${totalPremium.toFixed(2)}</span></span>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="staff-details">
            <div class="staff-name">${staff.name}</div>
            <div class="staff-meta">
                <span><strong>SL:</strong> ${staff.sl}</span>
                <span><strong>Dept:</strong> ${staff.dept}</span>
                <span><strong>Designation:</strong> ${staff.designation}</span>
                <span class="badge ${badgeClass}">${staff.type}</span>
            </div>
            ${licStatusHTML}
        </div>
        <div>
            ${hasLIC ? `<button class="btn btn-view" onclick="viewLICDetails(${staff.sl})">View Details</button>` : ''}
            <button class="btn btn-primary" onclick="openLICModal(${staff.sl})">Enter Details</button>
        </div>
    `;

    return div;
}

// Update a single staff item in the list (optimized)
function updateStaffItem(staffSL) {
    const staff = staffData.find(s => s.sl == staffSL);
    if (!staff) return;

    const existingItem = document.querySelector(`[data-staff-sl="${staffSL}"]`);
    if (existingItem) {
        const newItem = createStaffItem(staff);
        existingItem.replaceWith(newItem);
    } else {
        // If item doesn't exist, do a full refresh (should rarely happen)
        displayStaff();
    }
}

// Filter staff based on search and filter
function filterStaff() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;

    let filtered = staffData;

    // Apply type filter
    if (activeFilter !== 'all') {
        filtered = filtered.filter(staff => staff.type === activeFilter);
    }

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(staff =>
            staff.name.toLowerCase().includes(searchTerm) ||
            staff.dept.toLowerCase().includes(searchTerm) ||
            staff.designation.toLowerCase().includes(searchTerm)
        );
    }

    displayStaff(filtered);
}

// Clear search
function clearSearch() {
    searchInput.value = '';

    // Reset filter to "All Staff"
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');

    // Display all staff
    displayStaff();

    // Focus back on search input
    searchInput.focus();
}

// Open LIC modal
function openLICModal(staffSL) {
    currentStaff = staffData.find(s => s.sl == staffSL);
    if (!currentStaff) return;

    isViewMode = false;

    // Populate staff info
    document.getElementById('modalStaffName').textContent = currentStaff.name;
    document.getElementById('modalStaffDept').textContent = currentStaff.dept;
    document.getElementById('modalStaffDesignation').textContent = currentStaff.designation;
    document.getElementById('modalStaffType').textContent = currentStaff.type;

    // Show existing policies if any
    displayExistingPolicies(staffSL);

    // Reset form
    policyEntries.innerHTML = `
        <div class="policy-entry">
            <h3>Add New Policy Details</h3>
            <div class="policy-form-row">
                <div class="form-group">
                    <label for="policyNo1">Policy Number</label>
                    <input
                        type="text"
                        id="policyNo1"
                        name="policyNo[]"
                        class="uppercase-input"
                        required
                        autocomplete="off"
                    >
                </div>
                <div class="form-group">
                    <label for="premiumAmount1">Premium Amount (Rs.)</label>
                    <input
                        type="number"
                        id="premiumAmount1"
                        name="premiumAmount[]"
                        step="0.01"
                        min="0"
                        required
                        autocomplete="off"
                    >
                </div>
                <div class="form-group">
                    <label for="maturityDate1">Maturity Date (dd/mm/yyyy)</label>
                    <input
                        type="text"
                        id="maturityDate1"
                        name="maturityDate[]"
                        placeholder="dd/mm/yyyy"
                        maxlength="10"
                        autocomplete="off"
                    >
                </div>
            </div>
        </div>
    `;

    policyEntries.style.display = 'block';
    document.getElementById('addMorePolicy').style.display = 'block';
    document.getElementById('saveBtn').style.display = 'block';

    policyCounter = 1;
    setupUppercaseInputs();
    setupDateInputs();
    setupEnterKeyNavigation();

    licModal.style.display = 'block';

    // Focus first input
    setTimeout(() => {
        document.getElementById('policyNo1').focus();
    }, 100);
}

// View LIC details
function viewLICDetails(staffSL) {
    currentStaff = staffData.find(s => s.sl == staffSL);
    if (!currentStaff) return;

    isViewMode = true;

    // Populate staff info
    document.getElementById('modalStaffName').textContent = currentStaff.name;
    document.getElementById('modalStaffDept').textContent = currentStaff.dept;
    document.getElementById('modalStaffDesignation').textContent = currentStaff.designation;
    document.getElementById('modalStaffType').textContent = currentStaff.type;

    // Show existing policies
    displayExistingPolicies(staffSL);

    // Hide form inputs and save button in view mode
    policyEntries.style.display = 'none';
    document.getElementById('addMorePolicy').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'none';

    licModal.style.display = 'block';
}

// Display existing policies
function displayExistingPolicies(staffSL) {
    const existingPoliciesDiv = document.getElementById('existingPolicies');
    const policies = licRecords[staffSL] || [];

    if (policies.length === 0) {
        existingPoliciesDiv.innerHTML = '';
        return;
    }

    let html = `
        <div class="policies-table-section">
            <h3>Policy Details</h3>
            <table class="policies-table">
                <thead>
                    <tr>
                        <th class="sl-cell">Sl</th>
                        <th class="policy-cell">Policy No</th>
                        <th class="amount-cell">Premium Amount</th>
                        <th class="maturity-cell">Maturity Date</th>
                        <th class="date-cell">Added Date</th>
                        <th class="actions-cell">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalPremium = 0;
    policies.forEach((policy, index) => {
        const addedDate = new Date(policy.created_at).toLocaleDateString('en-IN');
        const premium = parseFloat(policy.premium_amount);
        totalPremium += premium;
        const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
        const maturityDate = policy.maturity_date || '-';
        html += `
            <tr class="${rowClass}">
                <td class="sl-cell">${index + 1}</td>
                <td class="policy-cell">${policy.policy_no}</td>
                <td class="amount-cell">Rs. ${premium.toFixed(2)}</td>
                <td class="maturity-cell">${maturityDate}</td>
                <td class="date-cell">${addedDate}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" onclick="editPolicy(${policy.id})" title="Edit">
                        <span>✏️</span>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deletePolicy(${policy.id}, '${policy.policy_no}')" title="Delete">
                        <span>🗑️</span>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                    <tr class="total-row">
                        <td class="sl-cell"></td>
                        <td class="policy-cell"><strong>Total</strong></td>
                        <td class="amount-cell"><strong>Rs. ${totalPremium.toFixed(2)}</strong></td>
                        <td class="maturity-cell"></td>
                        <td class="date-cell"></td>
                        <td class="actions-cell"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    existingPoliciesDiv.innerHTML = html;
}

// Close LIC modal
function closeLICModal() {
    licModal.style.display = 'none';
    currentStaff = null;
    isViewMode = false;
    licForm.reset();

    // Reset visibility
    document.getElementById('saveBtn').style.display = 'block';
    policyEntries.style.display = 'block';
    document.getElementById('addMorePolicy').style.display = 'block';
}

// Add policy entry
function addPolicyEntry() {
    policyCounter++;
    const policyEntry = document.createElement('div');
    policyEntry.className = 'policy-entry';
    policyEntry.innerHTML = `
        <button type="button" class="remove-policy-btn" onclick="removePolicyEntry(this)">×</button>
        <h3>Add New Policy Details ${policyCounter}</h3>
        <div class="policy-form-row">
            <div class="form-group">
                <label for="policyNo${policyCounter}">Policy Number</label>
                <input
                    type="text"
                    id="policyNo${policyCounter}"
                    name="policyNo[]"
                    class="uppercase-input"
                    required
                    autocomplete="off"
                >
            </div>
            <div class="form-group">
                <label for="premiumAmount${policyCounter}">Premium Amount (Rs.)</label>
                <input
                    type="number"
                    id="premiumAmount${policyCounter}"
                    name="premiumAmount[]"
                    step="0.01"
                    min="0"
                    required
                    autocomplete="off"
                >
            </div>
            <div class="form-group">
                <label for="maturityDate${policyCounter}">Maturity Date (dd/mm/yyyy)</label>
                <input
                    type="text"
                    id="maturityDate${policyCounter}"
                    name="maturityDate[]"
                    placeholder="dd/mm/yyyy"
                    maxlength="10"
                    autocomplete="off"
                >
            </div>
        </div>
    `;

    policyEntries.appendChild(policyEntry);
    setupUppercaseInputs();
    setupEnterKeyNavigation();
    setupDateInputs();

    // Focus on new policy number input
    document.getElementById(`policyNo${policyCounter}`).focus();
}

// Remove policy entry
function removePolicyEntry(button) {
    if (policyEntries.children.length > 1) {
        button.parentElement.remove();
    } else {
        showToast('At least one policy entry is required', 'warning');
    }
}

// Setup uppercase inputs (using event delegation to avoid duplicates)
function setupUppercaseInputs() {
    const uppercaseInputs = document.querySelectorAll('.uppercase-input');
    uppercaseInputs.forEach(input => {
        // Remove existing listener if any
        input.removeEventListener('input', uppercaseHandler);
        input.addEventListener('input', uppercaseHandler);
    });
}

function uppercaseHandler() {
    this.value = this.value.toUpperCase();
}

// Setup date inputs with automatic formatting
function setupDateInputs() {
    const dateInputs = document.querySelectorAll('input[name="maturityDate[]"]');
    dateInputs.forEach(input => {
        input.removeEventListener('input', dateInputHandler);
        input.addEventListener('input', dateInputHandler);
    });
}

function dateInputHandler(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
        value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }

    e.target.value = value;
}

// Setup Enter key navigation
function setupEnterKeyNavigation() {
    const allInputs = licForm.querySelectorAll('input');

    allInputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();

                // Check if this is the last input
                if (index === allInputs.length - 1) {
                    // Check if all inputs are filled
                    const allFilled = Array.from(allInputs).every(inp => inp.value.trim() !== '');
                    if (allFilled) {
                        // Trigger form submission
                        licForm.requestSubmit();
                    } else {
                        showToast('Please fill all fields before saving', 'warning');
                    }
                } else {
                    // Move to next input
                    allInputs[index + 1].focus();
                }
            }
        });
    });
}

// Save LIC details with optimistic UI updates (instant feel)
async function saveLICDetails(e) {
    e.preventDefault();

    if (!currentStaff) return;

    const policyNumbers = Array.from(document.querySelectorAll('input[name="policyNo[]"]'))
        .map(input => input.value.trim())
        .filter(val => val);

    const premiumAmounts = Array.from(document.querySelectorAll('input[name="premiumAmount[]"]'))
        .map(input => input.value.trim())
        .filter(val => val);

    const maturityDates = Array.from(document.querySelectorAll('input[name="maturityDate[]"]'))
        .map(input => input.value.trim());

    if (policyNumbers.length === 0) {
        showToast('Please enter at least one policy', 'warning');
        return;
    }

    const policies = policyNumbers.map((policyNo, index) => ({
        staff_sl: currentStaff.sl,
        staff_name: currentStaff.name,
        staff_dept: currentStaff.dept,
        staff_designation: currentStaff.designation,
        staff_type: currentStaff.type,
        policy_no: policyNo.toUpperCase(),
        premium_amount: parseFloat(premiumAmounts[index]) || 0,
        maturity_date: maturityDates[index] || null
    }));

    const staffSL = currentStaff.sl;

    // OPTIMISTIC UPDATE: Update UI immediately (before server responds)
    // Create temporary records with fake IDs
    const tempRecords = policies.map((policy, index) => ({
        ...policy,
        id: `temp_${Date.now()}_${index}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));

    // Update local data immediately
    if (!licRecords[staffSL]) {
        licRecords[staffSL] = [];
    }
    tempRecords.forEach(record => {
        licRecords[staffSL].push(record);
    });

    // Close modal immediately - instant feedback!
    closeLICModal();

    // Update UI immediately
    updateStaffItem(staffSL);
    updateStats();

    // Show success message immediately
    showToast('LIC details saved successfully!', 'success');

    // Now send to server in background
    try {
        const response = await fetch('http://localhost:3000/api/lic-records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ policies })
        });

        const result = await response.json();

        if (response.ok) {
            // Replace temp records with real server records
            licRecords[staffSL] = licRecords[staffSL].filter(r => !r.id.toString().startsWith('temp_'));
            result.records.forEach(record => {
                licRecords[staffSL].push(record);
            });

            // Update UI with real data
            updateStaffItem(staffSL);
            updateStats();
        } else {
            // Server failed - rollback optimistic update
            licRecords[staffSL] = licRecords[staffSL].filter(r => !r.id.toString().startsWith('temp_'));
            updateStaffItem(staffSL);
            updateStats();
            showToast('Error saving to server: ' + result.error, 'error');
        }
    } catch (error) {
        // Network error - rollback optimistic update
        licRecords[staffSL] = licRecords[staffSL].filter(r => !r.id.toString().startsWith('temp_'));
        updateStaffItem(staffSL);
        updateStats();
        showToast('Network error: ' + error.message, 'error');
        console.error('Error:', error);
    }
}

// Edit policy - Open edit modal
function editPolicy(policyId) {
    // Find the policy
    let policyToEdit = null;
    let staffSL = null;

    for (const [sl, policies] of Object.entries(licRecords)) {
        const found = policies.find(p => p.id == policyId);
        if (found) {
            policyToEdit = found;
            staffSL = sl;
            break;
        }
    }

    if (!policyToEdit) {
        showToast('Policy not found', 'error');
        return;
    }

    // Populate edit form
    document.getElementById('editPolicyId').value = policyId;
    document.getElementById('editStaffSL').value = staffSL;
    document.getElementById('editPolicyNo').value = policyToEdit.policy_no;
    document.getElementById('editPremiumAmount').value = policyToEdit.premium_amount;
    document.getElementById('editMaturityDate').value = policyToEdit.maturity_date || '';

    // Setup uppercase and date formatting
    const editPolicyNoInput = document.getElementById('editPolicyNo');
    editPolicyNoInput.removeEventListener('input', uppercaseHandler);
    editPolicyNoInput.addEventListener('input', uppercaseHandler);

    const editMaturityInput = document.getElementById('editMaturityDate');
    editMaturityInput.removeEventListener('input', dateInputHandler);
    editMaturityInput.addEventListener('input', dateInputHandler);

    // Show modal
    editModal.style.display = 'block';

    // Focus first input
    setTimeout(() => {
        editPolicyNoInput.focus();
    }, 100);
}

// Close edit modal
function closeEditModalFunc() {
    editModal.style.display = 'none';
    editForm.reset();
}

// Update policy
async function updatePolicy(e) {
    e.preventDefault();

    const policyId = document.getElementById('editPolicyId').value;
    const staffSL = document.getElementById('editStaffSL').value;
    const policyNo = document.getElementById('editPolicyNo').value.trim();
    const premiumAmount = document.getElementById('editPremiumAmount').value.trim();
    const maturityDate = document.getElementById('editMaturityDate').value.trim();

    if (!policyNo || !premiumAmount) {
        showToast('Please fill all required fields', 'warning');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/lic-records/${policyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policy_no: policyNo.toUpperCase(),
                premium_amount: parseFloat(premiumAmount) || 0,
                maturity_date: maturityDate || null
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Update local record
            const policyIndex = licRecords[staffSL].findIndex(p => p.id == policyId);
            if (policyIndex !== -1) {
                licRecords[staffSL][policyIndex] = result.record;
            }

            // Close modal
            closeEditModalFunc();

            // Refresh display
            displayExistingPolicies(staffSL);
            updateStaffItem(staffSL);
            updateStats();

            showToast('Policy updated successfully!', 'success');
        } else {
            showToast('Error: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error updating policy: ' + error.message, 'error');
        console.error('Error:', error);
    }
}

// Delete policy
async function deletePolicy(policyId, policyNo) {
    const confirmed = confirm(`Are you sure you want to delete policy "${policyNo}"?\n\nThis action cannot be undone.`);

    if (!confirmed) return;

    // Find the staff SL
    let staffSL = null;
    for (const [sl, policies] of Object.entries(licRecords)) {
        if (policies.find(p => p.id == policyId)) {
            staffSL = sl;
            break;
        }
    }

    if (!staffSL) {
        showToast('Policy not found', 'error');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/lic-records/${policyId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            // Remove from local records
            licRecords[staffSL] = licRecords[staffSL].filter(p => p.id != policyId);

            // If no more policies, remove the entry
            if (licRecords[staffSL].length === 0) {
                delete licRecords[staffSL];
            }

            // Refresh display
            if (licRecords[staffSL] && licRecords[staffSL].length > 0) {
                displayExistingPolicies(staffSL);
            } else {
                document.getElementById('existingPolicies').innerHTML = '';
            }

            updateStaffItem(staffSL);
            updateStats();

            showToast('Policy deleted successfully!', 'success');
        } else {
            showToast('Error: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error deleting policy: ' + error.message, 'error');
        console.error('Error:', error);
    }
}

// Fetch LIC records from database
async function fetchLICRecords() {
    try {
        const response = await fetch('http://localhost:3000/api/lic-records');
        const result = await response.json();

        if (response.ok) {
            // Group records by staff_sl
            licRecords = {};
            result.records.forEach(record => {
                if (!licRecords[record.staff_sl]) {
                    licRecords[record.staff_sl] = [];
                }
                licRecords[record.staff_sl].push(record);
            });
        }
    } catch (error) {
        console.error('Error fetching LIC records:', error);
    }
}

// Update statistics
function updateStats() {
    const totalStaff = staffData.length;
    const staffWithLIC = Object.keys(licRecords).length;
    const totalPolicies = Object.values(licRecords).reduce((sum, policies) => sum + policies.length, 0);

    totalStaffEl.textContent = totalStaff;
    staffWithLICEl.textContent = staffWithLIC;
    totalPoliciesEl.textContent = totalPolicies;
}

// Show/hide loading overlay
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Open sidebar
function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
}

// Close sidebar
function closeSidebarMenu() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
}

// Handle backup
async function handleBackup() {
    try {
        showLoading(true);
        const response = await fetch('http://localhost:3000/api/backup');
        const result = await response.json();

        if (response.ok) {
            // Create download link
            const dataStr = JSON.stringify(result.backup, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `staff-lic-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast(`Backup created successfully! ${result.backup.record_count} records backed up.`, 'success');
            closeSidebarMenu();
        } else {
            showToast('Error creating backup: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error creating backup: ' + error.message, 'error');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Handle restore
async function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showLoading(true);
        const fileContent = await file.text();
        const backupData = JSON.parse(fileContent);

        if (!backupData.data || !Array.isArray(backupData.data)) {
            showToast('Invalid backup file format', 'error');
            return;
        }

        const confirmed = confirm(
            `This will replace all existing data with ${backupData.record_count} records from backup.\n\n` +
            `Backup Date: ${new Date(backupData.backup_date).toLocaleString()}\n\n` +
            `Are you sure you want to continue?`
        );

        if (!confirmed) {
            showLoading(false);
            return;
        }

        const response = await fetch('http://localhost:3000/api/restore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: backupData.data })
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            closeSidebarMenu();
            await fetchLICRecords();
            displayStaff();
            updateStats();
        } else {
            showToast('Error restoring data: ' + result.error, 'error');
        }
    } catch (error) {
        showToast('Error restoring data: ' + error.message, 'error');
        console.error('Error:', error);
    } finally {
        showLoading(false);
        restoreFileInput.value = ''; // Reset file input
    }
}

// Handle delete all
async function handleDeleteAll() {
    const password = prompt('Enter password to delete all data:');

    if (!password) {
        return;
    }

    const confirmed = confirm(
        'WARNING: This will permanently delete ALL LIC records!\n\n' +
        'This action cannot be undone.\n\n' +
        'Are you absolutely sure?'
    );

    if (!confirmed) {
        return;
    }

    try {
        showLoading(true);
        const response = await fetch('http://localhost:3000/api/delete-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            closeSidebarMenu();
            licRecords = {};
            displayStaff();
            updateStats();
        } else {
            if (response.status === 401) {
                showToast('Invalid password!', 'error');
            } else {
                showToast('Error deleting data: ' + result.error, 'error');
            }
        }
    } catch (error) {
        showToast('Error deleting data: ' + error.message, 'error');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}
