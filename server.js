const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const DB_PATH = path.join(DATA_DIR, "store.json");
const LEGACY_DB_PATH = path.join(DATA_DIR, "store.legacy.json");
const SCHEMA_VERSION = "doctor-appointment-v1";
const STATIC_FILES = new Set(["/", "/index.html", "/styles.css", "/script.js", "/README.md"]);
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

let writeChain = Promise.resolve();

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function toIsoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function atTime(dateText, timeText) {
  return new Date(`${dateText}T${timeText}:00.000Z`);
}

function datePlusDays(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

function createNotification(userId, title, message, type = "info", channels = ["in_app"]) {
  return {
    id: createId("ntf"),
    userId,
    title,
    message,
    type,
    channels,
    createdAt: new Date().toISOString(),
    readAt: null
  };
}

function createPayment(appointmentId, method, amount, status) {
  return {
    id: createId("pay"),
    appointmentId,
    method,
    amount,
    status,
    paidAt: status === "paid" ? new Date().toISOString() : null,
    createdAt: new Date().toISOString()
  };
}

function buildInitialDatabase() {
  const today = datePlusDays(0);
  const tomorrow = datePlusDays(1);
  const dayAfter = datePlusDays(2);
  const yesterday = datePlusDays(-1);

  const users = [
    {
      id: "usr_admin_seed",
      name: "Rama Admin",
      email: "admin@pulsecare.app",
      passwordHash: hashPassword("admin12345"),
      role: "admin",
      phone: "+91-9000000001",
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    },
    {
      id: "usr_patient_seed",
      name: "Neha Sharma",
      email: "patient@pulsecare.app",
      passwordHash: hashPassword("patient12345"),
      role: "patient",
      phone: "+91-9000000002",
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    },
    {
      id: "usr_doctor_seed",
      name: "Dr. Arjun Mehta",
      email: "doctor@pulsecare.app",
      passwordHash: hashPassword("doctor12345"),
      role: "doctor",
      phone: "+91-9000000003",
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    },
    {
      id: "usr_doctor_seed_2",
      name: "Dr. Sana Kapoor",
      email: "sana@pulsecare.app",
      passwordHash: hashPassword("doctor12345"),
      role: "doctor",
      phone: "+91-9000000004",
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    },
    {
      id: "usr_patient_seed_2",
      name: "Rohit Verma",
      email: "rohit@pulsecare.app",
      passwordHash: hashPassword("patient12345"),
      role: "patient",
      phone: "+91-9000000005",
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    }
  ];

  const specialities = [
    { id: "spec_cardio", name: "Cardiologist", createdAt: new Date().toISOString() },
    { id: "spec_derma", name: "Dermatologist", createdAt: new Date().toISOString() },
    { id: "spec_pedia", name: "Pediatrician", createdAt: new Date().toISOString() },
    { id: "spec_neuro", name: "Neurologist", createdAt: new Date().toISOString() }
  ];

  const doctorProfiles = [
    {
      id: "doc_profile_seed",
      userId: "usr_doctor_seed",
      speciality: "Cardiologist",
      qualification: "MBBS, MD Cardiology",
      experience: 11,
      fees: 900,
      location: "Bengaluru",
      clinicName: "PulseCare Heart Centre",
      about:
        "Focused on preventive cardiology, hypertension management, and long-term patient follow-up.",
      languages: ["Hindi", "English"],
      rating: 4.8,
      reviewCount: 1,
      image:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80",
      verified: true,
      blocked: false,
      breakDays: ["Sunday"],
      closedDates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "doc_profile_seed_2",
      userId: "usr_doctor_seed_2",
      speciality: "Dermatologist",
      qualification: "MBBS, MD Dermatology",
      experience: 8,
      fees: 700,
      location: "Mumbai",
      clinicName: "SkinSpring Clinic",
      about: "Consults for acne, hair loss, eczema, and tele-dermatology follow-up visits.",
      languages: ["Hindi", "English", "Marathi"],
      rating: 4.6,
      reviewCount: 0,
      image:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80",
      verified: false,
      blocked: false,
      breakDays: ["Saturday"],
      closedDates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const patientProfiles = [
    {
      id: "pat_profile_seed",
      userId: "usr_patient_seed",
      medicalHistory: "Mild hypertension. Allergic to penicillin.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "pat_profile_seed_2",
      userId: "usr_patient_seed_2",
      medicalHistory: "Seasonal allergies.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const slots = [
    {
      id: "slot_seed_1",
      doctorId: "usr_doctor_seed",
      date: tomorrow,
      startTime: "09:00",
      endTime: "09:30",
      durationMinutes: 30,
      isBooked: true,
      isClosed: false,
      appointmentId: "apt_seed_1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "slot_seed_2",
      doctorId: "usr_doctor_seed",
      date: tomorrow,
      startTime: "10:00",
      endTime: "10:30",
      durationMinutes: 30,
      isBooked: false,
      isClosed: false,
      appointmentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "slot_seed_3",
      doctorId: "usr_doctor_seed",
      date: dayAfter,
      startTime: "11:00",
      endTime: "11:30",
      durationMinutes: 30,
      isBooked: false,
      isClosed: false,
      appointmentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "slot_seed_4",
      doctorId: "usr_doctor_seed_2",
      date: tomorrow,
      startTime: "15:00",
      endTime: "15:30",
      durationMinutes: 30,
      isBooked: false,
      isClosed: false,
      appointmentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "slot_seed_5",
      doctorId: "usr_doctor_seed_2",
      date: dayAfter,
      startTime: "16:00",
      endTime: "16:30",
      durationMinutes: 30,
      isBooked: false,
      isClosed: true,
      appointmentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "slot_seed_6",
      doctorId: "usr_doctor_seed",
      date: yesterday,
      startTime: "09:00",
      endTime: "09:30",
      durationMinutes: 30,
      isBooked: true,
      isClosed: false,
      appointmentId: "apt_seed_2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const appointments = [
    {
      id: "apt_seed_1",
      patientId: "usr_patient_seed",
      doctorId: "usr_doctor_seed",
      slotId: "slot_seed_1",
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "online",
      bookingDate: new Date().toISOString(),
      reason: "Routine heart health follow-up",
      reminderChannels: ["email", "sms", "in_app"],
      meetingLink: "https://meet.pulsecare.app/apt_seed_1",
      rescheduledFromSlotId: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "apt_seed_2",
      patientId: "usr_patient_seed",
      doctorId: "usr_doctor_seed",
      slotId: "slot_seed_6",
      status: "completed",
      paymentStatus: "pending_cash",
      paymentMethod: "cash",
      bookingDate: new Date().toISOString(),
      reason: "Chest discomfort consultation",
      reminderChannels: ["in_app"],
      meetingLink: null,
      rescheduledFromSlotId: null,
      completedAt: new Date().toISOString(),
      cancelledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const reviews = [
    {
      id: "rev_seed_1",
      appointmentId: "apt_seed_2",
      patientId: "usr_patient_seed",
      doctorId: "usr_doctor_seed",
      rating: 5,
      comment: "Very clear explanation and a smooth booking experience.",
      createdAt: new Date().toISOString()
    }
  ];

  const payments = [
    createPayment("apt_seed_1", "online", 900, "paid"),
    createPayment("apt_seed_2", "cash", 900, "pending_cash")
  ];

  const notifications = [
    createNotification(
      "usr_patient_seed",
      "Appointment confirmed",
      "Your consultation with Dr. Arjun Mehta has been confirmed for tomorrow at 09:00.",
      "appointment",
      ["email", "sms", "in_app"]
    ),
    createNotification(
      "usr_doctor_seed",
      "New booking received",
      "Neha Sharma booked the 09:00 slot for tomorrow.",
      "appointment",
      ["in_app"]
    ),
    createNotification(
      "usr_admin_seed",
      "Doctor pending verification",
      "Dr. Sana Kapoor is waiting for approval in the admin panel.",
      "admin",
      ["in_app"]
    )
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    users,
    specialities,
    doctorProfiles,
    patientProfiles,
    timeSlots: slots,
    appointments,
    reviews,
    payments,
    notifications,
    sessions: [],
    activityLog: []
  };
}

function parseJsonSafe(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function ensureDatabase() {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DB_PATH)) {
    await fsp.writeFile(DB_PATH, JSON.stringify(buildInitialDatabase(), null, 2), "utf8");
    return;
  }

  const raw = await fsp.readFile(DB_PATH, "utf8");
  const parsed = parseJsonSafe(raw, null);

  if (parsed?.schemaVersion === SCHEMA_VERSION) {
    return;
  }

  if (!fs.existsSync(LEGACY_DB_PATH)) {
    await fsp.writeFile(LEGACY_DB_PATH, raw, "utf8");
  }

  await fsp.writeFile(DB_PATH, JSON.stringify(buildInitialDatabase(), null, 2), "utf8");
}

async function readDatabase() {
  await ensureDatabase();
  const file = await fsp.readFile(DB_PATH, "utf8");
  return parseJsonSafe(file, buildInitialDatabase());
}

async function writeDatabase(data) {
  writeChain = writeChain.then(() => fsp.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8"));
  await writeChain;
  return data;
}

async function parseBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk.toString("utf8");
      if (raw.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload, null, 2));
}

async function sendStaticFile(response, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(ROOT_DIR, safePath.replace(/^\//, ""));

  if (!STATIC_FILES.has(safePath) || !filePath.startsWith(ROOT_DIR)) {
    sendJson(response, 404, { error: "File not found." });
    return;
  }

  try {
    const content = await fsp.readFile(filePath);
    const type = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "File not found." });
  }
}

function getUrl(request) {
  return new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
}

function getSessionToken(request) {
  const header = request.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

function getDoctorProfile(db, doctorId) {
  return db.doctorProfiles.find((profile) => profile.userId === doctorId) || null;
}

function getPatientProfile(db, patientId) {
  return db.patientProfiles.find((profile) => profile.userId === patientId) || null;
}

function getAppointmentSlot(db, appointment) {
  return db.timeSlots.find((slot) => slot.id === appointment.slotId) || null;
}

function getReviewForAppointment(db, appointmentId) {
  return db.reviews.find((review) => review.appointmentId === appointmentId) || null;
}

function computeDoctorRating(db, doctorId) {
  const doctorReviews = db.reviews.filter((review) => review.doctorId === doctorId);
  if (!doctorReviews.length) {
    return { rating: 0, reviewCount: 0 };
  }

  const rating = Number(
    (
      doctorReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / doctorReviews.length
    ).toFixed(1)
  );

  return { rating, reviewCount: doctorReviews.length };
}

function enrichDoctor(db, doctorUser) {
  const profile = getDoctorProfile(db, doctorUser.id);
  if (!profile) {
    return sanitizeUser(doctorUser);
  }

  const { rating, reviewCount } = computeDoctorRating(db, doctorUser.id);
  const slots = db.timeSlots.filter((slot) => slot.doctorId === doctorUser.id);
  const nextOpenSlot = slots
    .filter((slot) => !slot.isBooked && !slot.isClosed)
    .sort((left, right) => atTime(left.date, left.startTime) - atTime(right.date, right.startTime))[0];

  return {
    ...sanitizeUser(doctorUser),
    speciality: profile.speciality,
    qualification: profile.qualification,
    experience: profile.experience,
    fees: profile.fees,
    location: profile.location,
    clinicName: profile.clinicName,
    about: profile.about,
    languages: profile.languages,
    image: profile.image,
    verified: profile.verified,
    blocked: profile.blocked,
    breakDays: profile.breakDays,
    closedDates: profile.closedDates,
    rating,
    reviewCount,
    nextAvailableSlot: nextOpenSlot
      ? `${nextOpenSlot.date} ${nextOpenSlot.startTime}-${nextOpenSlot.endTime}`
      : "No open slots"
  };
}

function enrichAppointment(db, appointment) {
  const patient = db.users.find((user) => user.id === appointment.patientId);
  const doctor = db.users.find((user) => user.id === appointment.doctorId);
  const slot = getAppointmentSlot(db, appointment);
  const doctorProfile = doctor ? getDoctorProfile(db, doctor.id) : null;
  const review = getReviewForAppointment(db, appointment.id);

  return {
    ...appointment,
    patient: patient ? sanitizeUser(patient) : null,
    patientProfile: patient ? getPatientProfile(db, patient.id) : null,
    doctor: doctor ? enrichDoctor(db, doctor) : null,
    doctorProfile,
    slot,
    review
  };
}

function summarizeReports(db) {
  const totalUsers = db.users.length;
  const patients = db.users.filter((user) => user.role === "patient").length;
  const doctors = db.users.filter((user) => user.role === "doctor").length;
  const verifiedDoctors = db.doctorProfiles.filter((profile) => profile.verified && !profile.blocked).length;
  const blockedDoctors = db.doctorProfiles.filter((profile) => profile.blocked).length;
  const appointments = db.appointments.length;
  const confirmedAppointments = db.appointments.filter((item) => item.status === "confirmed").length;
  const completedAppointments = db.appointments.filter((item) => item.status === "completed").length;
  const cancelledAppointments = db.appointments.filter((item) => item.status === "cancelled").length;
  const noShowAppointments = db.appointments.filter((item) => item.status === "no_show").length;
  const totalRevenue = db.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const specialtyBreakdown = db.specialities.map((speciality) => ({
    speciality: speciality.name,
    doctors: db.doctorProfiles.filter((profile) => profile.speciality === speciality.name).length
  }));

  return {
    totalUsers,
    patients,
    doctors,
    verifiedDoctors,
    blockedDoctors,
    appointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    totalRevenue,
    specialtyBreakdown
  };
}

function recordActivity(db, actorId, action, meta = {}) {
  db.activityLog.unshift({
    id: createId("log"),
    actorId,
    action,
    meta,
    createdAt: new Date().toISOString()
  });
  db.activityLog = db.activityLog.slice(0, 100);
}

function getActiveUser(request, db) {
  const token = getSessionToken(request);
  if (!token) {
    return null;
  }

  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) {
    return null;
  }

  return db.users.find((user) => user.id === session.userId) || null;
}

function requireUser(request, response, db, roles = []) {
  const user = getActiveUser(request, db);
  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return null;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    sendJson(response, 403, { error: "You do not have permission for this action." });
    return null;
  }

  const doctorProfile = user.role === "doctor" ? getDoctorProfile(db, user.id) : null;
  if (doctorProfile?.blocked) {
    sendJson(response, 403, { error: "Doctor account is blocked by admin." });
    return null;
  }

  return user;
}

function validateTimeRange(startTime, endTime) {
  return /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && startTime < endTime;
}

function createUserSession(db, user) {
  const token = createId("session");
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString()
  });
  return token;
}

async function handleRegister(request, response) {
  const db = await readDatabase();
  const body = await parseBody(request);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const phone = String(body.phone || "").trim();
  const role = String(body.role || "patient").trim().toLowerCase();

  if (!name || !email || !password || !phone) {
    sendJson(response, 400, { error: "name, email, password, and phone are required." });
    return;
  }

  if (!["patient", "doctor"].includes(role)) {
    sendJson(response, 400, { error: "role must be patient or doctor." });
    return;
  }

  if (db.users.some((user) => user.email === email)) {
    sendJson(response, 409, { error: "An account with that email already exists." });
    return;
  }

  const user = {
    id: createId("usr"),
    name,
    email,
    passwordHash: hashPassword(password),
    role,
    phone,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  db.users.push(user);

  if (role === "patient") {
    db.patientProfiles.push({
      id: createId("pat"),
      userId: user.id,
      medicalHistory: String(body.medicalHistory || "").trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (role === "doctor") {
    db.doctorProfiles.push({
      id: createId("doc"),
      userId: user.id,
      speciality: String(body.speciality || "").trim() || "General Physician",
      qualification: String(body.qualification || "").trim() || "MBBS",
      experience: Number(body.experience || 1),
      fees: Number(body.fees || 500),
      location: String(body.location || "").trim() || "Remote",
      clinicName: String(body.clinicName || "").trim() || "Independent Practice",
      about: String(body.about || "").trim() || "New doctor onboarding profile.",
      languages: Array.isArray(body.languages) && body.languages.length ? body.languages : ["Hindi", "English"],
      image: String(body.image || "").trim(),
      verified: false,
      blocked: false,
      breakDays: [],
      closedDates: [],
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    db.notifications.push(
      createNotification(
        "usr_admin_seed",
        "New doctor registration",
        `${user.name} registered and is awaiting verification.`,
        "admin",
        ["in_app"]
      )
    );
  }

  const token = createUserSession(db, user);
  recordActivity(db, user.id, "user_registered", { role });

  await writeDatabase(db);
  sendJson(response, 201, {
    message: "Account created successfully.",
    token,
    user: sanitizeUser(user)
  });
}

async function handleLogin(request, response) {
  const db = await readDatabase();
  const body = await parseBody(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = db.users.find((entry) => entry.email === email);

  if (!user || user.passwordHash !== hashPassword(password)) {
    sendJson(response, 401, { error: "Invalid email or password." });
    return;
  }

  const doctorProfile = user.role === "doctor" ? getDoctorProfile(db, user.id) : null;
  if (doctorProfile?.blocked) {
    sendJson(response, 403, { error: "Doctor account has been blocked by admin." });
    return;
  }

  user.lastLoginAt = new Date().toISOString();
  const token = createUserSession(db, user);
  recordActivity(db, user.id, "user_logged_in");

  await writeDatabase(db);
  sendJson(response, 200, {
    message: "Login successful.",
    token,
    user: sanitizeUser(user)
  });
}

async function handleGetCurrentUser(request, response) {
  const db = await readDatabase();
  const user = getActiveUser(request, db);

  if (!user) {
    sendJson(response, 200, { user: null });
    return;
  }

  const payload = {
    ...sanitizeUser(user),
    doctorProfile: user.role === "doctor" ? getDoctorProfile(db, user.id) : null,
    patientProfile: user.role === "patient" ? getPatientProfile(db, user.id) : null
  };

  sendJson(response, 200, { user: payload });
}

async function handleHealth(response) {
  const db = await readDatabase();
  sendJson(response, 200, {
    status: "ok",
    product: "PulseCare Doctor Appointment App",
    schemaVersion: db.schemaVersion,
    timestamp: new Date().toISOString(),
    stats: summarizeReports(db)
  });
}

async function handleGetSpecialities(response) {
  const db = await readDatabase();
  sendJson(response, 200, { specialities: db.specialities });
}

async function handleGetDoctors(response, url) {
  const db = await readDatabase();
  const speciality = String(url.searchParams.get("speciality") || "").trim().toLowerCase();
  const city = String(url.searchParams.get("city") || "").trim().toLowerCase();
  const search = String(url.searchParams.get("search") || "").trim().toLowerCase();
  const verifiedOnly = String(url.searchParams.get("verifiedOnly") || "true").toLowerCase() !== "false";
  const doctors = db.users
    .filter((user) => user.role === "doctor")
    .map((user) => enrichDoctor(db, user))
    .filter((doctor) => {
      if (verifiedOnly && !doctor.verified) {
        return false;
      }
      if (doctor.blocked) {
        return false;
      }
      if (speciality && !String(doctor.speciality || "").toLowerCase().includes(speciality)) {
        return false;
      }
      if (city && !String(doctor.location || "").toLowerCase().includes(city)) {
        return false;
      }
      if (
        search &&
        ![doctor.name, doctor.speciality, doctor.location, doctor.clinicName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search))
      ) {
        return false;
      }
      return true;
    })
    .sort((left, right) => right.rating - left.rating || left.fees - right.fees);

  sendJson(response, 200, { doctors });
}

async function handleGetDoctor(response, doctorId) {
  const db = await readDatabase();
  const doctor = db.users.find((user) => user.id === doctorId && user.role === "doctor");
  if (!doctor) {
    sendJson(response, 404, { error: "Doctor not found." });
    return;
  }

  const profile = enrichDoctor(db, doctor);
  const reviews = db.reviews
    .filter((review) => review.doctorId === doctorId)
    .map((review) => ({
      ...review,
      patient: sanitizeUser(db.users.find((user) => user.id === review.patientId) || { id: "", name: "Unknown" })
    }))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  sendJson(response, 200, {
    doctor: profile,
    reviews
  });
}

async function handleGetDoctorSlots(response, doctorId, url) {
  const db = await readDatabase();
  const doctor = db.users.find((user) => user.id === doctorId && user.role === "doctor");
  if (!doctor) {
    sendJson(response, 404, { error: "Doctor not found." });
    return;
  }

  const date = String(url.searchParams.get("date") || "").trim();
  const includeBooked = String(url.searchParams.get("includeBooked") || "").toLowerCase() === "true";

  const slots = db.timeSlots
    .filter((slot) => slot.doctorId === doctorId)
    .filter((slot) => (date ? slot.date === date : true))
    .filter((slot) => (includeBooked ? true : !slot.isBooked))
    .sort((left, right) => atTime(left.date, left.startTime) - atTime(right.date, right.startTime));

  sendJson(response, 200, { slots });
}

async function handleCreateAppointment(request, response) {
  const db = await readDatabase();
  const patient = requireUser(request, response, db, ["patient"]);
  if (!patient) {
    return;
  }

  const body = await parseBody(request);
  const slotId = String(body.slotId || "").trim();
  const paymentMethod = String(body.paymentMethod || "cash").trim().toLowerCase();
  const reason = String(body.reason || "").trim();
  const slot = db.timeSlots.find((entry) => entry.id === slotId);

  if (!slot) {
    sendJson(response, 404, { error: "Slot not found." });
    return;
  }

  if (slot.isBooked || slot.isClosed) {
    sendJson(response, 409, { error: "Selected slot is not available." });
    return;
  }

  const doctorProfile = getDoctorProfile(db, slot.doctorId);
  if (!doctorProfile || !doctorProfile.verified || doctorProfile.blocked) {
    sendJson(response, 400, { error: "Doctor is not available for booking." });
    return;
  }

  const appointment = {
    id: createId("apt"),
    patientId: patient.id,
    doctorId: slot.doctorId,
    slotId: slot.id,
    status: "confirmed",
    paymentStatus: paymentMethod === "online" ? "paid" : "pending_cash",
    paymentMethod,
    bookingDate: new Date().toISOString(),
    reason,
    reminderChannels: ["email", "sms", "in_app"],
    meetingLink: paymentMethod === "online" ? `https://meet.pulsecare.app/${slot.id}` : null,
    rescheduledFromSlotId: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  slot.isBooked = true;
  slot.appointmentId = appointment.id;
  slot.updatedAt = new Date().toISOString();
  db.appointments.push(appointment);
  db.payments.push(createPayment(appointment.id, paymentMethod, Number(doctorProfile.fees || 0), appointment.paymentStatus));

  db.notifications.push(
    createNotification(
      patient.id,
      "Appointment booked",
      `Your appointment with ${db.users.find((user) => user.id === slot.doctorId)?.name || "the doctor"} is confirmed for ${slot.date} at ${slot.startTime}.`,
      "appointment",
      ["email", "sms", "in_app"]
    ),
    createNotification(
      slot.doctorId,
      "New patient booking",
      `${patient.name} booked ${slot.date} ${slot.startTime}-${slot.endTime}.`,
      "appointment",
      ["in_app"]
    )
  );

  recordActivity(db, patient.id, "appointment_booked", { appointmentId: appointment.id, slotId: slot.id });

  await writeDatabase(db);
  sendJson(response, 201, {
    message: "Appointment booked successfully.",
    appointment: enrichAppointment(db, appointment)
  });
}

async function handleGetMyAppointments(request, response) {
  const db = await readDatabase();
  const user = requireUser(request, response, db, ["patient", "doctor", "admin"]);
  if (!user) {
    return;
  }

  let appointments = db.appointments;
  if (user.role === "patient") {
    appointments = appointments.filter((appointment) => appointment.patientId === user.id);
  }
  if (user.role === "doctor") {
    appointments = appointments.filter((appointment) => appointment.doctorId === user.id);
  }

  appointments = appointments
    .map((appointment) => enrichAppointment(db, appointment))
    .sort((left, right) => {
      const leftSlot = left.slot || { date: "9999-12-31", startTime: "23:59" };
      const rightSlot = right.slot || { date: "9999-12-31", startTime: "23:59" };
      return atTime(rightSlot.date, rightSlot.startTime) - atTime(leftSlot.date, leftSlot.startTime);
    });

  sendJson(response, 200, { appointments });
}

async function handleCancelAppointment(request, response, appointmentId) {
  const db = await readDatabase();
  const user = requireUser(request, response, db, ["patient", "admin"]);
  if (!user) {
    return;
  }

  const appointment = db.appointments.find((entry) => entry.id === appointmentId);
  if (!appointment) {
    sendJson(response, 404, { error: "Appointment not found." });
    return;
  }

  if (user.role === "patient" && appointment.patientId !== user.id) {
    sendJson(response, 403, { error: "You can only cancel your own appointments." });
    return;
  }

  if (["completed", "cancelled", "no_show"].includes(appointment.status)) {
    sendJson(response, 400, { error: "Appointment can no longer be cancelled." });
    return;
  }

  appointment.status = "cancelled";
  appointment.cancelledAt = new Date().toISOString();
  appointment.updatedAt = new Date().toISOString();

  const slot = getAppointmentSlot(db, appointment);
  if (slot) {
    slot.isBooked = false;
    slot.appointmentId = null;
    slot.updatedAt = new Date().toISOString();
  }

  db.notifications.push(
    createNotification(
      appointment.patientId,
      "Appointment cancelled",
      `Your appointment scheduled on ${slot?.date || "the selected date"} has been cancelled.`,
      "appointment",
      ["email", "in_app"]
    ),
    createNotification(
      appointment.doctorId,
      "Appointment cancelled",
      `A patient cancelled the ${slot?.date || ""} ${slot?.startTime || ""} slot.`,
      "appointment",
      ["in_app"]
    )
  );

  recordActivity(db, user.id, "appointment_cancelled", { appointmentId });

  await writeDatabase(db);
  sendJson(response, 200, {
    message: "Appointment cancelled.",
    appointment: enrichAppointment(db, appointment)
  });
}

async function handleRescheduleAppointment(request, response, appointmentId) {
  const db = await readDatabase();
  const patient = requireUser(request, response, db, ["patient"]);
  if (!patient) {
    return;
  }

  const appointment = db.appointments.find((entry) => entry.id === appointmentId);
  if (!appointment) {
    sendJson(response, 404, { error: "Appointment not found." });
    return;
  }

  if (appointment.patientId !== patient.id) {
    sendJson(response, 403, { error: "You can only reschedule your own appointments." });
    return;
  }

  if (appointment.status !== "confirmed") {
    sendJson(response, 400, { error: "Only confirmed appointments can be rescheduled." });
    return;
  }

  const body = await parseBody(request);
  const newSlotId = String(body.slotId || "").trim();
  const newSlot = db.timeSlots.find((slot) => slot.id === newSlotId);
  if (!newSlot) {
    sendJson(response, 404, { error: "New slot not found." });
    return;
  }

  if (newSlot.doctorId !== appointment.doctorId) {
    sendJson(response, 400, { error: "Rescheduling is limited to the same doctor in this MVP." });
    return;
  }

  if (newSlot.isBooked || newSlot.isClosed) {
    sendJson(response, 409, { error: "Selected new slot is not available." });
    return;
  }

  const oldSlot = getAppointmentSlot(db, appointment);
  if (oldSlot) {
    oldSlot.isBooked = false;
    oldSlot.appointmentId = null;
    oldSlot.updatedAt = new Date().toISOString();
  }

  newSlot.isBooked = true;
  newSlot.appointmentId = appointment.id;
  newSlot.updatedAt = new Date().toISOString();

  appointment.rescheduledFromSlotId = appointment.slotId;
  appointment.slotId = newSlot.id;
  appointment.updatedAt = new Date().toISOString();

  db.notifications.push(
    createNotification(
      appointment.patientId,
      "Appointment rescheduled",
      `Your visit has been moved to ${newSlot.date} at ${newSlot.startTime}.`,
      "appointment",
      ["sms", "email", "in_app"]
    ),
    createNotification(
      appointment.doctorId,
      "Patient rescheduled",
      `A patient moved their appointment to ${newSlot.date} ${newSlot.startTime}.`,
      "appointment",
      ["in_app"]
    )
  );

  recordActivity(db, patient.id, "appointment_rescheduled", { appointmentId, newSlotId });

  await writeDatabase(db);
  sendJson(response, 200, {
    message: "Appointment rescheduled successfully.",
    appointment: enrichAppointment(db, appointment)
  });
}

async function handleSubmitReview(request, response, appointmentId) {
  const db = await readDatabase();
  const patient = requireUser(request, response, db, ["patient"]);
  if (!patient) {
    return;
  }

  const appointment = db.appointments.find((entry) => entry.id === appointmentId);
  if (!appointment) {
    sendJson(response, 404, { error: "Appointment not found." });
    return;
  }

  if (appointment.patientId !== patient.id) {
    sendJson(response, 403, { error: "You can only review your own completed appointments." });
    return;
  }

  if (appointment.status !== "completed") {
    sendJson(response, 400, { error: "Reviews are allowed only after appointment completion." });
    return;
  }

  if (getReviewForAppointment(db, appointment.id)) {
    sendJson(response, 409, { error: "A review already exists for this appointment." });
    return;
  }

  const body = await parseBody(request);
  const rating = Number(body.rating || 0);
  const comment = String(body.comment || "").trim();

  if (rating < 1 || rating > 5) {
    sendJson(response, 400, { error: "rating must be between 1 and 5." });
    return;
  }

  const review = {
    id: createId("rev"),
    appointmentId,
    patientId: patient.id,
    doctorId: appointment.doctorId,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };

  db.reviews.push(review);

  const doctorProfile = getDoctorProfile(db, appointment.doctorId);
  if (doctorProfile) {
    const { rating: averageRating, reviewCount } = computeDoctorRating(db, appointment.doctorId);
    doctorProfile.rating = averageRating;
    doctorProfile.reviewCount = reviewCount;
    doctorProfile.updatedAt = new Date().toISOString();
  }

  db.notifications.push(
    createNotification(
      appointment.doctorId,
      "New patient review",
      `${patient.name} left a ${rating}/5 review.`,
      "review",
      ["in_app"]
    )
  );

  recordActivity(db, patient.id, "review_submitted", { appointmentId, rating });

  await writeDatabase(db);
  sendJson(response, 201, {
    message: "Review submitted.",
    review
  });
}

async function handleGetNotifications(request, response) {
  const db = await readDatabase();
  const user = requireUser(request, response, db, ["patient", "doctor", "admin"]);
  if (!user) {
    return;
  }

  const notifications = db.notifications
    .filter((notification) => notification.userId === user.id)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 8);

  sendJson(response, 200, { notifications });
}

async function handleGetDoctorWorkspace(request, response) {
  const db = await readDatabase();
  const doctor = requireUser(request, response, db, ["doctor"]);
  if (!doctor) {
    return;
  }

  sendJson(response, 200, {
    doctor: enrichDoctor(db, doctor),
    profile: getDoctorProfile(db, doctor.id)
  });
}

async function handleUpdateDoctorProfile(request, response) {
  const db = await readDatabase();
  const doctor = requireUser(request, response, db, ["doctor"]);
  if (!doctor) {
    return;
  }

  const profile = getDoctorProfile(db, doctor.id);
  if (!profile) {
    sendJson(response, 404, { error: "Doctor profile not found." });
    return;
  }

  const body = await parseBody(request);
  profile.speciality = String(body.speciality || profile.speciality).trim();
  profile.qualification = String(body.qualification || profile.qualification).trim();
  profile.experience = Number(body.experience ?? profile.experience);
  profile.fees = Number(body.fees ?? profile.fees);
  profile.location = String(body.location || profile.location).trim();
  profile.clinicName = String(body.clinicName || profile.clinicName).trim();
  profile.about = String(body.about || profile.about).trim();
  profile.languages = Array.isArray(body.languages)
    ? body.languages.filter(Boolean)
    : String(body.languages || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) || profile.languages;
  profile.updatedAt = new Date().toISOString();

  recordActivity(db, doctor.id, "doctor_profile_updated");
  await writeDatabase(db);

  sendJson(response, 200, {
    message: profile.verified
      ? "Profile updated."
      : "Profile updated. Verification is still pending with admin.",
    profile
  });
}

async function handleDoctorSlots(request, response, url) {
  const db = await readDatabase();
  const doctor = requireUser(request, response, db, ["doctor"]);
  if (!doctor) {
    return;
  }

  const date = String(url.searchParams.get("date") || "").trim();
  const slots = db.timeSlots
    .filter((slot) => slot.doctorId === doctor.id)
    .filter((slot) => (date ? slot.date === date : true))
    .sort((left, right) => atTime(left.date, left.startTime) - atTime(right.date, right.startTime));

  sendJson(response, 200, { slots });
}

async function handleCreateDoctorSlot(request, response) {
  const db = await readDatabase();
  const doctor = requireUser(request, response, db, ["doctor"]);
  if (!doctor) {
    return;
  }

  const profile = getDoctorProfile(db, doctor.id);
  if (!profile) {
    sendJson(response, 404, { error: "Doctor profile not found." });
    return;
  }

  const body = await parseBody(request);
  const date = String(body.date || "").trim();
  const startTime = String(body.startTime || "").trim();
  const endTime = String(body.endTime || "").trim();
  const durationMinutes = Number(body.durationMinutes || 30);
  const isClosed = Boolean(body.isClosed);

  if (!date || !validateTimeRange(startTime, endTime)) {
    sendJson(response, 400, { error: "date, startTime, and endTime are required in HH:MM format." });
    return;
  }

  if (profile.closedDates.includes(date)) {
    sendJson(response, 400, { error: "This date is marked as closed in the doctor profile." });
    return;
  }

  if (
    db.timeSlots.some(
      (slot) =>
        slot.doctorId === doctor.id &&
        slot.date === date &&
        (slot.startTime === startTime || slot.endTime === endTime || (slot.startTime < endTime && startTime < slot.endTime))
    )
  ) {
    sendJson(response, 409, { error: "This slot overlaps an existing slot." });
    return;
  }

  const slot = {
    id: createId("slot"),
    doctorId: doctor.id,
    date,
    startTime,
    endTime,
    durationMinutes,
    isBooked: false,
    isClosed,
    appointmentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.timeSlots.push(slot);
  recordActivity(db, doctor.id, "doctor_slot_created", { slotId: slot.id });
  await writeDatabase(db);

  sendJson(response, 201, {
    message: "Slot created successfully.",
    slot
  });
}

async function handleUpdateDoctorSlot(request, response, slotId) {
  const db = await readDatabase();
  const doctor = requireUser(request, response, db, ["doctor"]);
  if (!doctor) {
    return;
  }

  const slot = db.timeSlots.find((entry) => entry.id === slotId && entry.doctorId === doctor.id);
  if (!slot) {
    sendJson(response, 404, { error: "Slot not found." });
    return;
  }

  if (slot.isBooked && slot.appointmentId) {
    sendJson(response, 400, { error: "Booked slots cannot be edited directly." });
    return;
  }

  const body = await parseBody(request);
  const nextDate = String(body.date || slot.date).trim();
  const nextStartTime = String(body.startTime || slot.startTime).trim();
  const nextEndTime = String(body.endTime || slot.endTime).trim();

  if (!validateTimeRange(nextStartTime, nextEndTime)) {
    sendJson(response, 400, { error: "startTime and endTime must be valid HH:MM values." });
    return;
  }

  slot.date = nextDate;
  slot.startTime = nextStartTime;
  slot.endTime = nextEndTime;
  slot.durationMinutes = Number(body.durationMinutes || slot.durationMinutes);
  slot.isClosed = body.isClosed === undefined ? slot.isClosed : Boolean(body.isClosed);
  slot.updatedAt = new Date().toISOString();

  recordActivity(db, doctor.id, "doctor_slot_updated", { slotId });
  await writeDatabase(db);

  sendJson(response, 200, {
    message: "Slot updated.",
    slot
  });
}

async function handleDoctorAppointments(request, response, url) {
  const db = await readDatabase();
  const doctor = requireUser(request, response, db, ["doctor"]);
  if (!doctor) {
    return;
  }

  const status = String(url.searchParams.get("status") || "").trim().toLowerCase();
  const appointments = db.appointments
    .filter((appointment) => appointment.doctorId === doctor.id)
    .filter((appointment) => (status ? appointment.status === status : true))
    .map((appointment) => enrichAppointment(db, appointment))
    .sort((left, right) => {
      const leftSlot = left.slot || { date: "9999-12-31", startTime: "23:59" };
      const rightSlot = right.slot || { date: "9999-12-31", startTime: "23:59" };
      return atTime(leftSlot.date, leftSlot.startTime) - atTime(rightSlot.date, rightSlot.startTime);
    });

  const totalRevenue = db.payments
    .filter((payment) =>
      appointments.some((appointment) => appointment.id === payment.appointmentId) && payment.status === "paid"
    )
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  sendJson(response, 200, {
    appointments,
    dashboard: {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter((appointment) => appointment.status === "completed").length,
      upcomingAppointments: appointments.filter((appointment) => appointment.status === "confirmed").length,
      totalRevenue
    }
  });
}

async function handleUpdateDoctorAppointmentStatus(request, response, appointmentId) {
  const db = await readDatabase();
  const doctor = requireUser(request, response, db, ["doctor"]);
  if (!doctor) {
    return;
  }

  const appointment = db.appointments.find((entry) => entry.id === appointmentId && entry.doctorId === doctor.id);
  if (!appointment) {
    sendJson(response, 404, { error: "Appointment not found." });
    return;
  }

  const body = await parseBody(request);
  const status = String(body.status || "").trim().toLowerCase();
  const allowedStatuses = ["confirmed", "completed", "no_show"];

  if (!allowedStatuses.includes(status)) {
    sendJson(response, 400, { error: `status must be one of ${allowedStatuses.join(", ")}.` });
    return;
  }

  appointment.status = status;
  appointment.updatedAt = new Date().toISOString();
  if (status === "completed") {
    appointment.completedAt = new Date().toISOString();
  }

  db.notifications.push(
    createNotification(
      appointment.patientId,
      "Appointment updated",
      `Your appointment status is now ${status.replace("_", " ")}.`,
      "appointment",
      ["in_app", "email"]
    )
  );

  recordActivity(db, doctor.id, "doctor_appointment_status_updated", { appointmentId, status });
  await writeDatabase(db);

  sendJson(response, 200, {
    message: "Appointment status updated.",
    appointment: enrichAppointment(db, appointment)
  });
}

async function handleGetPatientHistory(request, response, patientId) {
  const db = await readDatabase();
  const doctor = requireUser(request, response, db, ["doctor"]);
  if (!doctor) {
    return;
  }

  const hasSeenPatient = db.appointments.some(
    (appointment) => appointment.doctorId === doctor.id && appointment.patientId === patientId
  );

  if (!hasSeenPatient) {
    sendJson(response, 403, { error: "You can only view patients you have appointments with." });
    return;
  }

  const history = db.appointments
    .filter((appointment) => appointment.doctorId === doctor.id && appointment.patientId === patientId)
    .map((appointment) => enrichAppointment(db, appointment))
    .sort((left, right) => {
      const leftSlot = left.slot || { date: "9999-12-31", startTime: "23:59" };
      const rightSlot = right.slot || { date: "9999-12-31", startTime: "23:59" };
      return atTime(rightSlot.date, rightSlot.startTime) - atTime(leftSlot.date, leftSlot.startTime);
    });

  sendJson(response, 200, {
    patient: sanitizeUser(db.users.find((user) => user.id === patientId) || { id: "", name: "Unknown" }),
    patientProfile: getPatientProfile(db, patientId),
    history
  });
}

async function handleAdminUsers(request, response) {
  const db = await readDatabase();
  const admin = requireUser(request, response, db, ["admin"]);
  if (!admin) {
    return;
  }

  const users = db.users.map((user) => ({
    ...sanitizeUser(user),
    doctorProfile: user.role === "doctor" ? getDoctorProfile(db, user.id) : null,
    patientProfile: user.role === "patient" ? getPatientProfile(db, user.id) : null
  }));

  sendJson(response, 200, { users });
}

async function handleAdminVerifyDoctor(request, response, doctorId) {
  const db = await readDatabase();
  const admin = requireUser(request, response, db, ["admin"]);
  if (!admin) {
    return;
  }

  const profile = getDoctorProfile(db, doctorId);
  if (!profile) {
    sendJson(response, 404, { error: "Doctor profile not found." });
    return;
  }

  const body = await parseBody(request);
  profile.verified = body.verified === undefined ? profile.verified : Boolean(body.verified);
  profile.blocked = body.blocked === undefined ? profile.blocked : Boolean(body.blocked);
  profile.updatedAt = new Date().toISOString();

  db.notifications.push(
    createNotification(
      doctorId,
      profile.blocked ? "Account blocked" : profile.verified ? "Doctor verified" : "Verification updated",
      profile.blocked
        ? "Admin has blocked your doctor account."
        : profile.verified
          ? "Your profile is now live for patient bookings."
          : "Your profile is still pending verification.",
      "admin",
      ["email", "in_app"]
    )
  );

  recordActivity(db, admin.id, "doctor_verification_updated", {
    doctorId,
    verified: profile.verified,
    blocked: profile.blocked
  });

  await writeDatabase(db);
  sendJson(response, 200, {
    message: "Doctor status updated.",
    doctor: enrichDoctor(db, db.users.find((user) => user.id === doctorId))
  });
}

async function handleAdminAppointments(request, response) {
  const db = await readDatabase();
  const admin = requireUser(request, response, db, ["admin"]);
  if (!admin) {
    return;
  }

  const appointments = db.appointments
    .map((appointment) => enrichAppointment(db, appointment))
    .sort((left, right) => {
      const leftSlot = left.slot || { date: "9999-12-31", startTime: "23:59" };
      const rightSlot = right.slot || { date: "9999-12-31", startTime: "23:59" };
      return atTime(rightSlot.date, rightSlot.startTime) - atTime(leftSlot.date, leftSlot.startTime);
    });

  sendJson(response, 200, { appointments });
}

async function handleAdminPayments(request, response) {
  const db = await readDatabase();
  const admin = requireUser(request, response, db, ["admin"]);
  if (!admin) {
    return;
  }

  const payments = db.payments.map((payment) => ({
    ...payment,
    appointment: enrichAppointment(
      db,
      db.appointments.find((appointment) => appointment.id === payment.appointmentId) || {}
    )
  }));

  sendJson(response, 200, { payments });
}

async function handleAdminReports(request, response) {
  const db = await readDatabase();
  const admin = requireUser(request, response, db, ["admin"]);
  if (!admin) {
    return;
  }

  sendJson(response, 200, {
    reports: summarizeReports(db),
    recentActivity: db.activityLog.slice(0, 12)
  });
}

async function handleCreateSpeciality(request, response) {
  const db = await readDatabase();
  const admin = requireUser(request, response, db, ["admin"]);
  if (!admin) {
    return;
  }

  const body = await parseBody(request);
  const name = String(body.name || "").trim();
  if (!name) {
    sendJson(response, 400, { error: "Speciality name is required." });
    return;
  }

  if (db.specialities.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    sendJson(response, 409, { error: "This speciality already exists." });
    return;
  }

  const speciality = {
    id: createId("spec"),
    name,
    createdAt: new Date().toISOString()
  };

  db.specialities.push(speciality);
  recordActivity(db, admin.id, "speciality_created", { specialityId: speciality.id });
  await writeDatabase(db);

  sendJson(response, 201, {
    message: "Speciality added.",
    speciality
  });
}

async function handleBroadcastNotification(request, response) {
  const db = await readDatabase();
  const admin = requireUser(request, response, db, ["admin"]);
  if (!admin) {
    return;
  }

  const body = await parseBody(request);
  const title = String(body.title || "").trim();
  const message = String(body.message || "").trim();
  if (!title || !message) {
    sendJson(response, 400, { error: "title and message are required." });
    return;
  }

  db.users.forEach((user) => {
    db.notifications.push(createNotification(user.id, title, message, "broadcast", ["in_app", "email"]));
  });

  recordActivity(db, admin.id, "notification_broadcasted");
  await writeDatabase(db);

  sendJson(response, 200, {
    message: "Broadcast sent.",
    recipients: db.users.length
  });
}

async function handleApiDocs(response) {
  sendJson(response, 200, {
    groups: [
      {
        name: "Auth",
        endpoints: [
          { method: "POST", path: "/api/auth/register", summary: "Register patient or doctor" },
          { method: "POST", path: "/api/auth/login", summary: "Login by email and password" },
          { method: "GET", path: "/api/auth/me", summary: "Get current session user" }
        ]
      },
      {
        name: "Patient",
        endpoints: [
          { method: "GET", path: "/api/doctors", summary: "Search doctors by speciality, city, and text" },
          { method: "GET", path: "/api/doctors/:id", summary: "Fetch doctor profile and reviews" },
          { method: "GET", path: "/api/doctors/:id/slots?date=", summary: "List doctor slots for a date" },
          { method: "POST", path: "/api/appointments", summary: "Book appointment" },
          { method: "GET", path: "/api/appointments/me", summary: "Patient appointments" },
          { method: "PUT", path: "/api/appointments/:id/cancel", summary: "Cancel appointment" },
          { method: "PUT", path: "/api/appointments/:id/reschedule", summary: "Reschedule appointment" },
          { method: "POST", path: "/api/appointments/:id/review", summary: "Submit doctor review" }
        ]
      },
      {
        name: "Doctor",
        endpoints: [
          { method: "GET", path: "/api/doctor/profile", summary: "Get doctor profile" },
          { method: "PUT", path: "/api/doctor/profile", summary: "Update doctor profile" },
          { method: "GET", path: "/api/doctor/slots", summary: "List doctor-owned slots" },
          { method: "POST", path: "/api/doctor/slots", summary: "Create slot" },
          { method: "PUT", path: "/api/doctor/slots/:id", summary: "Update unbooked slot" },
          { method: "GET", path: "/api/doctor/appointments", summary: "Doctor appointment dashboard" },
          {
            method: "PUT",
            path: "/api/doctor/appointments/:id/status",
            summary: "Update appointment status"
          },
          {
            method: "GET",
            path: "/api/doctor/patients/:patientId/history",
            summary: "View history for a patient linked to this doctor"
          }
        ]
      },
      {
        name: "Admin",
        endpoints: [
          { method: "GET", path: "/api/admin/users", summary: "List users with role profiles" },
          { method: "PUT", path: "/api/admin/doctors/:id/verify", summary: "Verify or block doctor" },
          { method: "GET", path: "/api/admin/appointments", summary: "Monitor all appointments" },
          { method: "GET", path: "/api/admin/payments", summary: "Track payment records" },
          { method: "GET", path: "/api/admin/reports", summary: "Read KPI reports and activity" },
          { method: "POST", path: "/api/admin/specialities", summary: "Add speciality" },
          {
            method: "POST",
            path: "/api/admin/notifications/broadcast",
            summary: "Broadcast platform message"
          }
        ]
      }
    ]
  });
}

async function handleApi(request, response, url) {
  const { pathname } = url;

  if (request.method === "GET" && pathname === "/api/health") {
    await handleHealth(response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/specialities") {
    await handleGetSpecialities(response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/register") {
    await handleRegister(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/login") {
    await handleLogin(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/auth/me") {
    await handleGetCurrentUser(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/doctors") {
    await handleGetDoctors(response, url);
    return;
  }

  const doctorMatch = pathname.match(/^\/api\/doctors\/([^/]+)$/);
  if (request.method === "GET" && doctorMatch) {
    await handleGetDoctor(response, doctorMatch[1]);
    return;
  }

  const doctorSlotsMatch = pathname.match(/^\/api\/doctors\/([^/]+)\/slots$/);
  if (request.method === "GET" && doctorSlotsMatch) {
    await handleGetDoctorSlots(response, doctorSlotsMatch[1], url);
    return;
  }

  if (request.method === "POST" && pathname === "/api/appointments") {
    await handleCreateAppointment(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/appointments/me") {
    await handleGetMyAppointments(request, response);
    return;
  }

  const cancelAppointmentMatch = pathname.match(/^\/api\/appointments\/([^/]+)\/cancel$/);
  if (request.method === "PUT" && cancelAppointmentMatch) {
    await handleCancelAppointment(request, response, cancelAppointmentMatch[1]);
    return;
  }

  const rescheduleAppointmentMatch = pathname.match(/^\/api\/appointments\/([^/]+)\/reschedule$/);
  if (request.method === "PUT" && rescheduleAppointmentMatch) {
    await handleRescheduleAppointment(request, response, rescheduleAppointmentMatch[1]);
    return;
  }

  const reviewAppointmentMatch = pathname.match(/^\/api\/appointments\/([^/]+)\/review$/);
  if (request.method === "POST" && reviewAppointmentMatch) {
    await handleSubmitReview(request, response, reviewAppointmentMatch[1]);
    return;
  }

  if (request.method === "GET" && pathname === "/api/notifications/me") {
    await handleGetNotifications(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/doctor/profile") {
    await handleGetDoctorWorkspace(request, response);
    return;
  }

  if (request.method === "PUT" && pathname === "/api/doctor/profile") {
    await handleUpdateDoctorProfile(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/doctor/slots") {
    await handleDoctorSlots(request, response, url);
    return;
  }

  if (request.method === "POST" && pathname === "/api/doctor/slots") {
    await handleCreateDoctorSlot(request, response);
    return;
  }

  const doctorSlotUpdateMatch = pathname.match(/^\/api\/doctor\/slots\/([^/]+)$/);
  if (request.method === "PUT" && doctorSlotUpdateMatch) {
    await handleUpdateDoctorSlot(request, response, doctorSlotUpdateMatch[1]);
    return;
  }

  if (request.method === "GET" && pathname === "/api/doctor/appointments") {
    await handleDoctorAppointments(request, response, url);
    return;
  }

  const doctorAppointmentStatusMatch = pathname.match(/^\/api\/doctor\/appointments\/([^/]+)\/status$/);
  if (request.method === "PUT" && doctorAppointmentStatusMatch) {
    await handleUpdateDoctorAppointmentStatus(request, response, doctorAppointmentStatusMatch[1]);
    return;
  }

  const doctorPatientHistoryMatch = pathname.match(/^\/api\/doctor\/patients\/([^/]+)\/history$/);
  if (request.method === "GET" && doctorPatientHistoryMatch) {
    await handleGetPatientHistory(request, response, doctorPatientHistoryMatch[1]);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/users") {
    await handleAdminUsers(request, response);
    return;
  }

  const adminVerifyMatch = pathname.match(/^\/api\/admin\/doctors\/([^/]+)\/verify$/);
  if (request.method === "PUT" && adminVerifyMatch) {
    await handleAdminVerifyDoctor(request, response, adminVerifyMatch[1]);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/appointments") {
    await handleAdminAppointments(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/payments") {
    await handleAdminPayments(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/reports") {
    await handleAdminReports(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/admin/specialities") {
    await handleCreateSpeciality(request, response);
    return;
  }

  if (request.method === "POST" && pathname === "/api/admin/notifications/broadcast") {
    await handleBroadcastNotification(request, response);
    return;
  }

  if (request.method === "GET" && pathname === "/api/docs") {
    await handleApiDocs(response);
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Origin": "*"
      });
      response.end();
      return;
    }

    const url = getUrl(request);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    await sendStaticFile(response, url.pathname);
  } catch (error) {
    sendJson(response, 500, {
      error: "Internal server error.",
      details: error.message
    });
  }
});

async function startServer() {
  await ensureDatabase();
  server.listen(PORT, HOST, () => {
    console.log(`PulseCare server running at http://${HOST}:${PORT}`);
  });
}

startServer();
