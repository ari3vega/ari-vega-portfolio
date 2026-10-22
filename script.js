'use strict';

// A custom theme class is shared across pages. Storage failures do not break buttons.
const themeButton = document.getElementById('theme-toggle');
function applyTheme(dark) {
  document.body.classList.toggle('dark-mode', dark);
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.textContent = dark ? 'Light mode' : 'Dark mode';
}
let savedTheme = 'light';
try {
  savedTheme = localStorage.getItem('ari-portfolio-theme') || 'light';
} catch {
  // The theme still works if the browser restricts local storage.
}
applyTheme(savedTheme === 'dark');
themeButton.addEventListener('click', () => {
  const dark = !document.body.classList.contains('dark-mode');
  applyTheme(dark);
  try {
    localStorage.setItem('ari-portfolio-theme', dark ? 'dark' : 'light');
  } catch {
    // Continue using the selected theme for this page.
  }
});

// Only the Projects page has these elements; other pages need no JSON request.
const projectGrid = document.getElementById('project-grid');
if (projectGrid) {
  const filterButtons = document.querySelectorAll('[data-category]');
  const searchInput = document.getElementById('project-search');
  const status = document.getElementById('project-status');
  let projects = [];
  let selectedCategory = 'All';
  let loaded = false;

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function renderProjects() {
    if (!loaded) return;
    const query = searchInput.value.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
      const searchable = [project.title, project.description, project.category, ...project.technologies].join(' ').toLowerCase();
      return matchesCategory && searchable.includes(query);
    });
    projectGrid.replaceChildren();
    filtered.forEach((project) => {
      const column = makeElement('div', 'col-md-6 col-lg-4');
      const card = makeElement('article', 'card project-card h-100');
      const category = makeElement('div', 'project-category');
      category.append(makeElement('span', '', project.category), makeElement('span', '', project.status));
      const body = makeElement('div', 'card-body');
      body.append(makeElement('h2', 'card-title', project.title), makeElement('p', 'card-text', project.description));
      const technologies = makeElement('div', 'project-technologies');
      project.technologies.forEach((technology) => {
        technologies.append(makeElement('span', 'badge skill-badge', technology));
      });
      body.append(technologies);
      card.append(category, body);
      column.append(card);
      projectGrid.append(column);
    });
    status.textContent = filtered.length ? `Showing ${filtered.length} of ${projects.length} projects.` : 'No matching projects. Try another category or search term.';
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedCategory = button.dataset.category;
      filterButtons.forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle('active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      renderProjects();
    });
  });
  searchInput.addEventListener('input', renderProjects);

  async function loadProjects() {
    try {
      const response = await fetch('projects.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || !data.every((project) =>
        typeof project.title === 'string' && typeof project.description === 'string' &&
        typeof project.category === 'string' && typeof project.status === 'string' &&
        Array.isArray(project.technologies) && project.technologies.every((item) => typeof item === 'string')
      )) throw new Error('Invalid project data');
      projects = data;
      loaded = true;
      renderProjects();
    } catch {
      status.textContent = 'Projects could not load. Run this folder with Live Server or a local HTTP server, then refresh the page.';
      status.classList.add('alert', 'alert-warning');
    }
  }
  loadProjects();
}
