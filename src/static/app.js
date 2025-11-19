/* Minimal client: fetch activities, render cards with participants, handle signup */

async function fetchActivities() {
  const res = await fetch("/activities");
  if (!res.ok) throw new Error("Failed to load activities");
  return res.json();
}

function initialsFromEmail(email) {
  const name = email.split("@")[0];
  const parts = name.split(/[._\-]/).filter(Boolean);
  const initials = parts.map(p => p[0]?.toUpperCase() ?? "").slice(0,2).join("");
  return initials || email.slice(0,2).toUpperCase();
}

function renderActivity(container, activityName, data) {
  const tpl = document.getElementById("activity-template");
  const node = tpl.content.cloneNode(true);
  node.querySelector(".activity-title").textContent = activityName;
  node.querySelector(".activity-desc").textContent = data.description || "";
  node.querySelector(".activity-schedule").textContent = data.schedule || "";
  node.querySelector(".activity-capacity").textContent = `Capacity: ${data.participants.length} / ${data.max_participants}`;

  const ul = node.querySelector(".participants-list");
  const count = node.querySelector(".participants-count");
  count.textContent = `${data.participants.length}`;

  if (data.participants.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No participants yet";
    li.style.fontStyle = "italic";
    ul.appendChild(li);
  } else {
    data.participants.forEach(email => {
      const li = document.createElement("li");
      const badge = document.createElement("span");
      badge.className = "participant-badge";
      badge.textContent = initialsFromEmail(email);
      li.appendChild(badge);
      const txt = document.createElement("span");
      txt.textContent = email;
      li.appendChild(txt);
      ul.appendChild(li);
    });
  }

  container.appendChild(node);
}

function populateActivityOptions(selectEl, activities) {
  // Clear existing (except placeholder)
  selectEl.querySelectorAll("option:not([value=''])").forEach(o => o.remove());
  Object.keys(activities).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    selectEl.appendChild(opt);
  });
}

function showMessage(msgEl, text, type = "info") {
  msgEl.className = `message ${type}`;
  msgEl.textContent = text;
  msgEl.classList.remove("hidden");
  setTimeout(() => {
    msgEl.classList.add("hidden");
  }, 4000);
}

async function init() {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  try {
    const activities = await fetchActivities();
    activitiesList.innerHTML = "";
    Object.entries(activities).forEach(([name, data]) => {
      renderActivity(activitiesList, name, data);
    });
    populateActivityOptions(activitySelect, activities);
  } catch (err) {
    activitiesList.innerHTML = `<p class="error">Could not load activities.</p>`;
    console.error(err);
    return;
  }

  signupForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;
    if (!email || !activity) return;

    try {
      const params = new URLSearchParams({ email });
      const res = await fetch(`/activities/${encodeURIComponent(activity)}/signup?` + params.toString(), {
        method: "POST"
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({detail:'Erreur'}));
        showMessage(messageEl, err.detail || 'Signup failed', 'error');
        return;
      }
      const result = await res.json();
      showMessage(messageEl, result.message, 'success');

      // Refresh activities to update participants in UI
      const activities = await fetchActivities();
      activitiesList.innerHTML = "";
      Object.entries(activities).forEach(([name, data]) => {
        renderActivity(activitiesList, name, data);
      });
      populateActivityOptions(activitySelect, activities);
      signupForm.reset();
    } catch (err) {
      console.error(err);
      showMessage(messageEl, 'Network error', 'error');
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
