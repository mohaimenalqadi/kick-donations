'use client';

import { useEffect } from 'react';

/** Last-resort boundary: shows a recoverable message instead of a blank page. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('[app error]', error);
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-4">
                <h1 className="text-xl font-black">حدث خطأ غير متوقع</h1>
                <p className="text-sm leading-relaxed text-ink-muted">
                    قد يكون الخادم قيد التحديث أو غير متاح مؤقتاً. جرّب مرة أخرى، وإذا استمرت المشكلة أعد تحميل الصفحة.
                </p>
                <div className="flex justify-center gap-2">
                    <button className="btn-primary" onClick={reset}>إعادة المحاولة</button>
                    <button className="btn-secondary" onClick={() => (window.location.href = '/login')}>صفحة الدخول</button>
                </div>
            </div>
        </main>
    );
}
