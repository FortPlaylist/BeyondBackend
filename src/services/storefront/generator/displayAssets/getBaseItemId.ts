export function getBaseItemId(fullItemId: string): string {
  const prefixesToRemove = [
    "AthenaCharacter",
    "AthenaGlider",
    "AthenaPickaxe",
    "AthenaItemWrap",
    "AthenaDance",
  ];

  for (const prefix of prefixesToRemove) {
    if (fullItemId.includes(prefix)) {
      return fullItemId.replace(`${prefix}:`, "");
    }
  }

  return fullItemId;
}
