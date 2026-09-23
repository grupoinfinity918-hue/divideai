export default function Banner({ slides = [] }) {
  const defaultSlide = {
    title: 'Assinaturas e contas com garantia de 15 dias',
    subtitle: 'Compre com segurança no Divide Aí',
    imageUrl: null
  };

  const slide = slides[0] || defaultSlide;

  return (
    <section
      className="da-container"
      style={{ paddingTop: 20 }}
    >
      <div
        style={{
          background: slide.imageUrl
            ? `url(${slide.imageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--da-primary) 0%, var(--da-primary-light) 100%)',
          borderRadius: 'var(--da-radius)',
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '32px 28px',
          color: '#fff'
        }}
      >
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 34px)', margin: 0, fontWeight: 800 }}>
          {slide.title}
        </h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', marginTop: 8, opacity: 0.95 }}>
          {slide.subtitle}
        </p>
      </div>
    </section>
  );
}
