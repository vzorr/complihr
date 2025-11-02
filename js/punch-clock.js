// Punch Clock JavaScript
// State management
let currentUser = {
  id: 1,
  name: 'Robert Allen',
  employeeId: 'EMP001'
};

let punchState = {
  isClockedIn: false,
  todayClockIn: null,
  todayClockOut: null,
  todayPunches: []
};

let punchHistory = [];
let currentPage = 1;
let recordsPerPage = 10;
let filterDays = 7;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializePunchClock();
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  loadPunchData();
  updateUI();
});

// Initialize punch clock
function initializePunchClock() {
  // Load state from localStorage
  const savedState = localStorage.getItem('punchState');
  if (savedState) {
    punchState = JSON.parse(savedState);
  }

  // Load history from localStorage
  const savedHistory = localStorage.getItem('punchHistory');
  if (savedHistory) {
    punchHistory = JSON.parse(savedHistory);
  } else {
    // Generate sample history data
    generateSampleHistory();
  }
}

// Update current time display
function updateCurrentTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const dateString = now.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  document.getElementById('current-time').textContent = timeString;
  document.getElementById('current-date').textContent = dateString;
}

// Punch In function
function punchIn() {
  const now = new Date();
  
  punchState.isClockedIn = true;
  punchState.todayClockIn = now.toISOString();
  punchState.todayPunches.push({
    type: 'in',
    time: now.toISOString(),
    timestamp: now.getTime()
  });

  // Save to localStorage
  localStorage.setItem('punchState', JSON.stringify(punchState));

  // Add to history if first punch of the day
  addTodayToHistory();

  // Show success notification
  showNotification('Clocked In Successfully', 'success');

  updateUI();
}

// Punch Out function
function punchOut() {
  const now = new Date();
  
  punchState.isClockedIn = false;
  punchState.todayClockOut = now.toISOString();
  punchState.todayPunches.push({
    type: 'out',
    time: now.toISOString(),
    timestamp: now.getTime()
  });

  // Save to localStorage
  localStorage.setItem('punchState', JSON.stringify(punchState));

  // Update history
  updateTodayInHistory();

  // Show success notification
  showNotification('Clocked Out Successfully', 'success');

  updateUI();
}

// Update UI based on current state
function updateUI() {
  const punchInBtn = document.getElementById('punch-in-btn');
  const punchOutBtn = document.getElementById('punch-out-btn');
  const statusEl = document.getElementById('punch-status');
  const lastPunchEl = document.getElementById('last-punch-time');

  if (punchState.isClockedIn) {
    // Clocked In state
    punchInBtn.disabled = true;
    punchInBtn.classList.add('opacity-50', 'cursor-not-allowed');
    punchOutBtn.disabled = false;
    punchOutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    
    statusEl.innerHTML = `
      <span class="inline-flex items-center">
        <span class="status-dot status-dot-success mr-2"></span>
        Clocked In
      </span>
    `;
    
    if (punchState.todayClockIn) {
      const clockInTime = new Date(punchState.todayClockIn);
      lastPunchEl.textContent = `Clocked in at ${formatTime(clockInTime)}`;
    }
  } else {
    // Clocked Out state
    punchInBtn.disabled = false;
    punchInBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    punchOutBtn.disabled = true;
    punchOutBtn.classList.add('opacity-50', 'cursor-not-allowed');
    
    statusEl.innerHTML = `
      <span class="inline-flex items-center">
        <span class="status-dot status-dot-error mr-2"></span>
        Clocked Out
      </span>
    `;
    
    if (punchState.todayClockOut) {
      const clockOutTime = new Date(punchState.todayClockOut);
      lastPunchEl.textContent = `Clocked out at ${formatTime(clockOutTime)}`;
    } else {
      lastPunchEl.textContent = 'No punches today';
    }
  }

  // Update today's summary
  updateTodaySummary();
  
  // Update today's punches list
  updateTodayPunchesList();
  
  // Update history table
  updateHistoryTable();
}

// Update today's summary
function updateTodaySummary() {
  const clockInEl = document.getElementById('today-clock-in');
  const clockOutEl = document.getElementById('today-clock-out');
  const totalHoursEl = document.getElementById('today-total-hours');

  if (punchState.todayClockIn) {
    const clockIn = new Date(punchState.todayClockIn);
    clockInEl.textContent = formatTime(clockIn);
  } else {
    clockInEl.textContent = '--:--';
  }

  if (punchState.todayClockOut) {
    const clockOut = new Date(punchState.todayClockOut);
    clockOutEl.textContent = formatTime(clockOut);
  } else {
    clockOutEl.textContent = punchState.isClockedIn ? 'In Progress' : '--:--';
  }

  // Calculate total hours
  if (punchState.todayClockIn) {
    const clockIn = new Date(punchState.todayClockIn);
    const clockOut = punchState.todayClockOut ? new Date(punchState.todayClockOut) : new Date();
    const diff = clockOut - clockIn;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    totalHoursEl.textContent = `${hours}h ${minutes}m`;
  } else {
    totalHoursEl.textContent = '0h 0m';
  }
}

// Update today's punches list
function updateTodayPunchesList() {
  const listEl = document.getElementById('today-punches-list');
  const countEl = document.getElementById('today-punches-count');

  if (punchState.todayPunches.length === 0) {
    listEl.innerHTML = '<div class="text-center py-8 text-gray-500">No punches recorded today</div>';
    countEl.textContent = '0 punches';
    return;
  }

  countEl.textContent = `${punchState.todayPunches.length} punch${punchState.todayPunches.length > 1 ? 'es' : ''}`;

  const punchesHTML = punchState.todayPunches
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(punch => {
      const time = new Date(punch.time);
      const isPunchIn = punch.type === 'in';
      return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center ${isPunchIn ? 'bg-success-100' : 'bg-error-100'}">
              <svg class="w-5 h-5 ${isPunchIn ? 'text-success-600' : 'text-error-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${isPunchIn 
                  ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>'
                  : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>'
                }
              </svg>
            </div>
            <div class="ml-3">
              <div class="text-sm font-medium text-gray-900">${isPunchIn ? 'Clock In' : 'Clock Out'}</div>
              <div class="text-xs text-gray-500">${formatTime(time)}</div>
            </div>
          </div>
          <div class="badge ${isPunchIn ? 'badge-success' : 'badge-error'}">
            ${isPunchIn ? 'In' : 'Out'}
          </div>
        </div>
      `;
    }).join('');

  listEl.innerHTML = punchesHTML;
}

// Update history table
function updateHistoryTable() {
  const tbody = document.getElementById('punch-history-tbody');
  
  // Filter history by selected days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - filterDays);
  
  const filteredHistory = punchHistory.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= cutoffDate;
  });

  // Pagination
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  if (paginatedHistory.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8 text-gray-500">No punch records found</td>
      </tr>
    `;
  } else {
    tbody.innerHTML = paginatedHistory.map(record => {
      const totalHours = calculateTotalHours(record.clockIn, record.clockOut);
      const status = record.clockOut ? 'Complete' : 'In Progress';
      
      return `
        <tr class="table-row">
          <td class="table-cell">
            <div class="font-medium">${formatDate(new Date(record.date))}</div>
          </td>
          <td class="table-cell">${record.clockIn ? formatTime(new Date(record.clockIn)) : '--:--'}</td>
          <td class="table-cell">${record.clockOut ? formatTime(new Date(record.clockOut)) : '--:--'}</td>
          <td class="table-cell font-medium text-primary-600">${totalHours}</td>
          <td class="table-cell">
            <span class="badge ${record.clockOut ? 'badge-success' : 'badge-warning'}">
              ${status}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update pagination info
  document.getElementById('showing-from').textContent = filteredHistory.length > 0 ? startIndex + 1 : 0;
  document.getElementById('showing-to').textContent = Math.min(endIndex, filteredHistory.length);
  document.getElementById('total-records').textContent = filteredHistory.length;

  // Update pagination buttons
  document.getElementById('prev-btn').disabled = currentPage === 1;
  document.getElementById('next-btn').disabled = endIndex >= filteredHistory.length;
}

// Add today's record to history
function addTodayToHistory() {
  const today = new Date().toDateString();
  const existingRecord = punchHistory.find(record => new Date(record.date).toDateString() === today);
  
  if (!existingRecord) {
    punchHistory.unshift({
      date: new Date().toISOString(),
      clockIn: punchState.todayClockIn,
      clockOut: null,
      employeeId: currentUser.employeeId,
      employeeName: currentUser.name
    });
    localStorage.setItem('punchHistory', JSON.stringify(punchHistory));
  }
}

// Update today's record in history
function updateTodayInHistory() {
  const today = new Date().toDateString();
  const recordIndex = punchHistory.findIndex(record => new Date(record.date).toDateString() === today);
  
  if (recordIndex !== -1) {
    punchHistory[recordIndex].clockOut = punchState.todayClockOut;
    localStorage.setItem('punchHistory', JSON.stringify(punchHistory));
  }
}

// Load punch data (check if already clocked in today)
function loadPunchData() {
  const today = new Date().toDateString();
  const todayRecord = punchHistory.find(record => new Date(record.date).toDateString() === today);
  
  if (todayRecord && !todayRecord.clockOut) {
    // Already clocked in today
    punchState.isClockedIn = true;
    punchState.todayClockIn = todayRecord.clockIn;
  }
}

// Filter history
function filterHistory() {
  const select = document.getElementById('history-filter');
  filterDays = parseInt(select.value);
  currentPage = 1;
  updateHistoryTable();
}

// Pagination functions
function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    updateHistoryTable();
  }
}

function nextPage() {
  currentPage++;
  updateHistoryTable();
}

// Helper functions
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function calculateTotalHours(clockIn, clockOut) {
  if (!clockIn) return '0h 0m';
  
  const start = new Date(clockIn);
  const end = clockOut ? new Date(clockOut) : new Date();
  const diff = end - start;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

function showNotification(message, type) {
  // You can integrate with your existing notification system
  alert(message);
}

// Generate sample history data
function generateSampleHistory() {
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const clockIn = new Date(date);
    clockIn.setHours(9, Math.floor(Math.random() * 15), 0);
    
    const clockOut = new Date(date);
    clockOut.setHours(17, Math.floor(Math.random() * 60), 0);
    
    punchHistory.push({
      date: date.toISOString(),
      clockIn: clockIn.toISOString(),
      clockOut: clockOut.toISOString(),
      employeeId: currentUser.employeeId,
      employeeName: currentUser.name
    });
  }
  
  localStorage.setItem('punchHistory', JSON.stringify(punchHistory));
}