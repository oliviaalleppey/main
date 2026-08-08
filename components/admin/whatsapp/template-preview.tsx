'use client';

import { ExternalLink, Phone, Reply } from 'lucide-react';
import { renderTemplateText, type TemplateButton } from '@/lib/services/whatsapp/template-lint';

/**
 * Renders a template as a real WhatsApp chat bubble.
 *
 * This exists because formatting mistakes are invisible in a form. A body that
 * reads fine in a textarea can turn out to be a wall of text, or have a variable
 * land somewhere absurd, and you only see that when it is shaped like the thing
 * the guest will actually receive.
 *
 * WhatsApp's own markdown subset is applied (*bold*, _italic_, ~strike~,
 * ```mono```) so the preview matches the delivered message rather than the
 * source text.
 */

function applyWhatsAppMarkdown(text: string): string {
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped
        .replace(/```([\s\S]+?)```/g, '<code class="rounded bg-black/5 px-1 font-mono text-[0.9em]">$1</code>')
        .replace(/(^|\W)\*(?!\s)([^*\n]+?)(?<!\s)\*(?=\W|$)/g, '$1<strong>$2</strong>')
        .replace(/(^|\W)_(?!\s)([^_\n]+?)(?<!\s)_(?=\W|$)/g, '$1<em>$2</em>')
        .replace(/(^|\W)~(?!\s)([^~\n]+?)(?<!\s)~(?=\W|$)/g, '$1<s>$2</s>')
        .replace(/\n/g, '<br />');
}

export function TemplatePreview({
    bodyText,
    headerType = 'none',
    headerText = '',
    footerText = '',
    buttons = [],
    values = {},
    fallback = 'Guest',
}: {
    bodyText: string;
    headerType?: string;
    headerText?: string;
    footerText?: string;
    buttons?: TemplateButton[];
    values?: Record<string, string>;
    fallback?: string;
}) {
    const renderedBody = renderTemplateText(bodyText || '', values, fallback);
    const renderedHeader = renderTemplateText(headerText || '', values, fallback);

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="rounded-lg bg-[#e5ddd5] p-4">
            <div className="mx-auto max-w-sm">
                <div className="relative rounded-lg rounded-tl-none bg-white p-2 shadow-sm">
                    {/* Media headers show as a placeholder tile — the real asset is
                        supplied per-send, so there is nothing truthful to render here. */}
                    {headerType === 'image' && (
                        <div className="mb-2 flex h-28 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                            Image header
                        </div>
                    )}
                    {headerType === 'document' && (
                        <div className="mb-2 flex h-16 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                            Document header
                        </div>
                    )}
                    {headerType === 'video' && (
                        <div className="mb-2 flex h-28 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                            Video header
                        </div>
                    )}

                    {headerType === 'text' && renderedHeader && (
                        <p
                            className="px-1 pt-0.5 text-sm font-semibold text-gray-900"
                            dangerouslySetInnerHTML={{ __html: applyWhatsAppMarkdown(renderedHeader) }}
                        />
                    )}

                    <p
                        className="whitespace-pre-wrap break-words px-1 pt-1 text-sm leading-snug text-gray-900"
                        dangerouslySetInnerHTML={{ __html: applyWhatsAppMarkdown(renderedBody || 'Your message body will appear here.') }}
                    />

                    {footerText && (
                        <p className="px-1 pt-1.5 text-xs text-gray-400">{footerText}</p>
                    )}

                    <div className="flex justify-end px-1 pt-1">
                        <span className="text-[10px] text-gray-400">{now}</span>
                    </div>

                    {buttons.length > 0 && (
                        <div className="mt-1 space-y-px border-t border-gray-100 pt-1">
                            {buttons.map((button, index) => (
                                <div
                                    key={`${button.text}-${index}`}
                                    className="flex items-center justify-center gap-1.5 rounded py-1.5 text-sm font-medium text-[#00a5f4]"
                                >
                                    {button.type === 'URL' && <ExternalLink className="h-3.5 w-3.5" />}
                                    {button.type === 'PHONE_NUMBER' && <Phone className="h-3.5 w-3.5" />}
                                    {button.type === 'QUICK_REPLY' && <Reply className="h-3.5 w-3.5" />}
                                    {button.text || 'Button'}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="mt-2 text-center text-[10px] text-gray-500">
                    Preview only — actual rendering varies slightly by device.
                </p>
            </div>
        </div>
    );
}
