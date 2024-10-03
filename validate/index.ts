import { Joi } from 'celebrate'

export const paginateSchema = Joi.object({
	page: Joi.number().required(),
	limit: Joi.number().required(),
	status: Joi.string().optional(),
})
