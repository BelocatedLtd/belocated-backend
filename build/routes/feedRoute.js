"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const feedController_1 = require("../controllers/feedController");
const router = express_1.default.Router();
// Define routes for activities
router.get('/', feedController_1.getFeed); // Gets a feed from db
router.delete('/trash', feedController_1.trashFeed); // Gets a feed from db
exports.default = router;
//# sourceMappingURL=feedRoute.js.map