// Component Loader
async function loadComponent(elementId, componentPath) {
  try {
    const response = await fetch(componentPath);
    const html = await response.text();
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
    }
  } catch (error) {
    console.error(`Error loading component ${componentPath}:`, error);
  }
}

// Load sidebar and header on page load
document.addEventListener('DOMContentLoaded', () => {
  // Load components if containers exist
  if (document.getElementById('sidebar-container')) {
    loadComponent('sidebar-container', '/components/sidebar.html');
  }
  if (document.getElementById('header-container')) {
    loadComponent('header-container', '/components/header.html');
  }
  
  // Set active nav item based on current page
  setTimeout(() => {
    setActiveNavItem();
  }, 100);
});

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
