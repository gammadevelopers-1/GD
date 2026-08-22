import { BannerCropper } from "gd-website";

const GRADIENT_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAUCAIAAABj86gYAAAGJ0lEQVR4nA3N0QarYAAA4PMQSZIkSZIkSXqWY2YzmZlskrSkzG+b31bNr9jFGGOMMboYMUaM6GLEOG9z9r3A9wfzcmyBsHCPxSkGEmy9xSDEdhssW2EIYMUSO8TYMcJOIXYOsIuPXT3s5mJ3Byvn2GOGVTb2nGKvCVaPsbeFNSOsHWKfAdb1sW8P+/f3D+7l+ALh4R6PUxwk+HqLQ4jvNni2whHAiyV+iPFjhJ9C/BzgFx+/evjNxe8OXs7xxwyvbPw5xV8TvB7jbwtvRng7xD8DvOvj3x7+CwgvJxaICPdEnBIgIdZbAkJityGyFYEAUSyJQ0wcI+IUEueAuPjE1SNuLnF3iHJOPGZEZRPPKfGaEPWYeFtEMyLaIfEZEF2f+PaIX0B6OblAZLgn45QECbnekhCSuw2ZrUgEyGJJHmLyGJGnkDwH5MUnrx55c8m7Q5Zz8jEjK5t8TsnXhKzH5NsimxHZDsnPgOz65LdH/gLKy6kFosI9FacUSKj1loKQ2m2obEUhQBVL6hBTx4g6hdQ5oC4+dfWom0vdHaqcU48ZVdnUc0q9JlQ9pt4W1Yyodkh9BlTXp7496hfQXk4vEB3u6TilQUKvtzSE9G5DZysaAbpY0oeYPkb0KaTPAX3x6atH31z67tDlnH7M6Mqmn1P6NaHrMf226GZEt0P6M6C7Pv3t0b+A8XJmgZhwz8QpAxJmvWUgZHYbJlsxCDDFkjnEzDFiTiFzDpiLz1w95uYyd4cp58xjxlQ285wyrwlTj5m3xTQjph0ynwHT9Zlvj/kFrJezC8SGezZOWZCw6y0LIbvbsNmKRYAtluwhZo8RewrZc8BefPbqsTeXvTtsOWcfM7ay2eeUfU3Yesy+LbYZse2Q/QzYrs9+e+wv4LycWyAu3HNxyoGEW285CLndhstWHAJcseQOMXeMuFPInQPu4nNXj7u53N3hyjn3mHGVzT2n3GvC1WPubXHNiGuH3GfAdX3u2+N+Ae/l/ALx4Z6PUx4k/HrLQ8jvNny24hHgiyV/iPljxJ9C/hzwF5+/evzN5e8OX875x4yvbP455V8Tvh7zb4tvRnw75D8Dvuvz3x7/CwQvFxZICPdCnAogEdZbAUJhtxGylYCAUCyFQywcI+EUCudAuPjC1RNurnB3hHIuPGZCZQvPqfCaCPVYeFtCMxLaofAZCF1f+PaEXyB6ubhAYrgX41QEibjeihCKu42YrUQExGIpHmLxGImnUDwH4sUXr554c8W7I5Zz8TETK1t8TsXXRKzH4tsSm5HYDsXPQOz64rcn/gLJy6UFksK9FKcSSKT1VoJQ2m2kbCUhIBVL6RBLx0g6hdI5kC6+dPWkmyvdHamcS4+ZVNnScyq9JlI9lt6W1Iykdih9BlLXl7496RfIXi4vkBzu5TiVQSKvtzKE8m4jZysZAblYyodYPkbyKZTPgXzx5asn31z57sjlXH7M5MqWn1P5NZHrsfy25GYkt0P5M5C7vvztyb9A8XJlgZRwr8SpAhJlvVUgVHYbJVspCCjFUjnEyjFSTqFyDpSLr1w95eYqd0cp58pjplS28pwqr4lSj5W3pTQjpR0qn4HS9ZVvT/kFqperC6SGezVOVZCo660KobrbqNlKRUAtluohVo+RegrVc6BefPXqqTdXvTtqOVcfM7Wy1edUfU3Ueqy+LbUZqe1Q/QzUrq9+e+ov0LxcWyAt3GtxqoFEW281CLXdRstWGgJasdQOsXaMtFOonQPt4mtXT7u52t3Ryrn2mGmVrT2n2mui1WPtbWnNSGuH2megdX3t29N+ge7l+gLp4V6PUx0k+nqrQ6jvNnq20hHQi6V+iPVjpJ9C/RzoF1+/evrN1e+OXs71x0yvbP051V8TvR7rb0tvRno71D8Dvevr357+CwwvNxbICPdGnBogMdZbA0JjtzGylYGAUSyNQ2wcI+MUGufAuPjG1TNurnF3jHJuPGZGZRvPqfGaGPXYeFtGMzLaofEZGF3f+PaMX2B6ublAZrg349QEibnemhCau42ZrUwEzGJpHmLzGJmn0DwH5sU3r555c827Y5Zz8zEzK9t8Ts3XxKzH5tsym5HZDs3PwOz65rdn/vv7H47fNW5NXNnCAAAAAElFTkSuQmCC";

function pngFile(name: string) {
  const bytes = Uint8Array.from(atob(GRADIENT_PNG), (char) => char.charCodeAt(0));
  return new File([bytes], name, { type: "image/png" });
}

const noop = () => {};

export function Default() {
  return (
    <BannerCropper
      file={pngFile("harbor-freight-banner.png")}
      saving={false}
      onCancel={noop}
      onSave={noop}
    />
  );
}

export function Saving() {
  return (
    <BannerCropper
      file={pngFile("northwind-banner.png")}
      saving={true}
      onCancel={noop}
      onSave={noop}
    />
  );
}
