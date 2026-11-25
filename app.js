/* MI Controls Jobs — app.js
   No frameworks, no external requests except listings.json (same origin).
   Pages: board (index.html), job (job.html), post (post-a-job.html),
   selected by <body data-page="...">. */
(function () {
  "use strict";

  /* ---------- Region derivation ----------
     If a listing has no explicit `region`, derive it from its city so the
     region filter always works on seed data. */
  var REGION_CITIES = {
    "Metro Detroit": ["detroit", "troy", "warren", "sterling heights", "auburn hills",
      "rochester hills", "rochester", "livonia", "dearborn", "novi", "farmington hills",
      "southfield", "pontiac", "royal oak", "clinton township", "macomb",
      "shelby township", "canton", "plymouth", "taylor", "romulus", "wixom",
      "milford", "brighton", "howell", "lake orion", "oxford", "utica",
      "fraser", "roseville", "st. clair shores", "eastpointe", "ferndale", "hazel park",
      "madison heights", "allen park", "lincoln park", "wyandotte", "monroe",
      "flat rock", "woodhaven", "belleville", "ypsilanti"],
    "Grand Rapids": ["grand rapids", "wyoming", "kentwood", "walker", "grandville",
      "holland", "zeeland", "muskegon", "grand haven", "hudsonville", "jenison",
      "comstock park", "sparta", "greenville", "lowell", "caledonia"],
    "Flint–Saginaw": ["flint", "saginaw", "bay city", "midland", "burton",
      "grand blanc", "fenton", "flushing", "birch run", "frankenmuth", "essexville",
      "auburn"],
    "Lansing": ["lansing", "east lansing", "holt", "mason", "charlotte",
      "grand ledge", "dewitt", "okemos", "haslett", "williamston"],
    "Kalamazoo–Battle Creek": ["kalamazoo", "battle creek", "portage", "marshall",
      "springfield", "galesburg", "plainwell", "otsego", "coldwater"]
  };

  var REGION_SLUGS = {
    "metro-detroit": "Metro Detroit",
    "grand-rapids": "Grand Rapids",
    "flint-saginaw": "Flint–Saginaw",
    "lansing": "Lansing",
    "kalamazoo-battle-creek": "Kalamazoo–Battle Creek",
    "other-mi": "Other MI"
  };

  function regionOf(listing) {
    if (listing.region) {
      return REGION_SLUGS[listing.region] || listing.region;
    }
    var city = (listing.city || "").trim().toLowerCase();
    for (var region in REGION_CITIES) {
      if (REGION_CITIES[region].indexOf(city) !== -1) return region;
    }
    return "Other MI";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function loadListings() {
    return fetch("listings.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("listings.json HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      return Array.isArray(data) ? data : [];
    });
  }

  function sortedListings(listings) {
    /* Featured first, then everything else in file order. */
    var featured = listings.filter(function (l) { return l.featured; });
    var rest = listings.filter(function (l) { return !l.featured; });
    return featured.concat(rest);
  }

  function metaItems(l) {
    var items = [];
    if (l.city) items.push("<li>" + esc(l.city) + ", MI</li>");
    if (l.pay_text) items.push('<li class="pay">' + esc(l.pay_text) + "</li>");
    if (l.shift) items.push("<li>" + esc(l.shift) + "</li>");
    var posted = l.employer_posted_date || l.posted_text;
    if (posted) items.push("<li>Posted " + esc(posted) + "</li>");
    return items.length ? '<ul class="meta">' + items.join("") + "</ul>" : "";
  }

  /* ================= BOARD PAGE ================= */
  function initBoard() {
    var countEl = document.getElementById("listing-count");
    var listEl = document.getElementById("listing-list");
    var resultsEl = document.getElementById("results-line");
    var searchEl = document.getElementById("filter-search");
    var regionEl = document.getElementById("filter-region");
    var shiftEl = document.getElementById("filter-shift");
    var all = [];

    function populateShifts() {
      var seen = {};
      all.forEach(function (l) { if (l.shift) seen[l.shift] = true; });
      var shifts = Object.keys(seen).sort();
      shiftEl.innerHTML = '<option value="">Any shift</option>' + shifts.map(function (s) {
        return '<option value="' + esc(s) + '">' + esc(s) + "</option>";
      }).join("");
    }

    function render() {
      var q = (searchEl.value || "").trim().toLowerCase();
      var region = regionEl.value;
      var shift = shiftEl.value;
      var filtered = all.filter(function (l) {
        if (region && regionOf(l) !== region) return false;
        if (shift && l.shift !== shift) return false;
        if (q) {
          var hay = ((l.title || "") + " " + (l.company || "") + " " + (l.city || "") + " " + (l.description || "")).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      resultsEl.textContent = filtered.length === all.length
        ? "Showing all " + filtered.length + " open jobs."
        : "Showing " + filtered.length + " of " + all.length + " open jobs.";
      if (!filtered.length) {
        listEl.innerHTML = '<div class="empty-state"><p><strong>No jobs match those filters yet.</strong></p>' +
          "<p>New Michigan controls jobs are added every week — join the free newsletter below so you don't miss the next batch.</p></div>";
        return;
      }
      listEl.innerHTML = sortedListings(filtered).map(function (l) {
        var apply = l.apply_url || l.source_url || "#";
        var via = l.seeded && l.source ? '<p class="via">Listed via ' + esc(l.source) + " — apply on the employer's site.</p>" : "";
        var badge = l.featured ? '<span class="badge">Featured</span>' : "";
        return '<article class="card' + (l.featured ? " featured" : "") + '">' + badge +
          '<h2><a href="jobs/job-' + encodeURIComponent(l.id) + '.html">' + esc(l.title) + "</a></h2>" +
          '<p class="company">' + esc(l.company) + "</p>" + metaItems(l) +
          '<a class="btn btn-primary" href="' + esc(apply) + '" target="_blank" rel="noopener">View / Apply</a>' +
          via + "</article>";
      }).join("");
    }

    loadListings().then(function (listings) {
      all = listings;
      countEl.textContent = String(all.length);
      var ccEl = document.getElementById("company-count");
      if (ccEl) {
        var seen = {};
        all.forEach(function (l) { seen[l.company] = 1; });
        ccEl.textContent = String(Object.keys(seen).length);
      }
      populateShifts();
      render();
    }).catch(function () {
      countEl.textContent = "—";
      listEl.innerHTML = '<div class="error-state"><p><strong>We couldn\'t load the job listings.</strong></p><p>Please check your connection and reload the page.</p></div>';
      resultsEl.textContent = "";
    });

    [searchEl, regionEl, shiftEl].forEach(function (el) {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
  }

  /* ================= JOB DETAIL PAGE ================= */
  function initJob() {
    var main = document.getElementById("job-detail");
    var id = new URLSearchParams(window.location.search).get("id");
    loadListings().then(function (listings) {
      var l = null;
      for (var i = 0; i < listings.length; i++) {
        if (String(listings[i].id) === String(id)) { l = listings[i]; break; }
      }
      if (!l) {
        main.innerHTML = '<div class="empty-state"><p><strong>That job listing isn\'t available anymore.</strong></p>' +
          '<p>It may have been filled or expired. <a href="index.html">Browse all Michigan controls jobs →</a></p></div>';
        return;
      }
      document.title = l.title + " — " + l.company + " | MI Controls Jobs";
      var apply = l.apply_url || l.source_url || "#";
      var via = l.seeded && l.source ? '<p class="via">Listed via ' + esc(l.source) + " — you'll apply on the employer's site.</p>" : "";
      var badge = l.featured ? '<span class="badge">Featured</span>' : "";
      main.innerHTML = badge + "<h1>" + esc(l.title) + "</h1>" +
        '<p class="company">' + esc(l.company) + "</p>" + metaItems(l) +
        (l.description ? '<div class="job-desc">' + esc(l.description) + "</div>" : "") +
        '<a class="btn btn-amber btn-block" href="' + esc(apply) + '" target="_blank" rel="noopener">Apply for this job</a>' + via;

      /* schema.org JobPosting JSON-LD, generated client-side from the listing. */
      var ld = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": l.title,
        "hiringOrganization": { "@type": "Organization", "name": l.company },
        "jobLocation": {
          "@type": "Place",
          "address": { "@type": "PostalAddress", "addressLocality": l.city, "addressRegion": "MI", "addressCountry": "US" }
        },
        "employmentType": "FULL_TIME"
      };
      if (l.description) ld.description = l.description;
      if (l.employer_posted_date || l.collected_date) ld.datePosted = l.employer_posted_date || l.collected_date;
      /* baseSalary is intentionally not injected here: pay_text is a display
         string, not a schema-valid value. The static /jobs/ pages carry the
         parsed, valid salary in their JSON-LD. */
      if (apply && apply !== "#") ld.url = apply;
      var script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(ld);
      document.head.appendChild(script);
    }).catch(function () {
      main.innerHTML = '<div class="error-state"><p><strong>We couldn\'t load that listing.</strong></p><p>Please check your connection and reload the page.</p></div>';
    });
  }

  /* ================= POST A JOB PAGE ================= */
  function initPost() {
    var form = document.getElementById("post-form");
    var plans = form.querySelectorAll(".plan");
    plans.forEach(function (plan) {
      plan.addEventListener("click", function () {
        plans.forEach(function (p) { p.classList.remove("selected"); });
        plan.classList.add("selected");
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      /* Live intake: POSTs to post-job.php, which stores the submission for
         manual review. The employer gets a Stripe checkout link by email
         after review. */
      var data = {};
      var fd = new FormData(form);
      fd.forEach(function (v, k) { data[k] = v; });
      var mailto = "mailto:mitchell@msecomllc.com?subject=" + encodeURIComponent("New job post — " + (data.company || "")) +
        "&body=" + encodeURIComponent(JSON.stringify(data, null, 2));
      var done = document.getElementById("post-success");
      done.querySelector("a").setAttribute("href", mailto);
      fetch("post-job.php", { method: "POST", body: fd })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok }; }); })
        .catch(function () { return { ok: false }; })
        .then(function (res) {
          if (!res.ok) {
            done.querySelector("p").textContent = "We couldn't save your post automatically — please send it to us with the email link below and we'll get it up for you.";
          }
          form.hidden = true;
          done.hidden = false;
          done.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
  }

  /* ================= NEWSLETTER (all pages) ================= */
  function initNewsletter() {
    var form = document.getElementById("newsletter-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      /* Live intake: POSTs to subscribe.php, which stores the signup.
         The weekly roundup is sent from those stored signups. */
      var wrap = document.getElementById("newsletter-wrap");
      fetch("subscribe.php", { method: "POST", body: new FormData(form) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok }; }); })
        .catch(function () { return { ok: false }; })
        .then(function (res) {
          if (res.ok) {
            wrap.innerHTML = '<div class="form-success">You\'re on the list ✓ — the next Michigan Controls Jobs roundup lands in your inbox this week.</div>';
          } else {
            wrap.innerHTML = '<div class="form-success">Hmm — that didn\'t save. Please check the email address and try again.</div>';
          }
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    if (page === "board") initBoard();
    if (page === "job") initJob();
    if (page === "post") initPost();
    initNewsletter();
  });
})();
