import express from "express";
import mongoose from "mongoose";
import { bookingModel } from "./model/systemMongoose.js";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function check() {
    let conn = await mongoose.connect("mongodb://localhost:27017/BookingList");
}
check()

const app = express();
const port = 3000;

// Serve static files

app.use(
  session({
    secret: "token_secret_key", // can be anything
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/admin.html", (req, res) => {
  if (req.session.isAdmin) {
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(__dirname, "public", "admin.html"));
  } else {
    res.redirect("/admin_login.html");
  }
});
  

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json())


app.post("/token/book", async (req, res) => {
    const {username, phone, date, iscurrent} = req.body;
    const count = await bookingModel.countDocuments({date: date})
    const tokennum = count + 1;
    const booked = new bookingModel({
        name: username,
        phone: phone,
        date: date,
        tokenNumber: tokennum,
        isCurrent: tokennum === 1
    })
    await booked.save()
  res.status(200).send(`Your Token is Booked Successfully. Your Token Number is ${tokennum}.`);
});

app.get("/token/today/:date", async (req, res) => {
    const date = req.params.date;
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    const today = await bookingModel.find({ date: { $gte: start, $lte: end } });
    res.json(today)
})

app.get("/token/current/:date", async (req, res) => {
    const date = req.params.date;
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    const current = await bookingModel.findOne({date: { $gte: start, $lte: end }, isCurrent: true})
    res.json(current)
})

app.get("/token/next/:date", async (req, res) => {
    const date = req.params.date;
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    const current = await bookingModel.findOne({
      date: { $gte: start, $lte: end },
      isCurrent: true,
    });
    const next = current.tokenNumber + 1;
    const nextfull = await bookingModel.find({tokenNumber: next})
    res.json(nextfull)
})

app.put("/token/shift/:date", async (req, res) => {
    const date = req.params.date;
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    const current = await bookingModel.findOne({
      date: { $gte: start, $lte: end },
      isCurrent: true
    });
    if(!current) {
        res.status(404).send("⚠️ No current token found to shift.");
    }
    const current_token = current.tokenNumber;
    const updateFalse = await bookingModel.updateOne({tokenNumber: current_token}, {$set: {isCurrent: false}})
    const next_token = current.tokenNumber + 1;
    const updateTrue = await bookingModel.updateOne({tokenNumber: next_token}, {$set: {isCurrent: true}})
    res.send("Token is changed Successfully.")
})

app.delete("/token/reset/:date", async (req, res) => {
    const date = req.params.date;
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    const reset_day = await bookingModel.deleteMany({
      date: { $gte: start, $lte: end },
    });
    res.send(`All Tokens Deleted for ${date}.`);
})

app.post("/token/adminlogin", async (req, res) => {
    const pass = req.body.pass;
    if (pass === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
    res.send("✅ Login successful");
    } 
    else {
    res.status(401).send("❌ Invalid password");
    }
})

app.get("/token/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("❌ Failed to logout");
    }
    res.redirect("/admin_login.html"); // 👈 redirect to login
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


