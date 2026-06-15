const baseURL = "http://localhost:3000";

document.getElementById("login").addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  axios({
    method: "post",
    url: `${baseURL}/auth/login`,
    data: { email, password },
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  })
    .then((response) => {
      const { message, data } = response.data;
      if (message === "Done") {
        localStorage.setItem("token", data.access_token);
        window.location.href = "chat.html";
      } else {
        alert("Invalid email or password");
      }
    })
    .catch((error) => {
      console.log(error);
      alert("Invalid email or password");
    });
});

// Allow pressing Enter to log in
document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("login").click();
});
