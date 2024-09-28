"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const advertController_1 = require("../controllers/advertController");
const authMiddleware_1 = require("../middleware/authMiddleware");
//Multer storage configuration
const storage = multer_1.default.diskStorage({});
const upload = (0, multer_1.default)({ storage });
const router = express_1.default.Router();
router.post('/create', authMiddleware_1.protect, upload.array('images'), advertController_1.createAdvert);
router.post('/initialize', authMiddleware_1.protect, upload.array('images'), advertController_1.initializeAdvert);
router.post('/setadfree/:id', authMiddleware_1.protect, advertController_1.toggleAdvertFreeStatus);
router.get('/', authMiddleware_1.protect, advertController_1.getAdvert);
router.get('/all', advertController_1.getAllAdvert);
router.get('/qualified/:platformName', authMiddleware_1.protect, advertController_1.getQualifiedAdverts);
router.get('/qualified', authMiddleware_1.protect, advertController_1.getTotalTasksByAllPlatforms);
router.delete('/delete/:advertId', authMiddleware_1.protect, advertController_1.deleteAdvert);
router.get('/:id', authMiddleware_1.protect, advertController_1.getAdvertById);
exports.default = router;
//# sourceMappingURL=advertRoute.js.map