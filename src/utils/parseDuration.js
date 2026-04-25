const unitMap = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function parseDuration(str) {
  const match = str.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) throw new Error("Invalid duration format");

  const [, value, unit] = match;
  return Number(value) * unitMap[unit];
}

export default parseDuration;
