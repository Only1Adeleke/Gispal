const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('../commonFilterValidation');

const { USER_TYPES } = require('../../constants/authConstant');
const convertObjectToEnum = require('../../utils/convertObjectToEnum');

const createSchema = joi.object({
  username: joi.string().allow(null).allow(''),
  password: joi.string().allow(null).allow(''),
  email: joi.string().allow(null).allow(''),
  name: joi.string().allow(null).allow(''),
  userType: joi.number().integer().allow(0),
  isActive: joi.boolean(),
  isDeleted: joi.boolean(),
  createdAt: joi.date().options({ convert: true }).allow(null).allow(''),
  updatedAt: joi.date().options({ convert: true }).allow(null).allow(''),
  addedBy: joi.number().integer().allow(0),
  updatedBy: joi.number().integer().allow(0),
  subscription_plan_id: joi.number().integer().allow(0),
  api_token: joi.any(),
  subscription_expiry_date: joi.date().options({ convert: true }).allow(null).allow(''),
  mobileNo: joi.string().allow(null).allow(''),
  ssoAuth: joi.object({
    googleId:joi.string(),
    facebookId:joi.string()
  })
}).unknown(true);

const updateSchema = joi.object({
  username: joi.string().allow(null).allow(''),
  password: joi.string().allow(null).allow(''),
  email: joi.string().allow(null).allow(''),
  name: joi.string().allow(null).allow(''),
  userType: joi.number().integer().allow(0),
  isActive: joi.boolean(),
  isDeleted: joi.boolean(),
  createdAt: joi.date().options({ convert: true }).allow(null).allow(''),
  updatedAt: joi.date().options({ convert: true }).allow(null).allow(''),
  addedBy: joi.number().integer().allow(0),
  updatedBy: joi.number().integer().allow(0),
  subscription_plan_id: joi.number().integer().allow(0),
  api_token: joi.any(),
  subscription_expiry_date: joi.date().options({ convert: true }).allow(null).allow(''),
  mobileNo: joi.string().allow(null).allow(''),
  ssoAuth: joi.object({
    googleId:joi.string(),
    facebookId:joi.string()
  }),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
let filterValidationSchema = joi.object({
  options: options,
  ...Object.fromEntries(keys.map(key => [key, joi.object({
    username: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    password: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    email: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    name: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    userType: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    isActive: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    isDeleted: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
    createdAt: joi.alternatives().try(joi.array().items(),joi.date().options({ convert: true }),joi.object()),
    updatedAt: joi.alternatives().try(joi.array().items(),joi.date().options({ convert: true }),joi.object()),
    addedBy: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    updatedBy: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    subscription_plan_id: joi.alternatives().try(joi.array().items(),joi.number().integer(),joi.object()),
    api_token: joi.alternatives().try(joi.array().items(),joi.any(),joi.object()),
    subscription_expiry_date: joi.alternatives().try(joi.array().items(),joi.date().options({ convert: true }),joi.object()),
    mobileNo: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    ssoAuth: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
    id: joi.any()
  }).unknown(true),])),
  isCountOnly: isCountOnly,
  include: joi.array().items(include),
  select: select
}).unknown(true);

module.exports = {
  createSchema,
  updateSchema,
  filterValidationSchema
};