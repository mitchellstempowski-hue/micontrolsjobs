/* MI Controls Jobs — job-alerts form handler.
   Shared by every page that carries the alerts form (home, job pages,
   role/city/employer pages, salary). Mirrors the claim-form pattern:
   POST the FormData to the Formspree Job Alerts endpoint and confirm in place. */
(function () {
  var forms = document.querySelectorAll("[data-alerts-form]");
  forms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-alerts-note]");
      var btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      fetch(form.action, { method: "POST", headers: { "Accept": "application/json" }, body: new FormData(form) })
        .then(function (r) {
          return r.json().then(function (j) { return { ok: r.ok && j.ok }; });
        })
        .catch(function () { return { ok: false }; })
        .then(function (res) {
          if (btn) btn.disabled = false;
          if (!note) return;
          if (res.ok) {
            form.reset();
            note.textContent =
              "You're on the list — we'll email you when a new matching Michigan controls job is posted.";
          } else {
            note.textContent =
              "That didn't go through — please check the email address and try again.";
          }
        });
    });
  });
})();
