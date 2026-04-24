const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const baseUrl = "http://127.0.0.1:3000";
const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const dbPath = path.join(dataDir, "store.json");
const tempBackupPath = path.join(dataDir, "store.smoke-backup.json");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathname} failed: ${json.error || response.statusText}`);
  }
  return json;
}

async function backupDatabase() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.copyFile(dbPath, tempBackupPath);
    return true;
  } catch {
    return false;
  }
}

async function restoreDatabase(hadBackup) {
  if (hadBackup) {
    await fs.copyFile(tempBackupPath, dbPath);
    await fs.unlink(tempBackupPath).catch(() => {});
    return;
  }

  await fs.unlink(dbPath).catch(() => {});
}

async function waitForServer() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await request("/api/health");
      return;
    } catch {
      await wait(500);
    }
  }
  throw new Error("Server did not become ready in time.");
}

async function run() {
  const hadBackup = await backupDatabase();
  const server = spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    stdio: "ignore"
  });

  try {
    await waitForServer();

    const health = await request("/api/health");
    if (health.status !== "ok") {
      throw new Error("Health endpoint did not return ok.");
    }

    const docs = await request("/api/docs");
    if (!Array.isArray(docs.groups) || docs.groups.length === 0) {
      throw new Error("API docs payload is missing endpoint groups.");
    }

    const stamp = Date.now();
    const doctorEmail = `doctor.${stamp}@pulsecare.app`;
    const patientEmail = `patient.${stamp}@pulsecare.app`;

    const adminLogin = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@pulsecare.app",
        password: "admin12345"
      })
    });
    const adminHeaders = { Authorization: `Bearer ${adminLogin.token}` };

    const doctorRegister = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Smoke Doctor",
        phone: "+91-9333333333",
        email: doctorEmail,
        password: "DoctorPass123",
        role: "doctor",
        speciality: "Neurologist",
        location: "Pune",
        fees: 1100
      })
    });
    const doctorHeaders = { Authorization: `Bearer ${doctorRegister.token}` };

    const publicBefore = await request("/api/doctors?search=Smoke");
    if (publicBefore.doctors.some((doctor) => doctor.email === doctorEmail)) {
      throw new Error("Unverified doctor is unexpectedly visible in public search.");
    }

    await request(`/api/admin/doctors/${doctorRegister.user.id}/verify`, {
      method: "PUT",
      headers: {
        ...adminHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ verified: true, blocked: false })
    });

    await request("/api/doctor/slots", {
      method: "POST",
      headers: {
        ...doctorHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date: "2026-05-01",
        startTime: "09:00",
        endTime: "09:30",
        durationMinutes: 30,
        isClosed: false
      })
    });

    await request("/api/doctor/slots", {
      method: "POST",
      headers: {
        ...doctorHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date: "2026-05-02",
        startTime: "10:00",
        endTime: "10:30",
        durationMinutes: 30,
        isClosed: false
      })
    });

    const doctorSlots = await request("/api/doctor/slots", {
      headers: doctorHeaders
    });
    if (doctorSlots.slots.length < 2) {
      throw new Error("Doctor slot creation did not persist.");
    }

    const patientRegister = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Smoke Patient",
        phone: "+91-9444444444",
        email: patientEmail,
        password: "PatientPass123",
        role: "patient"
      })
    });
    const patientHeaders = { Authorization: `Bearer ${patientRegister.token}` };

    const publicAfter = await request("/api/doctors?search=Smoke");
    const smokeDoctor = publicAfter.doctors.find((doctor) => doctor.email === doctorEmail);
    if (!smokeDoctor) {
      throw new Error("Verified doctor is not visible in public search.");
    }

    const slotOne = doctorSlots.slots.find((slot) => slot.date === "2026-05-01");
    const slotTwo = doctorSlots.slots.find((slot) => slot.date === "2026-05-02");
    if (!slotOne || !slotTwo) {
      throw new Error("Expected smoke test slots were not found.");
    }

    const booked = await request("/api/appointments", {
      method: "POST",
      headers: {
        ...patientHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slotId: slotOne.id,
        paymentMethod: "online",
        reason: "Smoke test booking"
      })
    });

    const appointmentId = booked.appointment.id;

    const rescheduled = await request(`/api/appointments/${appointmentId}/reschedule`, {
      method: "PUT",
      headers: {
        ...patientHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slotId: slotTwo.id
      })
    });

    if (rescheduled.appointment.slot.id !== slotTwo.id) {
      throw new Error("Reschedule flow did not attach the new slot.");
    }

    await request(`/api/doctor/appointments/${appointmentId}/status`, {
      method: "PUT",
      headers: {
        ...doctorHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "completed"
      })
    });

    const review = await request(`/api/appointments/${appointmentId}/review`, {
      method: "POST",
      headers: {
        ...patientHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rating: 5,
        comment: "Smoke test review"
      })
    });
    if (!review.review?.id) {
      throw new Error("Review flow did not return a review id.");
    }

    const history = await request(`/api/doctor/patients/${patientRegister.user.id}/history`, {
      headers: doctorHeaders
    });
    if (!history.history?.length) {
      throw new Error("Doctor patient history is empty after completed appointment.");
    }

    await request("/api/admin/notifications/broadcast", {
      method: "POST",
      headers: {
        ...adminHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "Smoke Test Broadcast",
        message: "Broadcast pipeline verified."
      })
    });

    const reports = await request("/api/admin/reports", {
      headers: adminHeaders
    });
    if (reports.reports.totalUsers < 2) {
      throw new Error("Admin reports returned an invalid totalUsers value.");
    }

    console.log("Smoke test passed.");
  } finally {
    server.kill("SIGTERM");
    await wait(500);
    await restoreDatabase(hadBackup);
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
