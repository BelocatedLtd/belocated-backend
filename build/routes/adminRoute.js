"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const adminAuthMiddleware_1 = require("../middleware/adminAuthMiddleware");
const router = express_1.default.Router();
router.get('/dashboard', adminAuthMiddleware_1.adminProtect, adminController_1.adminDashboard);
exports.default = router;
//# sourceMappingURL=adminRoute.js.map