/**
 * SPLITTER - Web Application Logic
 * Clean, modern vanilla JavaScript implementation.
 */

// ==================================================
// STATE MANAGEMENT & LOCAL STORAGE
// ==================================================
const STORAGE_KEY_TRIPS = 'splitter_trips_data';
const STORAGE_KEY_SETTINGS = 'splitter_settings_data';

let state = {
  trips: [],
  currentTripId: null,
  activeTab: 'members',
  settings: {
    darkMode: false,
    currency: '₹'
  },
  filter: 'all',
  searchQuery: ''
};

// Generic Confirmation Modal Callback Helper
let confirmActionCallback = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  applySettings();
  setupEventListeners();
  renderCurrentView();
});

function loadDataFromStorage() {
  try {
    const savedTrips = localStorage.getItem(STORAGE_KEY_TRIPS);
    if (savedTrips) {
      state.trips = JSON.parse(savedTrips);
    }
  } catch (e) {
    console.error('Error loading trips from storage:', e);
    state.trips = [];
  }

  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) {
      state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
    }
  } catch (e) {
    console.error('Error loading settings from storage:', e);
  }
}

function saveDataToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(state.trips));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
  } catch (e) {
    console.error('Error saving data to storage:', e);
    showToast('⚠️ Storage limit reached or unavailable');
  }
}

// ==================================================
// EVENT LISTENERS & NAVIGATION
// ==================================================
function setupEventListeners() {
  // Navigation Buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const viewName = e.currentTarget.getAttribute('data-view');
      switchView(viewName);
    });
  });

  // Brand Header Click -> Home
  document.getElementById('nav-brand').addEventListener('click', () => {
    switchView('home');
  });

  // Quick Theme Toggle Button
  document.getElementById('theme-toggle-quick').addEventListener('click', toggleDarkMode);

  // Home Screen Buttons
  document.getElementById('btn-home-new-trip').addEventListener('click', () => openModal('modal-new-trip'));
  document.getElementById('btn-home-saved-trips').addEventListener('click', () => switchView('trips'));
  document.getElementById('btn-view-all-trips').addEventListener('click', () => switchView('trips'));

  // Saved Trips Buttons & Filters
  document.getElementById('btn-trips-new-trip').addEventListener('click', () => openModal('modal-new-trip'));

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.filter = e.currentTarget.getAttribute('data-filter');
      renderSavedTrips();
    });
  });

  document.getElementById('trips-search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderSavedTrips();
  });

  // Form Submission: New Trip
  document.getElementById('form-new-trip').addEventListener('submit', handleCreateTrip);

  // Dashboard Nav & Back Button
  document.getElementById('btn-dashboard-back').addEventListener('click', () => switchView('trips'));
  document.getElementById('btn-dashboard-rename').addEventListener('click', () => {
    const trip = getCurrentTrip();
    if (!trip) return;
    document.getElementById('rename-trip-id-hidden').value = trip.id;
    document.getElementById('rename-trip-name-input').value = trip.name;
    openModal('modal-rename-trip');
  });

  document.querySelectorAll('.dash-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      const tabName = e.currentTarget.getAttribute('data-tab');
      switchDashboardTab(tabName);
    });
  });

  // Member Management Form
  document.getElementById('form-add-member').addEventListener('submit', handleAddMember);
  document.getElementById('form-edit-member').addEventListener('submit', handleEditMember);

  // Expense Management Form & Buttons
  document.getElementById('btn-open-add-expense').addEventListener('click', () => openExpenseModal());
  document.getElementById('form-expense').addEventListener('submit', handleSaveExpense);

  document.getElementById('btn-select-all-split').addEventListener('click', () => {
    document.querySelectorAll('#expense-split-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = true);
  });
  document.getElementById('btn-deselect-all-split').addEventListener('click', () => {
    document.querySelectorAll('#expense-split-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
  });

  // Rename Trip Form
  document.getElementById('form-rename-trip').addEventListener('submit', handleRenameTrip);

  // End Trip Button
  document.getElementById('btn-execute-end-trip').addEventListener('click', promptEndTrip);

  // Settings Event Handlers
  document.getElementById('setting-dark-mode').addEventListener('change', (e) => {
    state.settings.darkMode = e.target.checked;
    applySettings();
    saveDataToStorage();
  });

  document.getElementById('setting-currency').addEventListener('change', (e) => {
    state.settings.currency = e.target.value;
    saveDataToStorage();
    showToast(`Default currency changed to ${e.target.value}`);
  });

  document.getElementById('btn-export-backup').addEventListener('click', exportBackupJSON);
  document.getElementById('input-import-backup').addEventListener('change', importBackupJSON);
  document.getElementById('btn-clear-all-data').addEventListener('click', promptClearAllData);

  // Generic Modal Close Buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.currentTarget.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  // Confirmation Modal Action Button
  document.getElementById('confirm-modal-action-btn').addEventListener('click', () => {
    if (confirmActionCallback) {
      confirmActionCallback();
      confirmActionCallback = null;
    }
    closeModal('modal-confirm');
  });
}

// ==================================================
// VIEW SWITCHER & TAB LOGIC
// ==================================================
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewName}`);
  const targetNavBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

  if (targetView) targetView.classList.add('active');
  if (targetNavBtn) targetNavBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Render view content
  if (viewName === 'home') renderHome();
  else if (viewName === 'trips') renderSavedTrips();
  else if (viewName === 'stats') renderStats();
  else if (viewName === 'settings') renderSettings();
  else if (viewName === 'dashboard') renderDashboard();
}

function switchDashboardTab(tabName) {
  state.activeTab = tabName;
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const targetTabBtn = document.querySelector(`.dash-tab[data-tab="${tabName}"]`);
  const targetTabContent = document.getElementById(`tab-${tabName}`);

  if (targetTabBtn) targetTabBtn.classList.add('active');
  if (targetTabContent) targetTabContent.classList.add('active');

  renderDashboard();
}

function getCurrentTrip() {
  return state.trips.find(t => t.id === state.currentTripId) || null;
}

// ==================================================
// RENDER FUNCTIONS
// ==================================================

// 1. HOME VIEW RENDER
function renderHome() {
  const totalTrips = state.trips.length;
  const activeTrips = state.trips.filter(t => !t.completed).length;
  let totalSpent = 0;

  state.trips.forEach(trip => {
    totalSpent += (trip.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  });

  document.getElementById('home-stat-trips').innerText = totalTrips;
  document.getElementById('home-stat-spent').innerText = formatCurrency(totalSpent, state.settings.currency);
  document.getElementById('home-stat-active').innerText = activeTrips;

  // Render Recent 3 Trips
  const recentContainer = document.getElementById('home-recent-trips');
  recentContainer.innerHTML = '';

  if (state.trips.length === 0) {
    recentContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌴</div>
        <h3>No Trips Found</h3>
        <p>Get started by creating your first trip or event!</p>
      </div>
    `;
    return;
  }

  // Sort by creation date descending
  const sortedTrips = [...state.trips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

  sortedTrips.forEach(trip => {
    recentContainer.appendChild(createTripCardElement(trip));
  });
}

// 2. SAVED TRIPS RENDER
function renderSavedTrips() {
  const container = document.getElementById('saved-trips-container');
  container.innerHTML = '';

  let filtered = state.trips.filter(t => {
    if (state.filter === 'active') return !t.completed;
    if (state.filter === 'completed') return t.completed;
    return true;
  });

  if (state.searchQuery) {
    filtered = filtered.filter(t => t.name.toLowerCase().includes(state.searchQuery));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No Matching Trips</h3>
        <p>Try adjusting your search query or filters.</p>
      </div>
    `;
    return;
  }

  // Sort by creation date descending
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  filtered.forEach(trip => {
    container.appendChild(createTripCardElement(trip));
  });
}

function createTripCardElement(trip) {
  const card = document.createElement('div');
  card.className = 'trip-card';

  const totalExpense = (trip.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const memberCount = (trip.members || []).length;
  const curr = trip.currency || state.settings.currency;

  card.innerHTML = `
    <div>
      <div class="trip-card-header">
        <div class="trip-card-title">${escapeHtml(trip.name)}</div>
        <span class="badge ${trip.completed ? 'badge-completed' : 'badge-active'}">
          ${trip.completed ? '✅ Completed' : '⚡ Active'}
        </span>
      </div>
      <div class="trip-card-meta">
        <span>👥 ${memberCount} ${memberCount === 1 ? 'Member' : 'Members'}</span>
        <span>💰 Total Spent: <strong>${formatCurrency(totalExpense, curr)}</strong></span>
        <span>📅 ${formatDate(trip.createdAt)}</span>
      </div>
    </div>
    <div class="trip-card-actions">
      <button class="btn btn-primary btn-sm" onclick="openTripDashboard('${trip.id}')">📂 Open</button>
      <button class="btn btn-outline btn-sm" onclick="promptRenameTrip('${trip.id}')">✏️ Rename</button>
      <button class="btn btn-outline btn-sm" onclick="duplicateTrip('${trip.id}')">📋 Duplicate</button>
      <button class="btn btn-outline btn-sm text-danger" onclick="promptDeleteTrip('${trip.id}')">🗑️ Delete</button>
    </div>
  `;
  return card;
}

// 3. DASHBOARD RENDER
function openTripDashboard(tripId) {
  state.currentTripId = tripId;
  state.activeTab = 'members';
  switchView('dashboard');
}

function renderDashboard() {
  const trip = getCurrentTrip();
  if (!trip) {
    switchView('trips');
    return;
  }

  // Header Details
  document.getElementById('dashboard-trip-name').innerText = `📍 ${trip.name}`;
  const badge = document.getElementById('dashboard-trip-badge');
  if (trip.completed) {
    badge.className = 'badge badge-completed';
    badge.innerText = '✅ Completed';
  } else {
    badge.className = 'badge badge-active';
    badge.innerText = '⚡ Active';
  }

  // Render specific active tab
  if (state.activeTab === 'members') renderMembersTab(trip);
  else if (state.activeTab === 'expenses') renderExpensesTab(trip);
  else if (state.activeTab === 'summary') renderSummaryTab(trip);
  else if (state.activeTab === 'settlement') renderSettlementTab(trip);
  else if (state.activeTab === 'endtrip') renderEndTripTab(trip);
}

// TAB 1: MEMBERS
function renderMembersTab(trip) {
  const container = document.getElementById('members-list');
  const countEl = document.getElementById('members-count');
  container.innerHTML = '';
  countEl.innerText = trip.members.length;

  if (trip.members.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">👥</div>
        <h3>No Members Added Yet</h3>
        <p>Add friends to this trip using the input form above.</p>
      </div>
    `;
    return;
  }

  trip.members.forEach(member => {
    const card = document.createElement('div');
    card.className = 'member-card';
    card.innerHTML = `
      <div class="member-info">
        <div class="avatar-circle">${escapeHtml(member.name.charAt(0))}</div>
        <span class="member-name">${escapeHtml(member.name)}</span>
      </div>
      <div class="member-actions">
        <button class="btn btn-text btn-sm" onclick="promptEditMember('${member.id}', '${escapeHtml(member.name)}')">✏️</button>
        <button class="btn btn-text btn-sm text-danger" onclick="promptDeleteMember('${member.id}')">🗑️</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// TAB 2: EXPENSES
function renderExpensesTab(trip) {
  const container = document.getElementById('expenses-list');
  container.innerHTML = '';

  if (!trip.expenses || trip.expenses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💳</div>
        <h3>No Expenses Recorded</h3>
        <p>Click "Add Expense" to start logging group expenses.</p>
      </div>
    `;
    return;
  }

  const curr = trip.currency || state.settings.currency;

  trip.expenses.forEach(exp => {
    const card = document.createElement('div');
    card.className = 'expense-card';

    const paidByMember = trip.members.find(m => m.id === exp.paidBy);
    const paidByName = paidByMember ? paidByMember.name : 'Unknown';

    const splitNames = (exp.splitBetween || [])
      .map(id => {
        const m = trip.members.find(mem => mem.id === id);
        return m ? m.name : null;
      })
      .filter(Boolean)
      .join(', ');

    card.innerHTML = `
      <div class="expense-main">
        <div class="expense-icon-badge">💸</div>
        <div class="expense-details">
          <h4>${escapeHtml(exp.title)}</h4>
          <div class="expense-meta">
            <span>Paid by: <strong>${escapeHtml(paidByName)}</strong></span>
            <span>•</span>
            <span>Split between: ${escapeHtml(splitNames || 'None')}</span>
            ${exp.notes ? `<span>• <em>"${escapeHtml(exp.notes)}"</em></span>` : ''}
          </div>
        </div>
      </div>
      <div class="expense-right">
        <div class="expense-amount">${formatCurrency(exp.amount, curr)}</div>
        <div>
          <button class="btn btn-text btn-sm" onclick="openExpenseModal('${exp.id}')">✏️</button>
          <button class="btn btn-text btn-sm text-danger" onclick="promptDeleteExpense('${exp.id}')">🗑️</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// TAB 3: SUMMARY
function renderSummaryTab(trip) {
  const curr = trip.currency || state.settings.currency;
  const summary = calculateTripSummary(trip);

  document.getElementById('summary-total-expense').innerText = formatCurrency(summary.totalExpense, curr);
  document.getElementById('summary-per-person').innerText = formatCurrency(summary.perPersonAverage, curr);

  const container = document.getElementById('summary-members-list');
  container.innerHTML = '';

  if (trip.members.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Add members to view individual summary breakdown.</p></div>`;
    return;
  }

  trip.members.forEach(member => {
    const paid = summary.paidMap[member.id] || 0;
    const share = summary.shareMap[member.id] || 0;
    const net = summary.netBalances[member.id] || 0;

    const card = document.createElement('div');
    card.className = 'summary-member-card';

    let balanceTagHtml = '';
    if (net > 0.01) {
      balanceTagHtml = `<span class="balance-tag positive">Gets Back ${formatCurrency(net, curr)}</span>`;
    } else if (net < -0.01) {
      balanceTagHtml = `<span class="balance-tag negative">Owes ${formatCurrency(Math.abs(net), curr)}</span>`;
    } else {
      balanceTagHtml = `<span class="balance-tag neutral">Settled Up</span>`;
    }

    card.innerHTML = `
      <div class="member-info">
        <div class="avatar-circle">${escapeHtml(member.name.charAt(0))}</div>
        <div>
          <div class="member-name">${escapeHtml(member.name)}</div>
          <div class="text-sm muted">Paid: ${formatCurrency(paid, curr)} • Share: ${formatCurrency(share, curr)}</div>
        </div>
      </div>
      <div>
        ${balanceTagHtml}
      </div>
    `;
    container.appendChild(card);
  });
}

// TAB 4: SETTLEMENT
function renderSettlementTab(trip) {
  const curr = trip.currency || state.settings.currency;
  const settlements = computeSettlements(trip);

  if (!trip.settlementStatus) trip.settlementStatus = {};

  const container = document.getElementById('settlements-list');
  container.innerHTML = '';

  const totalSettlements = settlements.length;
  let completedCount = 0;

  settlements.forEach(st => {
    const isCompleted = !!trip.settlementStatus[st.id];
    if (isCompleted) completedCount++;
  });

  // Progress UI
  const progressPct = totalSettlements > 0 ? (completedCount / totalSettlements) * 100 : 0;
  document.getElementById('settlement-progress-bar').style.width = `${progressPct}%`;
  document.getElementById('settlement-progress-text').innerText = `${completedCount} of ${totalSettlements} transactions completed`;

  const banner = document.getElementById('settlement-banner');
  if (totalSettlements > 0 && completedCount === totalSettlements) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }

  if (settlements.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <h3>No Transactions Needed</h3>
        <p>Everyone is settled up or no expenses are present!</p>
      </div>
    `;
    return;
  }

  settlements.forEach(st => {
    const fromMember = trip.members.find(m => m.id === st.fromId);
    const toMember = trip.members.find(m => m.id === st.toId);
    if (!fromMember || !toMember) return;

    const isCompleted = !!trip.settlementStatus[st.id];

    const card = document.createElement('div');
    card.className = `settlement-card ${isCompleted ? 'completed' : ''}`;

    card.innerHTML = `
      <div class="settlement-main">
        <input type="checkbox" class="settlement-checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleSettlementStatus('${st.id}', this.checked)">
        <div class="settlement-text">
          <strong>${escapeHtml(fromMember.name)}</strong> → Pay <span class="settlement-amount">${formatCurrency(st.amount, curr)}</span> to <strong>${escapeHtml(toMember.name)}</strong>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// TAB 5: END TRIP
function renderEndTripTab(trip) {
  const infoEl = document.getElementById('end-trip-status-info');
  if (trip.completed) {
    infoEl.innerHTML = `<p class="badge badge-completed mb-1">Trip is Currently Completed</p>`;
    document.getElementById('btn-execute-end-trip').innerText = 'Re-open Trip';
  } else {
    infoEl.innerHTML = `<p class="badge badge-active mb-1">Trip is Currently Active</p>`;
    document.getElementById('btn-execute-end-trip').innerText = '🏁 End & Close Trip';
  }
}

// 4. STATISTICS VIEW RENDER
function renderStats() {
  const totalTrips = state.trips.length;
  const completedTrips = state.trips.filter(t => t.completed).length;
  const activeTrips = totalTrips - completedTrips;

  let totalSpent = 0;
  let maxExpenseAmount = 0;
  let mostExpensiveTripName = 'None';
  let largestGroupSize = 0;

  state.trips.forEach(trip => {
    const tripTotal = (trip.expenses || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    totalSpent += tripTotal;

    if (tripTotal > maxExpenseAmount) {
      maxExpenseAmount = tripTotal;
      mostExpensiveTripName = trip.name;
    }

    const mCount = (trip.members || []).length;
    if (mCount > largestGroupSize) {
      largestGroupSize = mCount;
    }
  });

  const avgExpense = totalTrips > 0 ? totalSpent / totalTrips : 0;

  document.getElementById('stat-total-trips').innerText = totalTrips;
  document.getElementById('stat-completed-trips').innerText = completedTrips;
  document.getElementById('stat-active-trips').innerText = activeTrips;
  document.getElementById('stat-total-spent').innerText = formatCurrency(totalSpent, state.settings.currency);
  document.getElementById('stat-avg-expense').innerText = formatCurrency(avgExpense, state.settings.currency);
  document.getElementById('stat-most-expensive').innerText = maxExpenseAmount > 0 ? `${mostExpensiveTripName} (${formatCurrency(maxExpenseAmount, state.settings.currency)})` : 'None';
  document.getElementById('stat-largest-group').innerText = largestGroupSize;

  // Chart Rendering
  const chartContainer = document.getElementById('spending-chart');
  chartContainer.innerHTML = '';

  if (totalTrips === 0) {
    chartContainer.innerHTML = `<p class="muted">No trip data available for comparison.</p>`;
    return;
  }

  const sortedBySpending = [...state.trips]
    .map(t => ({
      name: t.name,
      currency: t.currency || state.settings.currency,
      total: (t.expenses || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const maxVal = sortedBySpending[0].total || 1;

  sortedBySpending.forEach(item => {
    const barPct = Math.max((item.total / maxVal) * 100, 5);
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <div class="chart-label-group">
        <span>${escapeHtml(item.name)}</span>
        <span>${formatCurrency(item.total, item.currency)}</span>
      </div>
      <div class="chart-bar-bg">
        <div class="chart-bar-fill" style="width: ${barPct}%;"></div>
      </div>
    `;
    chartContainer.appendChild(row);
  });
}

// 5. SETTINGS VIEW RENDER
function renderSettings() {
  document.getElementById('setting-dark-mode').checked = state.settings.darkMode;
  document.getElementById('setting-currency').value = state.settings.currency;
}

// ==================================================
// ACTION HANDLERS: TRIPS
// ==================================================
function handleCreateTrip(e) {
  e.preventDefault();
  const nameInput = document.getElementById('input-trip-name');
  const currencyInput = document.getElementById('input-trip-currency');

  const tripName = nameInput.value.trim();
  if (!tripName) return;

  const newTrip = {
    id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: tripName,
    createdAt: new Date().toISOString(),
    currency: currencyInput.value || state.settings.currency,
    completed: false,
    members: [],
    expenses: [],
    settlementStatus: {}
  };

  state.trips.push(newTrip);
  saveDataToStorage();

  nameInput.value = '';
  closeModal('modal-new-trip');
  showToast(`Trip "${tripName}" created!`);

  openTripDashboard(newTrip.id);
}

function promptRenameTrip(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;
  document.getElementById('rename-trip-id-hidden').value = trip.id;
  document.getElementById('rename-trip-name-input').value = trip.name;
  openModal('modal-rename-trip');
}

function handleRenameTrip(e) {
  e.preventDefault();
  const tripId = document.getElementById('rename-trip-id-hidden').value;
  const newName = document.getElementById('rename-trip-name-input').value.trim();

  const trip = state.trips.find(t => t.id === tripId);
  if (trip && newName) {
    trip.name = newName;
    saveDataToStorage();
    closeModal('modal-rename-trip');
    showToast('Trip renamed successfully');
    renderCurrentView();
  }
}

function duplicateTrip(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;

  const dupTrip = JSON.parse(JSON.stringify(trip));
  dupTrip.id = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  dupTrip.name = `${trip.name} (Copy)`;
  dupTrip.createdAt = new Date().toISOString();
  dupTrip.completed = false;
  dupTrip.settlementStatus = {};

  state.trips.push(dupTrip);
  saveDataToStorage();
  showToast(`Duplicated "${trip.name}"`);
  renderCurrentView();
}

function promptDeleteTrip(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (!trip) return;

  openConfirmModal(
    'Delete Trip',
    `Are you sure you want to permanently delete "${trip.name}"? This action cannot be undone.`,
    () => {
      state.trips = state.trips.filter(t => t.id !== tripId);
      if (state.currentTripId === tripId) state.currentTripId = null;
      saveDataToStorage();
      showToast('Trip deleted');
      switchView('trips');
    }
  );
}

function promptEndTrip() {
  const trip = getCurrentTrip();
  if (!trip) return;

  const targetState = !trip.completed;
  const title = targetState ? 'End Trip' : 'Re-open Trip';
  const msg = targetState
    ? `Are you sure you want to mark "${trip.name}" as completed?`
    : `Do you want to re-open "${trip.name}" as an active trip?`;

  openConfirmModal(title, msg, () => {
    trip.completed = targetState;
    saveDataToStorage();
    showToast(targetState ? 'Trip marked as Completed!' : 'Trip re-opened!');
    if (targetState) switchView('trips');
    else renderDashboard();
  });
}

// ==================================================
// ACTION HANDLERS: MEMBERS
// ==================================================
function handleAddMember(e) {
  e.preventDefault();
  const trip = getCurrentTrip();
  if (!trip) return;

  const input = document.getElementById('input-member-name');
  const name = input.value.trim();

  if (!name) return;

  // Check duplicate
  const exists = trip.members.some(m => m.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    showToast('⚠️ A member with this name already exists!');
    return;
  }

  const newMember = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name
  };

  trip.members.push(newMember);
  saveDataToStorage();
  input.value = '';
  showToast(`Member "${name}" added`);
  renderDashboard();
}

function promptEditMember(memberId, currentName) {
  document.getElementById('edit-member-id-hidden').value = memberId;
  document.getElementById('edit-member-name-input').value = currentName;
  openModal('modal-edit-member');
}

function handleEditMember(e) {
  e.preventDefault();
  const trip = getCurrentTrip();
  if (!trip) return;

  const memberId = document.getElementById('edit-member-id-hidden').value;
  const newName = document.getElementById('edit-member-name-input').value.trim();

  if (!newName) return;

  const exists = trip.members.some(m => m.id !== memberId && m.name.toLowerCase() === newName.toLowerCase());
  if (exists) {
    showToast('⚠️ A member with this name already exists!');
    return;
  }

  const member = trip.members.find(m => m.id === memberId);
  if (member) {
    member.name = newName;
    saveDataToStorage();
    closeModal('modal-edit-member');
    showToast('Member updated');
    renderDashboard();
  }
}

function promptDeleteMember(memberId) {
  const trip = getCurrentTrip();
  if (!trip) return;

  const member = trip.members.find(m => m.id === memberId);
  if (!member) return;

  // Check if member is involved in expenses
  const hasPaid = trip.expenses.some(e => e.paidBy === memberId);
  const isSplit = trip.expenses.some(e => (e.splitBetween || []).includes(memberId));

  if (hasPaid || isSplit) {
    showToast('⚠️ Cannot delete member who is part of expenses. Remove or edit expenses first.');
    return;
  }

  openConfirmModal(
    'Delete Member',
    `Remove "${member.name}" from this trip?`,
    () => {
      trip.members = trip.members.filter(m => m.id !== memberId);
      saveDataToStorage();
      showToast('Member removed');
      renderDashboard();
    }
  );
}

// ==================================================
// ACTION HANDLERS: EXPENSES
// ==================================================
function openExpenseModal(expenseId = null) {
  const trip = getCurrentTrip();
  if (!trip) return;

  if (trip.members.length === 0) {
    showToast('⚠️ Please add members to the trip first!');
    switchDashboardTab('members');
    return;
  }

  const form = document.getElementById('form-expense');
  form.reset();

  const paidBySelect = document.getElementById('expense-paidby-select');
  const checkboxesContainer = document.getElementById('expense-split-checkboxes');

  paidBySelect.innerHTML = '';
  checkboxesContainer.innerHTML = '';

  // Populate Paid By Dropdown
  trip.members.forEach(mem => {
    const opt = document.createElement('option');
    opt.value = mem.id;
    opt.innerText = mem.name;
    paidBySelect.appendChild(opt);
  });

  // Populate Split Checkboxes
  trip.members.forEach(mem => {
    const label = document.createElement('label');
    label.className = 'checkbox-item';
    label.innerHTML = `
      <input type="checkbox" value="${mem.id}" checked>
      <span>${escapeHtml(mem.name)}</span>
    `;
    checkboxesContainer.appendChild(label);
  });

  if (expenseId) {
    // Editing existing
    const exp = trip.expenses.find(e => e.id === expenseId);
    if (exp) {
      document.getElementById('modal-expense-title').innerText = '✏️ Edit Expense';
      document.getElementById('expense-id-hidden').value = exp.id;
      document.getElementById('expense-title-input').value = exp.title;
      document.getElementById('expense-amount-input').value = exp.amount;
      paidBySelect.value = exp.paidBy;
      document.getElementById('expense-notes-input').value = exp.notes || '';

      // Set checkboxes
      document.querySelectorAll('#expense-split-checkboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = (exp.splitBetween || []).includes(cb.value);
      });
    }
  } else {
    document.getElementById('modal-expense-title').innerText = '💰 Add Expense';
    document.getElementById('expense-id-hidden').value = '';
  }

  openModal('modal-expense');
}

function handleSaveExpense(e) {
  e.preventDefault();
  const trip = getCurrentTrip();
  if (!trip) return;

  const expenseId = document.getElementById('expense-id-hidden').value;
  const title = document.getElementById('expense-title-input').value.trim();
  const amount = parseFloat(document.getElementById('expense-amount-input').value);
  const paidBy = document.getElementById('expense-paidby-select').value;
  const notes = document.getElementById('expense-notes-input').value.trim();

  const selectedSplit = [];
  document.querySelectorAll('#expense-split-checkboxes input[type="checkbox"]:checked').forEach(cb => {
    selectedSplit.push(cb.value);
  });

  if (!title || isNaN(amount) || amount <= 0) {
    showToast('⚠️ Please enter a valid title and amount.');
    return;
  }

  if (selectedSplit.length === 0) {
    showToast('⚠️ Please select at least one member to split with.');
    return;
  }

  if (expenseId) {
    // Edit
    const exp = trip.expenses.find(e => e.id === expenseId);
    if (exp) {
      exp.title = title;
      exp.amount = amount;
      exp.paidBy = paidBy;
      exp.splitBetween = selectedSplit;
      exp.notes = notes;
      showToast('Expense updated');
    }
  } else {
    // Add new
    const newExpense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      amount,
      paidBy,
      splitBetween: selectedSplit,
      date: new Date().toISOString().split('T')[0],
      notes
    };
    if (!trip.expenses) trip.expenses = [];
    trip.expenses.push(newExpense);
    showToast('Expense added');
  }

  saveDataToStorage();
  closeModal('modal-expense');
  renderDashboard();
}

function promptDeleteExpense(expenseId) {
  const trip = getCurrentTrip();
  if (!trip) return;

  openConfirmModal(
    'Delete Expense',
    'Are you sure you want to delete this expense record?',
    () => {
      trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
      saveDataToStorage();
      showToast('Expense deleted');
      renderDashboard();
    }
  );
}

// ==================================================
// CALCULATIONS & ALGORITHMS
// ==================================================
function calculateTripSummary(trip) {
  const totalExpense = (trip.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const memberCount = trip.members.length;
  const perPersonAverage = memberCount > 0 ? totalExpense / memberCount : 0;

  const paidMap = {};
  const shareMap = {};
  const netBalances = {};

  trip.members.forEach(m => {
    paidMap[m.id] = 0;
    shareMap[m.id] = 0;
    netBalances[m.id] = 0;
  });

  (trip.expenses || []).forEach(exp => {
    const amt = parseFloat(exp.amount || 0);
    if (paidMap[exp.paidBy] !== undefined) {
      paidMap[exp.paidBy] += amt;
    }

    const splitList = exp.splitBetween || [];
    if (splitList.length > 0) {
      const perShare = amt / splitList.length;
      splitList.forEach(mId => {
        if (shareMap[mId] !== undefined) {
          shareMap[mId] += perShare;
        }
      });
    }
  });

  trip.members.forEach(m => {
    netBalances[m.id] = (paidMap[m.id] || 0) - (shareMap[m.id] || 0);
  });

  return {
    totalExpense,
    perPersonAverage,
    paidMap,
    shareMap,
    netBalances
  };
}

function computeSettlements(trip) {
  const summary = calculateTripSummary(trip);
  const netBalances = summary.netBalances;

  let debtors = [];
  let creditors = [];

  for (const mId in netBalances) {
    const bal = Math.round(netBalances[mId] * 100) / 100;
    if (bal < -0.01) {
      debtors.push({ memberId: mId, amount: Math.abs(bal) });
    } else if (bal > 0.01) {
      creditors.push({ memberId: mId, amount: bal });
    }
  }

  // Greedy Minimum Transactions Algorithm
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      transactions.push({
        id: `settle_${debtor.memberId}_${creditor.memberId}_${amount.toFixed(2)}`,
        fromId: debtor.memberId,
        toId: creditor.memberId,
        amount: Math.round(amount * 100) / 100
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}

function toggleSettlementStatus(settlementId, isChecked) {
  const trip = getCurrentTrip();
  if (!trip) return;

  if (!trip.settlementStatus) trip.settlementStatus = {};
  trip.settlementStatus[settlementId] = isChecked;

  saveDataToStorage();
  renderSettlementTab(trip);
}

// ==================================================
// SETTINGS & BACKUP HANDLERS
// ==================================================
function applySettings() {
  if (state.settings.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

function toggleDarkMode() {
  state.settings.darkMode = !state.settings.darkMode;
  applySettings();
  saveDataToStorage();
  const settingsCb = document.getElementById('setting-dark-mode');
  if (settingsCb) settingsCb.checked = state.settings.darkMode;
}

function exportBackupJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `splitter_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Backup JSON exported!');
}

function importBackupJSON(e) {
  const fileReader = new FileReader();
  fileReader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      if (importedData && Array.isArray(importedData.trips)) {
        state.trips = importedData.trips;
        if (importedData.settings) state.settings = importedData.settings;
        saveDataToStorage();
        applySettings();
        showToast('Data successfully imported!');
        switchView('trips');
      } else {
        showToast('⚠️ Invalid backup file format!');
      }
    } catch (err) {
      showToast('⚠️ Failed to parse backup file');
    }
  };
  if (e.target.files[0]) {
    fileReader.readAsText(e.target.files[0]);
  }
}

function promptClearAllData() {
  openConfirmModal(
    'Clear All Data',
    'Are you completely sure? This will delete ALL saved trips, members, and expenses permanently.',
    () => {
      state.trips = [];
      state.currentTripId = null;
      saveDataToStorage();
      showToast('All local data cleared');
      switchView('home');
    }
  );
}

// ==================================================
// UTILITY FUNCTIONS & MODALS
// ==================================================
function renderCurrentView() {
  const activeView = document.querySelector('.view.active');
  const viewId = activeView ? activeView.id.replace('view-', '') : 'home';
  switchView(viewId);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function openConfirmModal(title, message, callback) {
  document.getElementById('confirm-modal-title').innerText = title;
  document.getElementById('confirm-modal-message').innerText = message;
  confirmActionCallback = callback;
  openModal('modal-confirm');
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function formatCurrency(amount, symbol = '₹') {
  const formatted = parseFloat(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${symbol}${formatted}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
