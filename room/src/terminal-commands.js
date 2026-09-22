export const commands = ['help', 'about', 'research', 'experience', 'education', 'projects', 'skills', 'contact', 'links', 'clear', 'regular'];
const aliases = { whoami: 'about', bio: 'about', work: 'experience', cv: 'experience', ls: 'help', exit: 'regular', gui: 'regular' };
export function resolveCommand(raw) {
  const value = raw.trim().toLowerCase();
  if (!value) return { type: 'empty' };
  const command = aliases[value] || value;
  if (commands.includes(command)) return { type: command };
  return { type: 'unknown', message: `Command not found: ${raw.trim()}. Type help to see what you can explore.` };
}
export function completeCommand(raw) {
  const prefix = raw.trim().toLowerCase();
  if (!prefix) return [];
  return commands.filter(command => command.startsWith(prefix));
}
