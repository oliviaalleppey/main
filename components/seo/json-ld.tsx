/**
 * Renders one or more schema.org objects as a JSON-LD script tag.
 *
 * Server component: the markup is present in the initial HTML, which is what
 * crawlers read.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
    const payload = Array.isArray(data) ? data : [data];

    return (
        <>
            {payload.map((item, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    // Structured data is built server-side from our own content,
                    // so there is no untrusted input here.
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
                />
            ))}
        </>
    );
}
