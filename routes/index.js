const router = require("express").Router();
const auth = require("./auth.route");
const users = require("./users.route");
const payments = require("./payments.route");
const invoices = require("./invoices.route");
const kost = require("./kost.route")

router.use("/auth", auth);
router.use("/users", users);
router.use("/payments", payments);
router.use("/invoices", invoices);
router.use("/kost", kost)

module.exports = router;
