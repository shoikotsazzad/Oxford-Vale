// Light / dark theme. The visitor's choice is kept in localStorage; with no choice the system setting is followed.
export type Theme = "light" | "dark";
export const THEME_KEY = "ov-theme";

/** Runs in <head> before the page paints, so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;
