// Component Loader
async function loadComponent(elementId, componentPath) {
  try {
    const response = await fetch(componentPath);
    const html = await response.text();
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
    }
    return Promise.resolve();
  } catch (error) {
    console.error(`Error loading component ${componentPath}:`, error);
    return Promise.reject(error);
  }
}

// Load sidebar and header on page load
document.addEventListener('DOMContentLoaded', () => {
  // Load components if containers exist
  if (document.getElementById('sidebar-container')) {
    loadComponent('sidebar-container', '/components/sidebar.html').then(() => {
      initializeSidebar();
    });
  }
  if (document.getElementById('header-container')) {
    loadComponent('header-container', '/components/header.html');
  }
  
  // Set active nav item based on current page
  setTimeout(() => {
    setActiveNavItem();
  }, 100);
});

// Initialize sidebar functionality
function initializeSidebar() {
  // Get stored section states or use defaults
  const sectionStates = JSON.parse(localStorage.getItem('sidebarSections')) || {
    employees: false,
    management: true,
    payments: false,
    compliance: false,
    'chat-messaging': false,
    settings: false
  };

  // Apply initial states
  Object.keys(sectionStates).forEach(section => {
    const content = document.querySelector(`.section-content[data-section="${section}"]`);
    const toggle = document.querySelector(`.section-toggle[data-section="${section}"]`);
    const chevron = toggle?.querySelector('.chevron');
    
    if (content) {
      if (sectionStates[section]) {
        content.style.display = 'block';
        chevron?.classList.remove('rotate-180');
      } else {
        content.style.display = 'none';
        chevron?.classList.add('rotate-180');
      }
    }
  });

  // Add click handlers to section toggles
  const sectionToggles = document.querySelectorAll('.section-toggle');
  sectionToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const section = toggle.getAttribute('data-section');
      const content = document.querySelector(`.section-content[data-section="${section}"]`);
      const chevron = toggle.querySelector('.chevron');
      
      if (content) {
        const isHidden = content.style.display === 'none';
        
        if (isHidden) {
          content.style.display = 'block';
          chevron.classList.remove('rotate-180');
          sectionStates[section] = true;
        } else {
          content.style.display = 'none';
          chevron.classList.add('rotate-180');
          sectionStates[section] = false;
        }
        
        // Save state to localStorage
        localStorage.setItem('sidebarSections', JSON.stringify(sectionStates));
      }
    });
  });
}

// Set active navigation item
function setActiveNavItem() {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href') === currentPath || 
        currentPath.includes(item.getAttribute('href'))) {
      item.classList.add('active');
    }
  });
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.closest('.modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
});

// Export functions for use in pages
window.loadComponent = loadComponent;
window.openModal = openModal;
window.closeModal = closeModal;