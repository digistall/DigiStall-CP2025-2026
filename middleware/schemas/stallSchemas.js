// ===== STALL VALIDATION SCHEMAS =====
import Joi from 'joi';
import { id, shortText, mediumText, longText, positiveNumber, base64Image } from './commonSchemas.js';

// POST /api/stalls (addStallWithImages - accepts multipart or JSON with base64)
export const createStallSchema = Joi.object({
  stall_number: Joi.string().max(50).trim().required(),
  stall_name: Joi.string().max(200).trim().allow('', null),
  stall_type: Joi.string().max(50).trim().allow('', null),
  stall_size: Joi.string().max(50).trim().allow('', null),
  monthly_rent: Joi.number().positive().allow(0, null),
  daily_rate: Joi.number().positive().allow(0, null),
  branch_id: id.required(),
  floor_id: id.allow(null),
  section_id: id.allow(null),
  area: mediumText.allow('', null),
  location: mediumText.allow('', null),
  description: longText.allow('', null),
  status: Joi.string().valid('Available', 'Occupied', 'Under Maintenance', 'Reserved').allow(null),
  // Base64 image data (for non-multipart uploads)
  images: Joi.array().items(Joi.object({
    image_data: base64Image.required(),
    display_order: Joi.number().integer().min(0).allow(null),
    is_primary: Joi.boolean().allow(null)
  })).max(10).allow(null),
  // Legacy single image field
  image: base64Image.allow('', null),
  image_data: base64Image.allow('', null)
}).options({ allowUnknown: true }); // Allow multer fields

// PUT /api/stalls/:id
export const updateStallSchema = Joi.object({
  stall_number: Joi.string().max(50).trim().allow('', null),
  stall_name: Joi.string().max(200).trim().allow('', null),
  stall_type: Joi.string().max(50).trim().allow('', null),
  stall_size: Joi.string().max(50).trim().allow('', null),
  monthly_rent: Joi.number().positive().allow(0, null),
  daily_rate: Joi.number().positive().allow(0, null),
  branch_id: id.allow(null),
  floor_id: id.allow(null),
  section_id: id.allow(null),
  area: mediumText.allow('', null),
  location: mediumText.allow('', null),
  description: longText.allow('', null),
  status: Joi.string().valid('Available', 'Occupied', 'Under Maintenance', 'Reserved').allow(null),
  stallholder_id: id.allow(null),
  image: base64Image.allow('', null),
  image_data: base64Image.allow('', null)
}).options({ allowUnknown: true });

// POST /api/stalls/raffles/:stallId/create
export const createRaffleSchema = Joi.object({
  duration_minutes: Joi.number().integer().min(1).max(10080).allow(null), // max 1 week
  max_participants: Joi.number().integer().min(1).allow(null),
  description: longText.allow('', null)
});

// POST /api/stalls/raffles/:stallId/join
export const joinRaffleSchema = Joi.object({
  applicant_id: id.required()
});

// POST /api/stalls/raffles/:raffleId/select-winner
export const selectWinnerSchema = Joi.object({
  winner_id: id.allow(null)
}).allow({});

// PUT /api/stalls/raffles/:raffleId/extend
export const extendTimerSchema = Joi.object({
  additional_minutes: Joi.number().integer().min(1).max(10080).allow(null),
  new_end_time: Joi.string().max(30).allow('', null)
});

// POST /api/stalls/auctions/:stallId/create
export const createAuctionSchema = Joi.object({
  starting_bid: positiveNumber.required(),
  min_increment: positiveNumber.allow(null),
  duration_minutes: Joi.number().integer().min(1).max(10080).allow(null),
  description: longText.allow('', null)
});

// POST /api/stalls/auctions/:stallId/bid
export const placeBidSchema = Joi.object({
  bid_amount: positiveNumber.required(),
  applicant_id: id.required()
});

// POST /api/stalls/images/blob/upload
export const uploadStallImageBlobSchema = Joi.object({
  stall_id: id.required(),
  image_data: base64Image.required(),
  display_order: Joi.number().integer().min(0).allow(null),
  is_primary: Joi.boolean().allow(null),
  caption: Joi.string().max(200).trim().allow('', null)
});

// POST /api/stalls/images/blob/upload-multiple
export const uploadStallImagesBlobSchema = Joi.object({
  stall_id: id.required(),
  images: Joi.array().items(Joi.object({
    image_data: base64Image.required(),
    display_order: Joi.number().integer().min(0).allow(null),
    is_primary: Joi.boolean().allow(null),
    caption: Joi.string().max(200).trim().allow('', null)
  })).min(1).max(10).required()
});

// PUT /api/stalls/images/blob/:image_id
export const updateStallImageBlobSchema = Joi.object({
  display_order: Joi.number().integer().min(0).allow(null),
  is_primary: Joi.boolean().allow(null),
  caption: Joi.string().max(200).trim().allow('', null),
  image_data: base64Image.allow('', null)
});
