'use strict';

/** Shared JSON-schema fragments. `additionalProperties: false` everywhere blocks mass-assignment. */

const idParams = {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid' } },
};

const username = { type: 'string', minLength: 3, maxLength: 30, pattern: '^[A-Za-z0-9_.\\-]+$' };
const newPassword = { type: 'string', minLength: 8, maxLength: 128 };
const anyPassword = { type: 'string', minLength: 1, maxLength: 128 };
const role = { type: 'string', enum: ['admin', 'moderator'] };

// https URL, a site-relative path, or empty string (= use default asset)
const mediaUrl = { type: 'string', maxLength: 1000, pattern: '^(|https://[^\\s"\'<>]+|/[^\\s"\'<>]*)$' };

const pagination = {
    page: { type: 'integer', minimum: 1, maximum: 100000, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
};

module.exports = { idParams, username, newPassword, anyPassword, role, mediaUrl, pagination };
