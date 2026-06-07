// 1. 确保正确导出 BADGES 数组
export const BADGES = [
  { id: 'first_brew', name: 'First Drop', icon: '💧', description: 'Log your first coffee brew.' },
  { id: 'pourover_master', name: 'Pour Over Pro', icon: '☕', description: 'Log 5 pour over recipes.' },
  { id: 'top_rated', name: 'Perfect Cup', icon: '⭐', description: 'Brew a 5-star rated coffee.' },
  { id: 'espresso_lover', name: 'Espresso Fan', icon: '⚡', description: 'Log an espresso shot.' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', description: 'Log a brew after 8 PM.' },
  { id: 'dedicated', name: 'Dedicated Brewer', icon: '🔥', description: 'Log 10 total brews.' }
];

// 2. 确保正确导出逻辑计算函数
export function getEarnedBadges(brews = []) {
  const earned = [];
  if (!brews || brews.length === 0) return earned;

  const totalBrews = brews.length;

  if (totalBrews >= 1) earned.push('first_brew');
  if (totalBrews >= 10) earned.push('dedicated');

  const pourOvers = brews.filter(b => b.type === 'pourover' || b.method === 'V60');
  if (pourOvers.length >= 5) earned.push('pourover_master');

  const hasFiveStar = brews.some(b => b.rating >= 5);
  if (hasFiveStar) earned.push('top_rated');

  const hasEspresso = brews.some(b => b.type === 'espresso' || b.method === 'Espresso');
  if (hasEspresso) earned.push('espresso_lover');

  return earned;
}