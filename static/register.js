document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#user-form").onsubmit = () => {
    const displayname = document.querySelector("#displayname").value;
    localStorage.setItem('displayname', displayname);
  }
})
