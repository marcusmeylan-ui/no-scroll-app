const fs = require("fs");

const path = "style.css";
let css = fs.readFileSync(path, "utf8");

css = css.replace(
  '--font-ui: "DM Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;-serif;',
  '--font-ui: "DM Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;'
);

const duplicateBlock = `/* ===== Mobile rating button fix ===== */

@media (max-width: 640px) {
  .stacked-rating-row.taste-rating-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    max-width: 100%;
  }

  .taste-rating-btn {
    width: 100%;
    min-height: 48px;
    justify-content: center;
    text-align: center;
    white-space: normal;
  }
}
`;

let removed = 0;
while (css.includes(duplicateBlock)) {
  css = css.replace(duplicateBlock, "");
  removed += 1;
}

fs.writeFileSync(path, css);

const opens = (css.match(/{/g) || []).length;
const closes = (css.match(/}/g) || []).length;

console.log("Cleanup Pass A complete");
console.log("Removed duplicate mobile rating blocks:", removed);
console.log("CSS opens:", opens);
console.log("CSS closes:", closes);
console.log("Difference:", opens - closes);
