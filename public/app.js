// API Configuration
const API_BASE_URL = 'https://material-lending-func.azurewebsites.net/api';

// State
let personsData = [];
let equipmentData = [];
let loansData = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadInitialData();
});

// Tab switching
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Load data for the tab
    if (tabName === 'actief') {
        loadActiveLoans();
    } else if (tabName === 'personen') {
        loadPersons();
    }
}

// Load initial data
async function loadInitialData() {
    try {
        await Promise.all([
            loadActivePersons(),
            loadAvailableEquipment()
        ]);
        setupFormHandlers();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Fout bij het laden van gegevens. Controleer de API verbinding.');
    }
}

// API Calls
async function loadActivePersons() {
    const response = await fetch(`${API_BASE_URL}/persons/active`);
    if (!response.ok) throw new Error('Failed to load persons');
    
    personsData = await response.json();
    
    const personSelect = document.getElementById('personSelect');
    const returnPersonSelect = document.getElementById('returnPersonSelect');
    
    personsData.forEach(person => {
        const option = new Option(`${person.Name} ${person.Surname}`, person.PersonId);
        personSelect.add(option.cloneNode(true));
        returnPersonSelect.add(option);
    });
}

async function loadAvailableEquipment() {
    const response = await fetch(`${API_BASE_URL}/equipment/available`);
    if (!response.ok) throw new Error('Failed to load equipment');
    
    equipmentData = await response.json();
    
    const equipmentSelect = document.getElementById('equipmentSelect');
    equipmentData.forEach(item => {
        const label = `${item.Name}${item.Brand ? ' - ' + item.Brand : ''} ${item.ItemNumber ? '(' + item.ItemNumber + ')' : ''}`;
        const option = new Option(label, item.EquipmentId);
        equipmentSelect.add(option);
    });
}

async function loadActiveLoans() {
    try {
        const response = await fetch(`${API_BASE_URL}/loans/active`);
        if (!response.ok) throw new Error('Failed to load loans');
        
        loansData = await response.json();
        displayActiveLoans(loansData);
    } catch (error) {
        console.error('Error loading active loans:', error);
        document.getElementById('activeLoans').innerHTML = '<p class="error">Fout bij het laden van uitleningen</p>';
    }
}

async function loadPersons() {
    try {
        const response = await fetch(`${API_BASE_URL}/persons/active`);
        if (!response.ok) throw new Error('Failed to load persons');
        
        const persons = await response.json();
        displayPersons(persons);
    } catch (error) {
        console.error('Error loading persons:', error);
        document.getElementById('personsList').innerHTML = '<p class="error">Fout bij het laden van personen</p>';
    }
}

async function loadActiveLoansForPerson(personId) {
    try {
        const response = await fetch(`${API_BASE_URL}/loans/person/${personId}/active`);
        if (!response.ok) throw new Error('Failed to load person loans');
        
        const loans = await response.json();
        displayLoansForReturn(loans);
    } catch (error) {
        console.error('Error loading person loans:', error);
        document.getElementById('activeLoansForReturn').innerHTML = '<p class="error">Fout bij het laden van uitleningen</p>';
    }
}

// Form handlers
function setupFormHandlers() {
    // Loan form
    document.getElementById('loanForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const personId = document.getElementById('personSelect').value;
        const equipmentSelect = document.getElementById('equipmentSelect');
        const selectedEquipment = Array.from(equipmentSelect.selectedOptions).map(opt => parseInt(opt.value));
        const feedback = document.getElementById('borrowFeedback').value;
        
        if (selectedEquipment.length === 0) {
            showError('Selecteer minimaal één stuk materiaal');
            return;
        }
        
        try {
            // API expects: { PersonId: number, EquipmentIds: number[], BorrowFeedback: string|null }
            const response = await fetch(`${API_BASE_URL}/loans/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    PersonId: parseInt(personId),
                    EquipmentIds: selectedEquipment,
                    BorrowFeedback: feedback || null
                })
            });
            
            if (!response.ok) throw new Error('Failed to create loan');
            
            showSuccess('Uitlening geregistreerd!');
            e.target.reset();
            await loadAvailableEquipment(); // Refresh available equipment
        } catch (error) {
            console.error('Error creating loan:', error);
            showError('Fout bij het registreren van de uitlening');
        }
    });
    
    // Return person selection
    document.getElementById('returnPersonSelect').addEventListener('change', (e) => {
        const personId = e.target.value;
        if (personId) {
            loadActiveLoansForPerson(personId);
        } else {
            document.getElementById('activeLoansForReturn').innerHTML = '<p class="info">Selecteer een persoon om actieve uitleningen te zien</p>';
        }
    });
}

// Display functions
function displayActiveLoans(loans) {
    const container = document.getElementById('activeLoans');
    
    if (loans.length === 0) {
        container.innerHTML = '<p class="info">Geen actieve uitleningen</p>';
        return;
    }
    
    const html = loans.map(loan => `
        <div class="loan-item">
            <div class="loan-header">
                <strong>${loan.PersonName} ${loan.PersonSurname}</strong>
                <span class="date">${formatDate(loan.BorrowedAt)}</span>
            </div>
            <div class="loan-body">
                <div>${loan.EquipmentName} ${loan.Brand ? '- ' + loan.Brand : ''}</div>
                ${loan.ItemNumber ? `<div class="item-number">Item #${loan.ItemNumber}</div>` : ''}
                ${loan.BorrowFeedback ? `<div class="feedback">${loan.BorrowFeedback}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function displayLoansForReturn(loans) {
    const container = document.getElementById('activeLoansForReturn');
    
    if (loans.length === 0) {
        container.innerHTML = '<p class="info">Geen actieve uitleningen voor deze persoon</p>';
        return;
    }
    
    const html = loans.map(loan => `
        <div class="loan-item return-item">
            <div class="loan-body">
                <label>
                    <input type="checkbox" class="return-checkbox" data-loan-id="${loan.LoanId}">
                    ${loan.EquipmentName} ${loan.Brand ? '- ' + loan.Brand : ''}
                    ${loan.ItemNumber ? `(#${loan.ItemNumber})` : ''}
                </label>
                <div class="loan-date">Geleend op: ${formatDate(loan.BorrowedAt)}</div>
            </div>
        </div>
    `).join('');
    
    const returnButton = `
        <div class="form-group">
            <label for="returnFeedback">Opmerking bij terugbrengen:</label>
            <textarea id="returnFeedback" rows="3"></textarea>
        </div>
        <button type="button" class="btn btn-primary" onclick="returnSelectedLoans()">Materiaal Terugbrengen</button>
    `;
    
    container.innerHTML = html + returnButton;
}

function displayPersons(persons) {
    const container = document.getElementById('personsList');
    
    if (persons.length === 0) {
        container.innerHTML = '<p class="info">Geen actieve leden</p>';
        return;
    }
    
    const html = persons.map(person => `
        <div class="person-item">
            <div class="person-name">${person.Name} ${person.Surname}</div>
            <div class="person-details">
                ${person.Email ? `<div>📧 ${person.Email}</div>` : ''}
                ${person.Gsm ? `<div>📱 ${person.Gsm}</div>` : ''}
                ${person.Brevet ? `<div>🤿 ${person.Brevet}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Return loans
async function returnSelectedLoans() {
    const checkboxes = document.querySelectorAll('.return-checkbox:checked');
    const loanIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.loanId));
    const feedback = document.getElementById('returnFeedback').value;
    
    if (loanIds.length === 0) {
        showError('Selecteer minimaal één uitlening om terug te brengen');
        return;
    }
    
    try {
        // API expects: { LoanIds: number[], ReturnFeedback: string|null }
        const response = await fetch(`${API_BASE_URL}/loans/return-batch`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                LoanIds: loanIds,
                ReturnFeedback: feedback || null
            })
        });
        
        if (!response.ok) throw new Error('Failed to return loans');
        
        showSuccess('Materiaal teruggebracht!');
        document.getElementById('returnPersonSelect').value = '';
        document.getElementById('activeLoansForReturn').innerHTML = '<p class="info">Selecteer een persoon om actieve uitleningen te zien</p>';
        await loadAvailableEquipment(); // Refresh available equipment
    } catch (error) {
        console.error('Error returning loans:', error);
        showError('Fout bij het terugbrengen van materiaal');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}
