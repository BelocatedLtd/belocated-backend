"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateSchema = void 0;
const celebrate_1 = require("celebrate");
exports.paginateSchema = celebrate_1.Joi.object({
    page: celebrate_1.Joi.number().required(),
    limit: celebrate_1.Joi.number().required(),
});
//# sourceMappingURL=index.js.map