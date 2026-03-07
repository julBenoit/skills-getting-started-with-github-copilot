document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset select options (avoid duplicates on reload)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.setAttribute("data-activity", name);

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            ${details.participants && details.participants.length > 0
              ? `<ul class="participants-list">${details.participants.map(p => `<li>${p} <button class="delete-btn" data-activity="${name}" data-participant="${p}">×</button></li>`).join('')}</ul>`
              : `<p class="no-participants">No participants yet</p>`}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to refresh a specific activity's participants
  async function refreshActivity(activityName) {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      const details = activities[activityName];
      if (details) {
        const activityCard = document.querySelector(`[data-activity="${activityName}"]`);
        if (activityCard) {
          const participantsSection = activityCard.querySelector('.participants-section');
          const spotsLeft = details.max_participants - details.participants.length;
          // Update availability
          const availabilityP = activityCard.querySelector('p:nth-of-type(3)');
          if (availabilityP) {
            availabilityP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
          }
          // Update participants
          participantsSection.innerHTML = `
            <h5>Participants</h5>
            ${details.participants && details.participants.length > 0
              ? `<ul class="participants-list">${details.participants.map(p => `<li>${p} <button class="delete-btn" data-activity="${activityName}" data-participant="${p}">×</button></li>`).join('')}</ul>`
              : `<p class="no-participants">No participants yet</p>`}
          `;
        }
      }
    } catch (error) {
      console.error("Error refreshing activity:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await refreshActivity(activity);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle delete button clicks
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const activity = event.target.dataset.activity;
      const participant = event.target.dataset.participant;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(participant)}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();

        if (response.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          // Refresh the specific activity
          await refreshActivity(activity);
        } else {
          messageDiv.textContent = result.detail || "An error occurred";
          messageDiv.className = "error";
        }

        messageDiv.classList.remove("hidden");

        // Hide message after 5 seconds
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 5000);
      } catch (error) {
        messageDiv.textContent = "Failed to unregister. Please try again.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        console.error("Error unregistering:", error);
      }
    }
  });

  // Initialize app
  fetchActivities();
});
