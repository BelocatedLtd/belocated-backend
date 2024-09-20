import { ObjectId } from 'mongoose'

export interface IAdvert {
	_id: ObjectId
	userId: ObjectId
	platform: string
	service: string
	status: string
	state: string
	lga: string
	gender: string
	_doc: any
	createdAt: Date
	updatedAt: Date
}
