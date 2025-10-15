import { publish } from "gh-pages";

console.log("run publish");
publish(
  "dist",
  {
    branch: "gh-pages",
  },
  (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Deployed to GitHub Pages");
    }
  }
);
