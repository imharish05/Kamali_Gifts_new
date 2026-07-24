const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getAll,
  getByProduct,
  getByCombo,
  getEligibility,
  getComboEligibility,
  create,
  update,
  remove,
} = require("../controllers/reviewController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/reviews");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

router.get("/product/:productId", getByProduct);
router.get("/combo/eligibility/:childComboId", protect, getComboEligibility);
router.get("/combo/:childComboId", getByCombo);

router.get("/eligibility/:productId", protect, getEligibility);
router.post("/", protect, upload.array("images", 5), create);

router.get("/", protect, adminOnly, getAll);
router.put("/update/:id", protect, adminOnly, update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;
