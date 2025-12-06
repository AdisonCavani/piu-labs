export function getRandomColor() {
  const colors = [
    "#E05151",
    "#F05057",
    "#FFB84D",
    "#E88784",
    "#B0B0B0",
    "#4FC18C",
    "#36A5F4",
    "#00CED1",
    "#6C7AE0",
    "#C85FEF",
    "#F06292",
    "#FFD600",
    "#81D86E",
    "#4FD9B5",
    "#33D6D6",
    "#C461E0",
    "#FFF233",
    "#BFC1B0",
    "#9DA3AC",
    "#A3A3A3",
    "#F2984D",
    "#F09A00",
    "#F6E030",
    "#FAF500",
    "#D9736A",
    "#45B0F0",
    "#00CFC4",
    "#6BE7A7",
    "#B15BDE",
    "#F46B60",
  ];

  const idx = Math.floor(Math.random() * colors.length);
  return colors[idx];
}
