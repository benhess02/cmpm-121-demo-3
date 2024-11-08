let btn = document.createElement("button");
btn.innerHTML = "Click me!";
btn.addEventListener("click", (ev) => {
    alert("you clicked the button!");
});
document.body.append(btn);