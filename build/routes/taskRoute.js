"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const taskController_1 = require("../controllers/taskController");
//import { upload } from '../utils/fileUpload.js'
//const upload = multer({ dest: 'uploads/' });
const celebrate_1 = require("celebrate");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validate_1 = require("../validate");
const router = express_1.default.Router();
//Multer storage configuration
const storage = multer_1.default.diskStorage({});
const upload = (0, multer_1.default)({ storage });
router.post('/create', authMiddleware_1.protect, taskController_1.CreateNewTask); // User opts in to perform a task
router.post('/submit', authMiddleware_1.protect, upload.array('images'), taskController_1.submitTask); // User submits task after perfomring
router.post('/approve', authMiddleware_1.protect, taskController_1.approveTask); //Admin approves task and user gets paid
router.post('/reject', authMiddleware_1.protect, taskController_1.rejectTask); //Admin rejects task
router.get('/', authMiddleware_1.protect, taskController_1.getTasks); // Get all tasks from db
// pagination
router.get('/task', authMiddleware_1.protect, (0, celebrate_1.celebrate)({
    query: validate_1.paginateSchema,
}), taskController_1.getTask); // Gets a specific user tasks
router.get('/:id', authMiddleware_1.protect, taskController_1.getTaskById); // Get all tasks from db
router.delete('/delete/:taskId', authMiddleware_1.protect, taskController_1.deleteTask);
exports.default = router;
//# sourceMappingURL=taskRoute.js.map