export const BADGES = [
  { id: 'first-brew', label: 'First Brew', description: 'Log your first brew.', emoji: '☕', category: 'milestone' },
  { id: 'five-brews', label: 'On A Roll', description: 'Track 5 brews.', emoji: '🔥', category: 'milestone' },
  { id: 'ten-brews', label: 'Dedicated Brewer', description: 'Track 10 brews.', emoji: '🏆', category: 'milestone' },
  { id: 'three-types', label: 'Explorer', description: 'Try 3 beverage types.', emoji: '🎨', category: 'variety' },
  { id: 'all-types', label: 'Full Menu', description: 'Try every beverage type.', emoji: '🌈', category: 'variety' },
  { id: 'first-favourite', label: 'Favourite Pick', description: 'Mark a brew as favourite.', emoji: '❤️', category: 'engagement' },
  { id: 'high-rating', label: 'Five Star Sip', description: 'Give a brew 5 stars.', emoji: '⭐', category: 'rating' },
  { id: 'consistent-rating', label: 'Quality Control', description: 'Have 3 brews rated 4 or higher.', emoji: '👌', category: 'rating' },
];

export function getEarnedBadges(brews = []) {
  const earned = [];
  const typeSet = new Set(brews.map((brew) => brew.type).filter(Boolean));
  const highRated = brews.filter((brew) => Number(brew.rating) >= 4).length;

  if (brews.length >= 1) earned.push(findBadge('first-brew'));
  if (brews.length >= 5) earned.push(findBadge('five-brews'));
  if (brews.length >= 10) earned.push(findBadge('ten-brews'));
  if (typeSet.size >= 3) earned.push(findBadge('three-types'));
  if (['Coffee', 'Tea', 'Matcha', 'Juice', 'Other'].every((type) => typeSet.has(type))) earned.push(findBadge('all-types'));
  if (brews.some((brew) => brew.is_favourite)) earned.push(findBadge('first-favourite'));
  if (brews.some((brew) => Number(brew.rating) === 5)) earned.push(findBadge('high-rating'));
  if (highRated >= 3) earned.push(findBadge('consistent-rating'));

  return earned.filter(Boolean);
}

function findBadge(id) {
  return BADGES.find((badge) => badge.id === id);
}
