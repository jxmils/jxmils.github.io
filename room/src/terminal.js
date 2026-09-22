import { resolveCommand, completeCommand } from './terminal-commands.js';

for (const shell of document.querySelectorAll('[data-terminal-shell]')) {
  const toggle = shell.querySelector('[data-view-toggle]');
  const regular = shell.querySelector('[data-regular-view]');
  const terminal = shell.querySelector('[data-terminal-view]');
  const output = shell.querySelector('[data-terminal-output]');
  const form = shell.querySelector('[data-terminal-form]');
  const input = form.querySelector('input');
  const history = [];
  let historyIndex = 0, draft = '';
  const sections = [...regular.querySelectorAll('.portfolio-panel')];
  const sectionFor = id => sections.find(section => section.id === id || section.id === `portfolio-${id}`);
  const textOf = element => {
    if (!element) return '';
    const copy = element.cloneNode(true);
    copy.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return copy.textContent.replace(/[ \t]+/g, ' ').trim();
  };
  // Read the same authored content as the regular portfolio; no second CV to maintain.
  const sectionText = id => {
    const section = sectionFor(id);
    const selector = id === 'experience' ? '.career-row' : id === 'education' ? '.education-list article, .personal-note' :
      id === 'projects' ? '.project-grid article' : id === 'skills' ? '.toolkit > div' :
      id === 'research' ? '.section-intro, .research-rows article, .research-note, .personal-note' :
      id === 'contact' ? '.section-intro, .contact-list a, .contact-foot' : '.hero-copy, .about-note';
    return [...(id === 'skills' ? sectionFor('projects') : section)?.querySelectorAll(selector) || []]
      .map(block => [...block.querySelectorAll('h1,h2,h3,p,small,strong,dt,dd,.career-date')].map(textOf).filter(Boolean).join('\n') || (block.children.length ? [...block.children].map(textOf).join('\n') : textOf(block))).join('\n\n');
  };
  function append(text, kind = 'response') {
    const block = document.createElement('div');
    block.className = `terminal-${kind}`;
    block.textContent = text;
    output.append(block);
    // Bound DOM/memory use even during a long visit.
    while (output.children.length > 80) output.firstElementChild.remove();
    terminal.scrollTop = terminal.scrollHeight;
  }
  function setView(isTerminal) {
    terminal.hidden = !isTerminal;
    regular.hidden = isTerminal;
    shell.classList.toggle('terminal-mode', isTerminal);
    toggle.textContent = isTerminal ? 'Regular view' : 'Terminal';
    toggle.setAttribute('aria-pressed', String(isTerminal));
    shell.querySelector('.dock')?.setAttribute('inert', '');
    if (!isTerminal) shell.querySelector('.dock')?.removeAttribute('inert');
    if (isTerminal) input.focus({ preventScroll: true });
    else toggle.focus({ preventScroll: true });
  }
  function run(raw) {
    const result = resolveCommand(raw);
    if (result.type === 'empty') return;
    history.push(raw); if (history.length > 100) history.shift(); historyIndex = history.length; draft = '';
    input.value = '';
    if (result.type === 'clear') { output.replaceChildren(); input.focus(); return; }
    append(`jason@oxford:~$ ${raw}`, 'command');
    if (result.type === 'regular') { setView(false); return; }
    if (result.type === 'help') append('Explore\n  about        My background\n  research     AI systems at Oxford\n  experience   Research & engineering roles\n  education    Where I’ve studied\n  projects     Selected work\n  skills       Languages & tools\n  contact      Get in touch\n  links        GitHub, LinkedIn & email\n\nNavigate\n  clear        Clear the terminal\n  regular      Return to the regular view\n\nTab completes commands · ↑ ↓ recall history · whoami also works.');
    else if (result.type === 'links') {
      append('Find me elsewhere');
      const links = document.createElement('div'); links.className = 'terminal-links';
      sectionFor('contact').querySelectorAll('.contact-list a').forEach(source => {
        const a = document.createElement('a'); a.href = source.href;
        a.textContent = textOf(source.querySelector('strong'));
        if (source.target) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        links.append(a);
      }); output.append(links);
    } else if (result.type === 'unknown') append(result.message, 'error');
    else append(sectionText(result.type));
    input.focus({ preventScroll: true });
    terminal.scrollTop = terminal.scrollHeight;
  }
  toggle.addEventListener('click', () => setView(terminal.hidden));
  form.addEventListener('submit', event => { event.preventDefault(); run(input.value); });
  terminal.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => run(button.dataset.command)));
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === history.length) draft = input.value;
      historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = historyIndex === history.length ? draft : history[historyIndex];
    } else if (event.key === 'Tab' && input.value.trim()) {
      const matches = completeCommand(input.value);
      if (matches.length) { event.preventDefault(); if (matches.length === 1) input.value = matches[0]; else append(matches.join('   ')); }
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault(); output.replaceChildren();
    }
  });
}
