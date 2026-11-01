// Fill only with verified information and authorization to publish.
export const approvedCustomers = [];
export const approvedTestimonials = [];
export const approvedBusinessMetrics = [];
export default function CommercialProof() {
  const customers = approvedCustomers.filter(
      (x) => x.approved && x.publicationAuthorized,
    ),
    testimonials = approvedTestimonials.filter(
      (x) => x.approved && x.publicationAuthorized,
    ),
    metrics = approvedBusinessMetrics.filter(
      (x) => x.approved && x.publicationAuthorized && Number.isFinite(x.value),
    );
  if (!customers.length && !testimonials.length && !metrics.length) return null;
  return (
    <section
      className="ef5-section ef5-container"
      aria-label="Informações comerciais verificadas"
    >
      {customers.length > 0 && (
        <>
          <h2>Empresas que confiam na EWS Field</h2>
          {customers.map((x) => (
            <figure key={x.name}>
              <img
                src={x.logo}
                alt={x.name}
                width="160"
                height="64"
                loading="lazy"
              />
            </figure>
          ))}
        </>
      )}
      {testimonials.map((x) => (
        <blockquote key={x.name}>
          <p>{x.quote}</p>
          <cite>
            {x.name} · {x.company}
          </cite>
        </blockquote>
      ))}
      {metrics.map((x) => (
        <p key={x.label}>
          <strong>{x.value}</strong> {x.label}{" "}
          <small>Atualizado em {x.asOf}</small>
        </p>
      ))}
    </section>
  );
}
