const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealElements.forEach((element) => revealObserver.observe(element));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readStoredJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredJson(key, value) {
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function formatCurrency(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDateTime(slot) {
  if (!slot) {
    return "Slot unavailable";
  }
  return `${slot.date} | ${slot.startTime}-${slot.endTime}`;
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setMessage(element, value, tone = "default") {
  if (!element) {
    return;
  }

  const palette = {
    default: "rgba(23, 50, 45, 0.14)",
    success: "rgba(29, 118, 109, 0.18)",
    error: "rgba(187, 108, 77, 0.18)"
  };

  element.textContent = value;
  element.style.padding = "12px 14px";
  element.style.borderRadius = "16px";
  element.style.border = `1px solid ${palette[tone] || palette.default}`;
  element.style.background = tone === "error" ? "rgba(187, 108, 77, 0.08)" : "rgba(255,255,255,0.7)";
}

const state = {
  token: window.localStorage.getItem("pulsecare.token") || "",
  user: readStoredJson("pulsecare.user"),
  health: null,
  docs: [],
  specialities: [],
  doctors: [],
  selectedDoctorId: "",
  selectedDoctor: null,
  selectedDoctorReviews: [],
  selectedDoctorSlots: [],
  selectedSlotId: "",
  appointments: [],
  notifications: [],
  rescheduleAppointmentId: "",
  reviewAppointmentId: "",
  doctorProfile: null,
  doctorSlots: [],
  doctorAppointments: [],
  doctorDashboard: null,
  adminUsers: [],
  adminAppointments: [],
  adminPayments: [],
  adminReports: null,
  adminActivity: []
};

const ui = {
  healthStatus: document.querySelector("#health-status"),
  sessionBadge: document.querySelector("#session-badge"),
  heroMetrics: document.querySelector("#hero-metrics"),
  roleVisibilityCopy: document.querySelector("#role-visibility-copy"),
  sessionName: document.querySelector("#session-name"),
  sessionRole: document.querySelector("#session-role"),
  sessionEmail: document.querySelector("#session-email"),
  loginForm: document.querySelector("#login-form"),
  loginEmail: document.querySelector("#login-email"),
  loginPassword: document.querySelector("#login-password"),
  authMessage: document.querySelector("#auth-message"),
  logoutButton: document.querySelector("#logout-button"),
  registerForm: document.querySelector("#register-form"),
  registerName: document.querySelector("#register-name"),
  registerPhone: document.querySelector("#register-phone"),
  registerEmail: document.querySelector("#register-email"),
  registerPassword: document.querySelector("#register-password"),
  registerRole: document.querySelector("#register-role"),
  registerSpeciality: document.querySelector("#register-speciality"),
  registerLocation: document.querySelector("#register-location"),
  registerFees: document.querySelector("#register-fees"),
  registerMessage: document.querySelector("#register-message"),
  demoPatient: document.querySelector("#demo-patient"),
  demoDoctor: document.querySelector("#demo-doctor"),
  demoAdmin: document.querySelector("#demo-admin"),
  doctorOnlyFields: document.querySelectorAll(".doctor-only"),
  filterSpeciality: document.querySelector("#filter-speciality"),
  filterCity: document.querySelector("#filter-city"),
  filterDate: document.querySelector("#filter-date"),
  doctorSearch: document.querySelector("#doctor-search"),
  doctorSearchForm: document.querySelector("#doctor-search-form"),
  doctorResults: document.querySelector("#doctor-results"),
  selectedDoctor: document.querySelector("#selected-doctor"),
  slotSelectionNote: document.querySelector("#slot-selection-note"),
  bookingForm: document.querySelector("#booking-form"),
  bookingReason: document.querySelector("#booking-reason"),
  bookingPayment: document.querySelector("#booking-payment"),
  bookingMessage: document.querySelector("#booking-message"),
  appointmentList: document.querySelector("#appointment-list"),
  appointmentMessage: document.querySelector("#appointment-message"),
  reviewForm: document.querySelector("#review-form"),
  reviewAppointmentId: document.querySelector("#review-appointment-id"),
  reviewRating: document.querySelector("#review-rating"),
  reviewComment: document.querySelector("#review-comment"),
  reviewMessage: document.querySelector("#review-message"),
  notificationList: document.querySelector("#notification-list"),
  rescheduleBanner: document.querySelector("#reschedule-banner"),
  rescheduleCopy: document.querySelector("#reschedule-copy"),
  clearRescheduleButton: document.querySelector("#clear-reschedule-button"),
  patientSection: document.querySelector("#patient"),
  doctorSection: document.querySelector("#doctor"),
  adminSection: document.querySelector("#admin"),
  doctorProfileForm: document.querySelector("#doctor-profile-form"),
  doctorSpeciality: document.querySelector("#doctor-speciality"),
  doctorQualification: document.querySelector("#doctor-qualification"),
  doctorExperience: document.querySelector("#doctor-experience"),
  doctorFees: document.querySelector("#doctor-fees"),
  doctorLocation: document.querySelector("#doctor-location"),
  doctorClinicName: document.querySelector("#doctor-clinic-name"),
  doctorAbout: document.querySelector("#doctor-about"),
  doctorLanguages: document.querySelector("#doctor-languages"),
  doctorProfileMessage: document.querySelector("#doctor-profile-message"),
  doctorDashboard: document.querySelector("#doctor-dashboard"),
  doctorSlotForm: document.querySelector("#doctor-slot-form"),
  doctorSlotDate: document.querySelector("#doctor-slot-date"),
  doctorSlotStart: document.querySelector("#doctor-slot-start"),
  doctorSlotEnd: document.querySelector("#doctor-slot-end"),
  doctorSlotDuration: document.querySelector("#doctor-slot-duration"),
  doctorSlotClosed: document.querySelector("#doctor-slot-closed"),
  doctorSlotMessage: document.querySelector("#doctor-slot-message"),
  doctorSlotList: document.querySelector("#doctor-slot-list"),
  doctorAppointmentList: document.querySelector("#doctor-appointment-list"),
  doctorAppointmentMessage: document.querySelector("#doctor-appointment-message"),
  doctorHistory: document.querySelector("#doctor-history"),
  adminReportGrid: document.querySelector("#admin-report-grid"),
  adminActivityList: document.querySelector("#admin-activity-list"),
  adminUserList: document.querySelector("#admin-user-list"),
  adminPaymentList: document.querySelector("#admin-payment-list"),
  adminAppointmentList: document.querySelector("#admin-appointment-list"),
  specialityForm: document.querySelector("#speciality-form"),
  specialityName: document.querySelector("#speciality-name"),
  specialityMessage: document.querySelector("#speciality-message"),
  broadcastForm: document.querySelector("#broadcast-form"),
  broadcastTitle: document.querySelector("#broadcast-title"),
  broadcastMessageText: document.querySelector("#broadcast-message-text"),
  broadcastFeedback: document.querySelector("#broadcast-feedback"),
  specialityPills: document.querySelector("#speciality-pills"),
  apiDocs: document.querySelector("#api-docs")
};

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function saveSession(token, user) {
  state.token = token || "";
  state.user = user || null;

  if (token) {
    window.localStorage.setItem("pulsecare.token", token);
  } else {
    window.localStorage.removeItem("pulsecare.token");
  }

  writeStoredJson("pulsecare.user", state.user);
}

function clearSession() {
  saveSession("", null);
  state.selectedDoctorId = "";
  state.selectedDoctor = null;
  state.selectedSlotId = "";
  state.rescheduleAppointmentId = "";
  state.reviewAppointmentId = "";
}

function renderHeroMetrics() {
  const stats = state.health?.stats || {};
  const items = [
    ["Users", stats.totalUsers || 0],
    ["Doctors", stats.doctors || 0],
    ["Appointments", stats.appointments || 0],
    ["Revenue", formatCurrency(stats.totalRevenue || 0)]
  ];

  ui.heroMetrics.innerHTML = items
    .map(
      ([label, value]) => `
        <div class="metric-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");
}

function renderHealthStatus() {
  if (!state.health) {
    setText(ui.healthStatus, "Backend offline");
    return;
  }
  setText(ui.healthStatus, "Backend online");
}

function renderRolePanels() {
  const role = state.user?.role || "";
  ui.doctorSection.classList.toggle("hidden", role !== "doctor");
  ui.adminSection.classList.toggle("hidden", role !== "admin");

  const copy = role
    ? `${role} mode active`
    : "Browse mode enabled";

  setText(ui.roleVisibilityCopy, copy);
  setText(ui.sessionBadge, role ? `${role} session` : "Guest session");
}

function renderSession() {
  setText(ui.sessionName, state.user?.name || "Guest");
  setText(ui.sessionRole, state.user?.role || "None");
  setText(ui.sessionEmail, state.user?.email || "Not logged in");
  renderRolePanels();
}

function renderSpecialities() {
  const options = [`<option value="">All specialities</option>`]
    .concat(
      state.specialities.map(
        (speciality) => `<option value="${escapeHtml(speciality.name)}">${escapeHtml(speciality.name)}</option>`
      )
    )
    .join("");

  ui.filterSpeciality.innerHTML = options;
  ui.specialityPills.innerHTML = state.specialities
    .map((speciality) => `<span>${escapeHtml(speciality.name)}</span>`)
    .join("");
}

function renderApiDocs() {
  if (!state.docs.length) {
    ui.apiDocs.innerHTML = '<p class="empty-state">API docs are not available.</p>';
    return;
  }

  ui.apiDocs.innerHTML = state.docs
    .map(
      (group) => `
        <article class="stack-item">
          <div class="stack-item-head">
            <div>
              <small class="tiny-label">${escapeHtml(group.name)}</small>
              <h4>${escapeHtml(group.name)} Endpoints</h4>
            </div>
          </div>
          <div class="stack-list">
            ${group.endpoints
              .map(
                (endpoint) => `
                  <div class="notification-item">
                    <small>${escapeHtml(endpoint.method)} ${escapeHtml(endpoint.path)}</small>
                    <p>${escapeHtml(endpoint.summary)}</p>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function doctorCardTemplate(doctor) {
  return `
    <article class="doctor-card">
      <div class="section-head compact">
        <div>
          <small class="tiny-label">${escapeHtml(doctor.speciality || "Doctor")}</small>
          <h3>${escapeHtml(doctor.name)}</h3>
        </div>
        <span class="status-chip ${doctor.verified ? "accent" : "subtle"}">
          ${doctor.verified ? "Verified" : "Pending"}
        </span>
      </div>
      <p>${escapeHtml(doctor.clinicName || "Independent clinic")} | ${escapeHtml(doctor.location || "Remote")}</p>
      <div class="detail-meta">
        <span>${escapeHtml(`${doctor.experience || 0} yrs exp`)}</span>
        <span>${escapeHtml(formatCurrency(doctor.fees || 0))}</span>
        <span>${escapeHtml(`${doctor.rating || 0} star`)}</span>
      </div>
      <p>${escapeHtml(doctor.about || "Profile details available in doctor card.")}</p>
      <div class="appointment-card-actions">
        <button class="mini-button" type="button" data-doctor-select="${escapeHtml(doctor.id)}">View Profile</button>
      </div>
    </article>
  `;
}

function renderDoctorResults() {
  if (!state.doctors.length) {
    ui.doctorResults.innerHTML = '<p class="empty-state">No doctors match the current search.</p>';
    return;
  }

  ui.doctorResults.innerHTML = state.doctors.map(doctorCardTemplate).join("");

  ui.doctorResults.querySelectorAll("[data-doctor-select]").forEach((button) => {
    button.addEventListener("click", () => {
      loadDoctorDetails(button.dataset.doctorSelect).catch((error) => {
        setMessage(ui.bookingMessage, error.message, "error");
      });
    });
  });
}

function renderSlotSelection() {
  const slot = state.selectedDoctorSlots.find((item) => item.id === state.selectedSlotId);
  if (!slot) {
    setText(ui.slotSelectionNote, "No slot selected");
    return;
  }
  setText(ui.slotSelectionNote, `${slot.date} ${slot.startTime}-${slot.endTime}`);
}

function renderRescheduleBanner() {
  const appointment = state.appointments.find((item) => item.id === state.rescheduleAppointmentId);
  const slot = appointment?.slot;
  ui.rescheduleBanner.classList.toggle("hidden", !appointment);
  if (appointment) {
    setText(
      ui.rescheduleCopy,
      `Rescheduling ${appointment.doctor?.name || "appointment"} currently set for ${formatDateTime(slot)}.`
    );
  }
}

function renderSelectedDoctor() {
  const doctor = state.selectedDoctor;
  if (!doctor) {
    ui.selectedDoctor.innerHTML =
      '<p class="empty-state">Choose a doctor card to view profile, reviews, and available slots.</p>';
    renderSlotSelection();
    return;
  }

  const reviews = state.selectedDoctorReviews.length
    ? state.selectedDoctorReviews
        .map(
          (review) => `
            <div class="notification-item">
              <small>${escapeHtml(review.patient?.name || "Patient")} | ${escapeHtml(`${review.rating}/5`)}</small>
              <p>${escapeHtml(review.comment || "No comment")}</p>
            </div>
          `
        )
        .join("")
    : '<p class="empty-state">No reviews yet for this doctor.</p>';

  const slots = state.selectedDoctorSlots.length
    ? state.selectedDoctorSlots
        .map((slot) => {
          const unavailable = slot.isClosed || slot.isBooked;
          const classes = ["slot-chip"];
          if (unavailable) {
            classes.push("unavailable");
          }
          if (slot.id === state.selectedSlotId) {
            classes.push("active");
          }

          return `
            <button
              type="button"
              class="${classes.join(" ")}"
              data-slot-select="${escapeHtml(slot.id)}"
              ${unavailable ? "disabled" : ""}
            >
              <div class="slot-chip-head">
                <strong>${escapeHtml(`${slot.startTime}-${slot.endTime}`)}</strong>
                <span class="badge">${escapeHtml(slot.isClosed ? "Break" : slot.isBooked ? "Booked" : "Open")}</span>
              </div>
              <small>${escapeHtml(slot.date)}</small>
            </button>
          `;
        })
        .join("")
    : '<p class="empty-state">No slots found for this date. Try changing the date filter.</p>';

  ui.selectedDoctor.innerHTML = `
    <div class="section-head compact">
      <div>
        <small class="tiny-label">${escapeHtml(doctor.speciality || "Doctor profile")}</small>
        <h3>${escapeHtml(doctor.name)}</h3>
      </div>
      <span class="status-chip ${doctor.verified ? "accent" : "subtle"}">
        ${doctor.verified ? "Verified" : "Pending"}
      </span>
    </div>
    <div class="detail-meta">
      <span>${escapeHtml(doctor.clinicName || "Clinic")}</span>
      <span>${escapeHtml(doctor.location || "Remote")}</span>
      <span>${escapeHtml(formatCurrency(doctor.fees || 0))}</span>
      <span>${escapeHtml(`${doctor.rating || 0} rating`)}</span>
    </div>
    <p>${escapeHtml(doctor.about || "Doctor profile information.")}</p>
    <div class="detail-meta">
      <span>${escapeHtml(doctor.qualification || "Qualification n/a")}</span>
      <span>${escapeHtml(`${doctor.experience || 0} years experience`)}</span>
      <span>${escapeHtml((doctor.languages || []).join(", ") || "Languages n/a")}</span>
    </div>
    <div>
      <h4>Available Slots</h4>
      <div class="slot-grid">${slots}</div>
    </div>
    <div>
      <h4>Recent Reviews</h4>
      <div class="stack-list">${reviews}</div>
    </div>
  `;

  ui.selectedDoctor.querySelectorAll("[data-slot-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedSlotId = button.dataset.slotSelect;
      renderSelectedDoctor();
      renderSlotSelection();
    });
  });

  renderSlotSelection();
}

function appointmentCardTemplate(appointment) {
  const slotText = formatDateTime(appointment.slot);
  const actions = [];

  if (appointment.status === "confirmed") {
    actions.push(`<button class="mini-button" type="button" data-appointment-cancel="${escapeHtml(appointment.id)}">Cancel</button>`);
    actions.push(`<button class="mini-button" type="button" data-appointment-reschedule="${escapeHtml(appointment.id)}">Prepare Reschedule</button>`);
  }

  if (appointment.status === "completed" && !appointment.review) {
    actions.push(`<button class="mini-button" type="button" data-appointment-review="${escapeHtml(appointment.id)}">Review</button>`);
  }

  return `
    <article class="stack-item">
      <div class="stack-item-head">
        <div>
          <small>${escapeHtml(appointment.doctor?.speciality || "Appointment")}</small>
          <h4>${escapeHtml(appointment.doctor?.name || "Doctor")}</h4>
        </div>
        <span class="status-chip ${appointment.status === "confirmed" ? "accent" : "subtle"}">
          ${escapeHtml(appointment.status.replace("_", " "))}
        </span>
      </div>
      <p>${escapeHtml(slotText)}</p>
      <p>Payment: ${escapeHtml(appointment.paymentMethod)} | ${escapeHtml(appointment.paymentStatus)}</p>
      <p>Reason: ${escapeHtml(appointment.reason || "Not specified")}</p>
      <div class="appointment-card-actions">${actions.join("") || '<span class="tiny-label">No actions available</span>'}</div>
    </article>
  `;
}

function renderAppointments() {
  if (state.user?.role !== "patient") {
    ui.appointmentList.innerHTML = '<p class="empty-state">Login as a patient to load appointments.</p>';
    return;
  }

  if (!state.appointments.length) {
    ui.appointmentList.innerHTML = '<p class="empty-state">No appointments yet. Book your first slot above.</p>';
    return;
  }

  ui.appointmentList.innerHTML = state.appointments.map(appointmentCardTemplate).join("");

  ui.appointmentList.querySelectorAll("[data-appointment-cancel]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/api/appointments/${button.dataset.appointmentCancel}/cancel`, {
          method: "PUT"
        });
        setMessage(ui.appointmentMessage, "Appointment cancelled.", "success");
        await Promise.all([loadPatientData(), loadSelectedDoctorSlots()]);
      } catch (error) {
        setMessage(ui.appointmentMessage, error.message, "error");
      }
    });
  });

  ui.appointmentList.querySelectorAll("[data-appointment-reschedule]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.rescheduleAppointmentId = button.dataset.appointmentReschedule;
      const appointment = state.appointments.find((item) => item.id === state.rescheduleAppointmentId);
      if (appointment?.slot?.date) {
        ui.filterDate.value = appointment.slot.date;
      }
      await loadDoctorDetails(appointment.doctor.id);
      renderRescheduleBanner();
      setMessage(ui.appointmentMessage, "Choose a new slot above to finish rescheduling.", "success");
    });
  });

  ui.appointmentList.querySelectorAll("[data-appointment-review]").forEach((button) => {
    button.addEventListener("click", () => {
      state.reviewAppointmentId = button.dataset.appointmentReview;
      ui.reviewAppointmentId.value = state.reviewAppointmentId;
      setMessage(ui.reviewMessage, "Review form prepared. Add your comment and submit.", "success");
    });
  });
}

function renderNotifications() {
  if (!state.notifications.length) {
    ui.notificationList.innerHTML = '<p class="empty-state">Notifications will appear here after login.</p>';
    return;
  }

  ui.notificationList.innerHTML = state.notifications
    .map(
      (notification) => `
        <article class="notification-item">
          <small>${escapeHtml(notification.title)}</small>
          <p>${escapeHtml(notification.message)}</p>
        </article>
      `
    )
    .join("");
}

function renderDoctorProfile() {
  const profile = state.doctorProfile?.profile;
  const doctor = state.doctorProfile?.doctor;
  if (!profile || !doctor) {
    return;
  }

  ui.doctorSpeciality.value = profile.speciality || "";
  ui.doctorQualification.value = profile.qualification || "";
  ui.doctorExperience.value = profile.experience || 0;
  ui.doctorFees.value = profile.fees || 0;
  ui.doctorLocation.value = profile.location || "";
  ui.doctorClinicName.value = profile.clinicName || "";
  ui.doctorAbout.value = profile.about || "";
  ui.doctorLanguages.value = (profile.languages || []).join(", ");
  setMessage(
    ui.doctorProfileMessage,
    doctor.verified ? "Doctor profile is live for patients." : "Profile loaded. Verification is pending.",
    doctor.verified ? "success" : "default"
  );
}

function renderDoctorDashboard() {
  const dashboard = state.doctorDashboard || {
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    totalRevenue: 0
  };

  const items = [
    ["Appointments", dashboard.totalAppointments],
    ["Upcoming", dashboard.upcomingAppointments],
    ["Completed", dashboard.completedAppointments],
    ["Revenue", formatCurrency(dashboard.totalRevenue)]
  ];

  ui.doctorDashboard.innerHTML = items
    .map(
      ([label, value]) => `
        <article class="summary-tile">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `
    )
    .join("");
}

function renderDoctorSlots() {
  if (!state.doctorSlots.length) {
    ui.doctorSlotList.innerHTML = '<p class="empty-state">No slots created yet.</p>';
    return;
  }

  ui.doctorSlotList.innerHTML = state.doctorSlots
    .map(
      (slot) => `
        <article class="stack-item">
          <div class="stack-item-head">
            <div>
              <small>${escapeHtml(slot.date)}</small>
              <h4>${escapeHtml(`${slot.startTime}-${slot.endTime}`)}</h4>
            </div>
            <span class="status-chip ${slot.isClosed ? "subtle" : "accent"}">
              ${escapeHtml(slot.isBooked ? "Booked" : slot.isClosed ? "Break" : "Open")}
            </span>
          </div>
          <p>Duration: ${escapeHtml(`${slot.durationMinutes} min`)}</p>
          <div class="appointment-card-actions">
            ${
              slot.isBooked
                ? '<span class="tiny-label">Booked slots cannot be edited.</span>'
                : `
                  <button class="mini-button" type="button" data-doctor-slot-toggle="${escapeHtml(slot.id)}" data-next-closed="${slot.isClosed ? "false" : "true"}">
                    ${slot.isClosed ? "Reopen Slot" : "Mark Break"}
                  </button>
                `
            }
          </div>
        </article>
      `
    )
    .join("");

  ui.doctorSlotList.querySelectorAll("[data-doctor-slot-toggle]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/api/doctor/slots/${button.dataset.doctorSlotToggle}`, {
          method: "PUT",
          body: JSON.stringify({
            isClosed: button.dataset.nextClosed === "true"
          })
        });
        setMessage(ui.doctorSlotMessage, "Slot updated.", "success");
        await loadDoctorWorkspace();
      } catch (error) {
        setMessage(ui.doctorSlotMessage, error.message, "error");
      }
    });
  });
}

function renderDoctorAppointments() {
  if (!state.doctorAppointments.length) {
    ui.doctorAppointmentList.innerHTML = '<p class="empty-state">No appointments assigned yet.</p>';
    return;
  }

  ui.doctorAppointmentList.innerHTML = state.doctorAppointments
    .map(
      (appointment) => `
        <article class="stack-item">
          <div class="stack-item-head">
            <div>
              <small>${escapeHtml(appointment.patient?.name || "Patient")}</small>
              <h4>${escapeHtml(formatDateTime(appointment.slot))}</h4>
            </div>
            <span class="status-chip ${appointment.status === "completed" ? "accent" : "subtle"}">
              ${escapeHtml(appointment.status.replace("_", " "))}
            </span>
          </div>
          <p>Reason: ${escapeHtml(appointment.reason || "No reason added")}</p>
          <p>Medical history: ${escapeHtml(appointment.patientProfile?.medicalHistory || "No history available")}</p>
          <div class="appointment-card-actions">
            <select class="status-select" data-status-select="${escapeHtml(appointment.id)}">
              ${["confirmed", "completed", "no_show"]
                .map(
                  (status) => `
                    <option value="${status}" ${appointment.status === status ? "selected" : ""}>
                      ${status.replace("_", " ")}
                    </option>
                  `
                )
                .join("")}
            </select>
            <button class="mini-button" type="button" data-doctor-appointment-update="${escapeHtml(appointment.id)}">Update Status</button>
            <button class="mini-button" type="button" data-patient-history="${escapeHtml(appointment.patient?.id || "")}">Patient History</button>
          </div>
        </article>
      `
    )
    .join("");

  ui.doctorAppointmentList.querySelectorAll("[data-doctor-appointment-update]").forEach((button) => {
    button.addEventListener("click", async () => {
      const select = ui.doctorAppointmentList.querySelector(`[data-status-select="${button.dataset.doctorAppointmentUpdate}"]`);
      try {
        await apiRequest(`/api/doctor/appointments/${button.dataset.doctorAppointmentUpdate}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: select?.value || "confirmed" })
        });
        setMessage(ui.doctorAppointmentMessage, "Appointment status updated.", "success");
        await loadDoctorWorkspace();
      } catch (error) {
        setMessage(ui.doctorAppointmentMessage, error.message, "error");
      }
    });
  });

  ui.doctorAppointmentList.querySelectorAll("[data-patient-history]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const result = await apiRequest(`/api/doctor/patients/${button.dataset.patientHistory}/history`);
        const historyHtml = (result.history || [])
          .map(
            (appointment) => `
              <article class="notification-item">
                <small>${escapeHtml(formatDateTime(appointment.slot))}</small>
                <p>Status: ${escapeHtml(appointment.status)} | Reason: ${escapeHtml(appointment.reason || "Not specified")}</p>
              </article>
            `
          )
          .join("");

        ui.doctorHistory.innerHTML = `
          <h3>${escapeHtml(result.patient?.name || "Patient")}</h3>
          <p>${escapeHtml(result.patientProfile?.medicalHistory || "No medical history saved.")}</p>
          <div class="stack-list">${historyHtml || '<p class="empty-state">No history found.</p>'}</div>
        `;
      } catch (error) {
        setMessage(ui.doctorAppointmentMessage, error.message, "error");
      }
    });
  });
}

function renderAdminReports() {
  const reports = state.adminReports || {};
  const items = [
    ["Total Users", reports.totalUsers || 0],
    ["Verified Doctors", reports.verifiedDoctors || 0],
    ["Appointments", reports.appointments || 0],
    ["Revenue", formatCurrency(reports.totalRevenue || 0)],
    ["Cancelled", reports.cancelledAppointments || 0],
    ["No-show", reports.noShowAppointments || 0]
  ];

  ui.adminReportGrid.innerHTML = items
    .map(
      ([label, value]) => `
        <article class="summary-tile">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `
    )
    .join("");
}

function renderAdminActivity() {
  if (!state.adminActivity.length) {
    ui.adminActivityList.innerHTML = '<p class="empty-state">No admin activity logged yet.</p>';
    return;
  }

  ui.adminActivityList.innerHTML = state.adminActivity
    .map(
      (item) => `
        <article class="notification-item">
          <small>${escapeHtml(item.action)}</small>
          <p>${escapeHtml(item.createdAt)}</p>
        </article>
      `
    )
    .join("");
}

function renderAdminUsers() {
  if (!state.adminUsers.length) {
    ui.adminUserList.innerHTML = '<p class="empty-state">No users loaded.</p>';
    return;
  }

  ui.adminUserList.innerHTML = state.adminUsers
    .map((user) => {
      const doctorProfile = user.doctorProfile;
      return `
        <article class="stack-item">
          <div class="stack-item-head">
            <div>
              <small>${escapeHtml(user.role)}</small>
              <h4>${escapeHtml(user.name)}</h4>
            </div>
            <span class="status-chip ${doctorProfile?.verified ? "accent" : "subtle"}">
              ${
                doctorProfile
                  ? escapeHtml(doctorProfile.blocked ? "Blocked" : doctorProfile.verified ? "Verified" : "Pending")
                  : "User"
              }
            </span>
          </div>
          <p>${escapeHtml(user.email)} | ${escapeHtml(user.phone || "No phone")}</p>
          <p>${
            doctorProfile
              ? escapeHtml(`${doctorProfile.speciality} | ${doctorProfile.location} | ${formatCurrency(doctorProfile.fees)}`)
              : escapeHtml(user.patientProfile?.medicalHistory || "No additional profile data")
          }</p>
          <div class="appointment-card-actions">
            ${
              doctorProfile
                ? `
                  <button class="mini-button" type="button" data-admin-verify="${escapeHtml(user.id)}" data-verified="true" data-blocked="false">Verify</button>
                  <button class="mini-button" type="button" data-admin-block="${escapeHtml(user.id)}" data-verified="${doctorProfile.verified}" data-blocked="${doctorProfile.blocked ? "false" : "true"}">
                    ${doctorProfile.blocked ? "Unblock" : "Block"}
                  </button>
                `
                : '<span class="tiny-label">No doctor controls for this user.</span>'
            }
          </div>
        </article>
      `;
    })
    .join("");

  ui.adminUserList.querySelectorAll("[data-admin-verify]").forEach((button) => {
    button.addEventListener("click", () => updateDoctorAdminStatus(button.dataset.adminVerify, true, false));
  });

  ui.adminUserList.querySelectorAll("[data-admin-block]").forEach((button) => {
    button.addEventListener("click", () => {
      const blocked = button.dataset.blocked === "true";
      const verified = button.dataset.verified === "true";
      updateDoctorAdminStatus(button.dataset.adminBlock, verified, blocked);
    });
  });
}

function renderAdminPayments() {
  if (!state.adminPayments.length) {
    ui.adminPaymentList.innerHTML = '<p class="empty-state">No payments loaded.</p>';
    return;
  }

  ui.adminPaymentList.innerHTML = state.adminPayments
    .map(
      (payment) => `
        <article class="notification-item">
          <small>${escapeHtml(payment.method)} | ${escapeHtml(payment.status)}</small>
          <p>${escapeHtml(formatCurrency(payment.amount || 0))} for ${escapeHtml(payment.appointment?.doctor?.name || "doctor visit")}</p>
        </article>
      `
    )
    .join("");
}

function renderAdminAppointments() {
  if (!state.adminAppointments.length) {
    ui.adminAppointmentList.innerHTML = '<p class="empty-state">No appointments loaded.</p>';
    return;
  }

  ui.adminAppointmentList.innerHTML = state.adminAppointments
    .map(
      (appointment) => `
        <article class="stack-item">
          <div class="stack-item-head">
            <div>
              <small>${escapeHtml(appointment.patient?.name || "Patient")} -> ${escapeHtml(appointment.doctor?.name || "Doctor")}</small>
              <h4>${escapeHtml(formatDateTime(appointment.slot))}</h4>
            </div>
            <span class="status-chip ${appointment.status === "confirmed" ? "accent" : "subtle"}">
              ${escapeHtml(appointment.status.replace("_", " "))}
            </span>
          </div>
          <p>${escapeHtml(appointment.reason || "No reason added")}</p>
          <p>Payment: ${escapeHtml(appointment.paymentMethod)} | ${escapeHtml(appointment.paymentStatus)}</p>
        </article>
      `
    )
    .join("");
}

async function loadDoctorDetails(doctorId) {
  const [doctorResult, slotResult] = await Promise.all([
    apiRequest(`/api/doctors/${doctorId}`),
    apiRequest(`/api/doctors/${doctorId}/slots?date=${encodeURIComponent(ui.filterDate.value)}&includeBooked=true`)
  ]);

  state.selectedDoctorId = doctorId;
  state.selectedDoctor = doctorResult.doctor;
  state.selectedDoctorReviews = doctorResult.reviews || [];
  state.selectedDoctorSlots = slotResult.slots || [];

  if (!state.selectedDoctorSlots.some((slot) => slot.id === state.selectedSlotId)) {
    state.selectedSlotId = "";
  }

  renderSelectedDoctor();
}

async function loadSelectedDoctorSlots() {
  if (!state.selectedDoctorId) {
    return;
  }
  const slotResult = await apiRequest(
    `/api/doctors/${state.selectedDoctorId}/slots?date=${encodeURIComponent(ui.filterDate.value)}&includeBooked=true`
  );
  state.selectedDoctorSlots = slotResult.slots || [];
  if (!state.selectedDoctorSlots.some((slot) => slot.id === state.selectedSlotId)) {
    state.selectedSlotId = "";
  }
  renderSelectedDoctor();
}

async function loadDoctors() {
  const params = new URLSearchParams();
  if (ui.filterSpeciality.value) {
    params.set("speciality", ui.filterSpeciality.value);
  }
  if (ui.filterCity.value.trim()) {
    params.set("city", ui.filterCity.value.trim());
  }
  if (ui.doctorSearch.value.trim()) {
    params.set("search", ui.doctorSearch.value.trim());
  }

  const result = await apiRequest(`/api/doctors?${params.toString()}`);
  state.doctors = result.doctors || [];
  renderDoctorResults();

  if (state.selectedDoctorId) {
    const stillPresent = state.doctors.some((doctor) => doctor.id === state.selectedDoctorId);
    if (stillPresent) {
      await loadDoctorDetails(state.selectedDoctorId);
    }
  }
}

async function loadPatientData() {
  if (state.user?.role !== "patient") {
    state.appointments = [];
    state.notifications = [];
    renderAppointments();
    renderNotifications();
    renderRescheduleBanner();
    return;
  }

  const [appointmentsResult, notificationsResult] = await Promise.all([
    apiRequest("/api/appointments/me"),
    apiRequest("/api/notifications/me")
  ]);

  state.appointments = appointmentsResult.appointments || [];
  state.notifications = notificationsResult.notifications || [];
  renderAppointments();
  renderNotifications();
  renderRescheduleBanner();
}

async function loadDoctorWorkspace() {
  if (state.user?.role !== "doctor") {
    state.doctorProfile = null;
    state.doctorSlots = [];
    state.doctorAppointments = [];
    state.doctorDashboard = null;
    renderDoctorDashboard();
    renderDoctorSlots();
    renderDoctorAppointments();
    ui.doctorHistory.innerHTML =
      '<p class="empty-state">Click "Patient History" from a doctor appointment card.</p>';
    return;
  }

  const [profileResult, slotsResult, appointmentsResult] = await Promise.all([
    apiRequest("/api/doctor/profile"),
    apiRequest("/api/doctor/slots"),
    apiRequest("/api/doctor/appointments")
  ]);

  state.doctorProfile = profileResult;
  state.doctorSlots = slotsResult.slots || [];
  state.doctorAppointments = appointmentsResult.appointments || [];
  state.doctorDashboard = appointmentsResult.dashboard || null;

  renderDoctorProfile();
  renderDoctorDashboard();
  renderDoctorSlots();
  renderDoctorAppointments();
}

async function loadAdminWorkspace() {
  if (state.user?.role !== "admin") {
    state.adminUsers = [];
    state.adminPayments = [];
    state.adminAppointments = [];
    state.adminReports = null;
    state.adminActivity = [];
    renderAdminReports();
    renderAdminActivity();
    renderAdminUsers();
    renderAdminPayments();
    renderAdminAppointments();
    return;
  }

  const [usersResult, paymentsResult, appointmentsResult, reportsResult] = await Promise.all([
    apiRequest("/api/admin/users"),
    apiRequest("/api/admin/payments"),
    apiRequest("/api/admin/appointments"),
    apiRequest("/api/admin/reports")
  ]);

  state.adminUsers = usersResult.users || [];
  state.adminPayments = paymentsResult.payments || [];
  state.adminAppointments = appointmentsResult.appointments || [];
  state.adminReports = reportsResult.reports || null;
  state.adminActivity = reportsResult.recentActivity || [];

  renderAdminReports();
  renderAdminActivity();
  renderAdminUsers();
  renderAdminPayments();
  renderAdminAppointments();
}

async function refreshAllRoleData() {
  await Promise.all([loadPatientData(), loadDoctorWorkspace(), loadAdminWorkspace()]);
}

async function syncCurrentUser() {
  const result = await apiRequest("/api/auth/me");
  if (!result.user) {
    clearSession();
  } else {
    saveSession(state.token, result.user);
  }
  renderSession();
}

async function handleLogin(email, password) {
  const result = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  saveSession(result.token, result.user);
  await syncCurrentUser();
  await refreshAllRoleData();
  setMessage(ui.authMessage, `Logged in as ${result.user.name}.`, "success");
}

async function handleRegister() {
  const payload = {
    name: ui.registerName.value.trim(),
    phone: ui.registerPhone.value.trim(),
    email: ui.registerEmail.value.trim(),
    password: ui.registerPassword.value,
    role: ui.registerRole.value,
    speciality: ui.registerSpeciality.value.trim(),
    location: ui.registerLocation.value.trim(),
    fees: Number(ui.registerFees.value || 0)
  };

  const result = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  saveSession(result.token, result.user);
  await syncCurrentUser();
  await Promise.all([loadDoctors(), refreshAllRoleData()]);
  setMessage(ui.registerMessage, `Account created for ${result.user.name}.`, "success");
}

async function updateDoctorAdminStatus(doctorId, verified, blocked) {
  try {
    await apiRequest(`/api/admin/doctors/${doctorId}/verify`, {
      method: "PUT",
      body: JSON.stringify({ verified, blocked })
    });
    setMessage(ui.broadcastFeedback, "Doctor status updated.", "success");
    await Promise.all([loadAdminWorkspace(), loadDoctors()]);
  } catch (error) {
    setMessage(ui.broadcastFeedback, error.message, "error");
  }
}

function updateRegisterRoleFields() {
  const showDoctorFields = ui.registerRole.value === "doctor";
  ui.doctorOnlyFields.forEach((field) => {
    field.classList.toggle("hidden-field", !showDoctorFields);
  });
}

async function bootstrap() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  ui.filterDate.value = tomorrow.toISOString().slice(0, 10);
  ui.doctorSlotDate.value = tomorrow.toISOString().slice(0, 10);

  updateRegisterRoleFields();
  renderSession();

  try {
    const [healthResult, docsResult, specialitiesResult] = await Promise.all([
      apiRequest("/api/health"),
      apiRequest("/api/docs"),
      apiRequest("/api/specialities")
    ]);

    state.health = healthResult;
    state.docs = docsResult.groups || [];
    state.specialities = specialitiesResult.specialities || [];

    renderHealthStatus();
    renderHeroMetrics();
    renderSpecialities();
    renderApiDocs();

    if (state.token) {
      await syncCurrentUser();
    }

    await Promise.all([loadDoctors(), refreshAllRoleData()]);
  } catch (error) {
    setText(ui.healthStatus, "Backend offline");
    setMessage(ui.authMessage, `Could not reach server. Start it with "node server.js". ${error.message}`, "error");
  }
}

ui.loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await handleLogin(ui.loginEmail.value.trim(), ui.loginPassword.value);
  } catch (error) {
    setMessage(ui.authMessage, error.message, "error");
  }
});

ui.logoutButton?.addEventListener("click", async () => {
  clearSession();
  renderSession();
  await refreshAllRoleData();
  setMessage(ui.authMessage, "Logged out locally.", "success");
});

ui.registerRole?.addEventListener("change", updateRegisterRoleFields);

ui.registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await handleRegister();
  } catch (error) {
    setMessage(ui.registerMessage, error.message, "error");
  }
});

ui.demoPatient?.addEventListener("click", async () => {
  try {
    await handleLogin("patient@pulsecare.app", "patient12345");
  } catch (error) {
    setMessage(ui.authMessage, error.message, "error");
  }
});

ui.demoDoctor?.addEventListener("click", async () => {
  try {
    await handleLogin("doctor@pulsecare.app", "doctor12345");
  } catch (error) {
    setMessage(ui.authMessage, error.message, "error");
  }
});

ui.demoAdmin?.addEventListener("click", async () => {
  try {
    await handleLogin("admin@pulsecare.app", "admin12345");
  } catch (error) {
    setMessage(ui.authMessage, error.message, "error");
  }
});

ui.doctorSearchForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await loadDoctors();
  } catch (error) {
    setMessage(ui.bookingMessage, error.message, "error");
  }
});

ui.filterDate?.addEventListener("change", () => {
  loadSelectedDoctorSlots().catch((error) => {
    setMessage(ui.bookingMessage, error.message, "error");
  });
});

ui.bookingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (state.user?.role !== "patient") {
    setMessage(ui.bookingMessage, "Login as a patient to book or reschedule.", "error");
    return;
  }

  if (!state.selectedSlotId) {
    setMessage(ui.bookingMessage, "Select a slot first.", "error");
    return;
  }

  try {
    if (state.rescheduleAppointmentId) {
      await apiRequest(`/api/appointments/${state.rescheduleAppointmentId}/reschedule`, {
        method: "PUT",
        body: JSON.stringify({ slotId: state.selectedSlotId })
      });
      setMessage(ui.bookingMessage, "Appointment rescheduled.", "success");
      state.rescheduleAppointmentId = "";
    } else {
      await apiRequest("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          slotId: state.selectedSlotId,
          paymentMethod: ui.bookingPayment.value,
          reason: ui.bookingReason.value.trim()
        })
      });
      setMessage(ui.bookingMessage, "Appointment booked successfully.", "success");
    }

    ui.bookingReason.value = "";
    state.selectedSlotId = "";
    renderRescheduleBanner();
    await Promise.all([loadPatientData(), loadSelectedDoctorSlots(), apiRequest("/api/health").then((result) => {
      state.health = result;
      renderHeroMetrics();
    })]);
  } catch (error) {
    setMessage(ui.bookingMessage, error.message, "error");
  }
});

ui.clearRescheduleButton?.addEventListener("click", () => {
  state.rescheduleAppointmentId = "";
  renderRescheduleBanner();
  setMessage(ui.bookingMessage, "Reschedule mode cleared. New bookings are active again.", "success");
});

ui.reviewForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ui.reviewAppointmentId.value) {
    setMessage(ui.reviewMessage, "Choose a completed appointment first.", "error");
    return;
  }

  try {
    await apiRequest(`/api/appointments/${ui.reviewAppointmentId.value}/review`, {
      method: "POST",
      body: JSON.stringify({
        rating: Number(ui.reviewRating.value),
        comment: ui.reviewComment.value.trim()
      })
    });
    ui.reviewComment.value = "";
    ui.reviewAppointmentId.value = "";
    setMessage(ui.reviewMessage, "Review submitted.", "success");
    await Promise.all([loadPatientData(), loadSelectedDoctorSlots()]);
  } catch (error) {
    setMessage(ui.reviewMessage, error.message, "error");
  }
});

ui.doctorProfileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await apiRequest("/api/doctor/profile", {
      method: "PUT",
      body: JSON.stringify({
        speciality: ui.doctorSpeciality.value.trim(),
        qualification: ui.doctorQualification.value.trim(),
        experience: Number(ui.doctorExperience.value || 0),
        fees: Number(ui.doctorFees.value || 0),
        location: ui.doctorLocation.value.trim(),
        clinicName: ui.doctorClinicName.value.trim(),
        about: ui.doctorAbout.value.trim(),
        languages: ui.doctorLanguages.value
      })
    });
    setMessage(ui.doctorProfileMessage, "Doctor profile saved.", "success");
    await Promise.all([loadDoctorWorkspace(), loadDoctors()]);
  } catch (error) {
    setMessage(ui.doctorProfileMessage, error.message, "error");
  }
});

ui.doctorSlotForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await apiRequest("/api/doctor/slots", {
      method: "POST",
      body: JSON.stringify({
        date: ui.doctorSlotDate.value,
        startTime: ui.doctorSlotStart.value,
        endTime: ui.doctorSlotEnd.value,
        durationMinutes: Number(ui.doctorSlotDuration.value || 30),
        isClosed: ui.doctorSlotClosed.checked
      })
    });
    ui.doctorSlotStart.value = "";
    ui.doctorSlotEnd.value = "";
    ui.doctorSlotClosed.checked = false;
    setMessage(ui.doctorSlotMessage, "Slot created.", "success");
    await Promise.all([loadDoctorWorkspace(), loadDoctors()]);
  } catch (error) {
    setMessage(ui.doctorSlotMessage, error.message, "error");
  }
});

ui.specialityForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await apiRequest("/api/admin/specialities", {
      method: "POST",
      body: JSON.stringify({ name: ui.specialityName.value.trim() })
    });
    ui.specialityName.value = "";
    setMessage(ui.specialityMessage, "Speciality added.", "success");
    const specialitiesResult = await apiRequest("/api/specialities");
    state.specialities = specialitiesResult.specialities || [];
    renderSpecialities();
  } catch (error) {
    setMessage(ui.specialityMessage, error.message, "error");
  }
});

ui.broadcastForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await apiRequest("/api/admin/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify({
        title: ui.broadcastTitle.value.trim(),
        message: ui.broadcastMessageText.value.trim()
      })
    });
    ui.broadcastTitle.value = "";
    ui.broadcastMessageText.value = "";
    setMessage(ui.broadcastFeedback, "Broadcast sent to all users.", "success");
    await loadAdminWorkspace();
  } catch (error) {
    setMessage(ui.broadcastFeedback, error.message, "error");
  }
});

bootstrap();
