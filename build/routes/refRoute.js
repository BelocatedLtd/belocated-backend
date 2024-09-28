"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const refController_1 = require("../controllers/refController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/challenge', refController_1.getOngoingRefChallenge);
router.get('/challenge/all', authMiddleware_1.protect, refController_1.getAllRefChallenges);
router.get('/byUser', authMiddleware_1.protect, refController_1.getAllUserReferrals);
router.get('/dashboard', authMiddleware_1.protect, refController_1.getReferralDashboardData);
router.post('/bonus/convert', authMiddleware_1.protect, refController_1.convertRefBonusPts);
exports.default = router;
//# sourceMappingURL=refRoute.js.map