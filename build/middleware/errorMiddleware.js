"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorhandler = (err, req, res, next) => {
    const statusCode = (res === null || res === void 0 ? void 0 : res.statusCode) ? res === null || res === void 0 ? void 0 : res.statusCode : 500;
    res === null || res === void 0 ? void 0 : res.status(statusCode);
    res === null || res === void 0 ? void 0 : res.json({
        message: err === null || err === void 0 ? void 0 : err.message,
        stack: process.env.NODE_ENV === 'development' ? err === null || err === void 0 ? void 0 : err.stack : null,
    });
};
exports.default = errorhandler;
//# sourceMappingURL=errorMiddleware.js.map