const btn = document.createElement("button");
btn.innerHTML = "Click me!";
btn.addEventListener("click", () => {
  alert("you clicked the button!");
});
document.body.append(btn);
