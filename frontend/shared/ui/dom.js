export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function renderEmptyState(container, title, message, action = null) {
  container.innerHTML = '';
  container.classList.remove('hidden');

  const titleEl = el('div', 'empty-state-title', title);
  const copyEl = el('p', 'empty-state-copy', message);
  container.appendChild(titleEl);
  container.appendChild(copyEl);

  if (action?.text) {
    const button = el('button', 'secondary-button', action.text);
    button.type = 'button';
    button.dataset.action = action.type;
    if (action.targetTab) {
      button.dataset.targetTab = action.targetTab;
    }
    container.appendChild(button);
  }
}
