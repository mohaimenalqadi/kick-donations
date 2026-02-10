/**
 * Role-based Authorization Middleware
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const authorize = (allowedRoles = ['admin']) => {
    return async (request, reply) => {
        try {
            const user = request.user;

            if (!user || !user.role) {
                return reply.code(403).send({ error: 'غير مصرح - لم يتم التعرف على الصلاحيات' });
            }

            if (!allowedRoles.includes(user.role)) {
                return reply.code(403).send({
                    error: 'غير مصرح',
                    message: 'ليس لديك الصلاحيات الكافية للقيام بهذا الإجراء'
                });
            }
        } catch (err) {
            return reply.code(500).send({ error: 'خطأ في التحقق من الصلاحيات' });
        }
    };
};

module.exports = authorize;
