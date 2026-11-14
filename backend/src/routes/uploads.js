'use strict';

const crypto = require('crypto');
const { badRequest, AppError } = require('../lib/errors');

/** Allowed media types → stored extension. SVG/HTML are deliberately excluded. */
const ALLOWED = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'image/gif': 'gif',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'weba',
};

/** Magic-byte sniffing so a renamed file cannot pretend to be media. */
function sniff(buf) {
    const hex = buf.subarray(0, 12).toString('hex');
    const ascii = buf.subarray(0, 12).toString('latin1');
    if (ascii.slice(4, 8) === 'ftyp') return 'video/mp4';
    if (hex.startsWith('1a45dfa3')) return 'video/webm';
    if (ascii.startsWith('GIF8')) return 'image/gif';
    if (hex.startsWith('89504e47')) return 'image/png';
    if (hex.startsWith('ffd8ff')) return 'image/jpeg';
    if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'image/webp';
    if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE') return 'audio/wav';
    if (ascii.startsWith('ID3') || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
    if (ascii.startsWith('OggS')) return 'audio/ogg';
    return null;
}

const family = (mime) => mime.split('/')[0];

/** Admin media uploads to Supabase Storage (public bucket). */
async function uploadRoutes(fastify, { services, config, db }) {
    await fastify.register(require('@fastify/multipart'), {
        limits: { fileSize: config.uploadMaxMb * 1024 * 1024, files: 1, fields: 2 },
    });

    fastify.post('/', {
        preHandler: [fastify.authenticate, fastify.requireRole('admin')],
        config: { ticketType: 'upload', rateLimit: { max: 20, timeWindow: '10 minutes' } },
    }, async (request, reply) => {
        const file = await request.file();
        if (!file) throw badRequest('لم يتم إرفاق ملف');
        if (!ALLOWED[file.mimetype]) throw badRequest('نوع الملف غير مدعوم (MP4, WebM, GIF, PNG, JPG, WebP, MP3, WAV, OGG)');

        let buffer;
        try {
            buffer = await file.toBuffer();
        } catch (err) {
            if (err.code === 'FST_REQ_FILE_TOO_LARGE') {
                throw new AppError(413, `حجم الملف أكبر من ${config.uploadMaxMb} ميغابايت`, 'FILE_TOO_LARGE');
            }
            throw err;
        }

        const detected = sniff(buffer);
        if (!detected || family(detected) !== family(file.mimetype)) throw badRequest('محتوى الملف لا يطابق نوعه');

        const ext = ALLOWED[detected] || ALLOWED[file.mimetype];
        const path = `${family(detected)}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
        const { error } = await db.storage.from(config.storageBucket).upload(path, buffer, {
            contentType: detected,
            cacheControl: '31536000',
            upsert: false,
        });
        if (error) {
            request.log.error({ err: error }, 'storage upload failed');
            throw new AppError(502, 'تعذر رفع الملف إلى التخزين', 'STORAGE_ERROR');
        }
        const { data } = db.storage.from(config.storageBucket).getPublicUrl(path);
        await services.audit.record(request.user.id, 'upload_media', { path, size: buffer.length, type: detected });
        reply.code(201);
        return { success: true, url: data.publicUrl, type: family(detected) };
    });
}

module.exports = uploadRoutes;
module.exports.sniff = sniff;
