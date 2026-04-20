const navButtons = [...document.querySelectorAll("[data-screen-target]")];
const screens = [...document.querySelectorAll("[data-screen]")];

function showScreen(target) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-visible", screen.dataset.screen === target);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.screenTarget === target);
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.screenTarget);
  });
});

showScreen("home");
