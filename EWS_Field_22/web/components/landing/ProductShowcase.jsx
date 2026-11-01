"use client";
import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { PRODUCT_TABS } from "./data";
import { DashboardVisual, MobileVisual, ReportVisual } from "./ProductVisuals";

export default function ProductShowcase() {
  const capture = useRef(null);
  const [active, setActive] = useState("gestao");
  const tab =
    PRODUCT_TABS.find((item) => item.id === active) || PRODUCT_TABS[0];
  return (
    <section
      className="ef5-product ef5-section"
      id="plataforma"
      aria-labelledby="ef5-product-title"
    >
      <div className="ef5-container">
        <div className="ef5-product-heading ef5-reveal">
          <div>
            <span className="ef5-eyebrow">
              <span className="ef5-index">02</span> / CONHEÇA A PLATAFORMA
            </span>
            <h2 id="ef5-product-title">
              O escritório conectado
              <br />
              <em>ao que acontece no campo.</em>
            </h2>
          </div>
          <p>
            Do primeiro chamado ao relatório final, cada informação encontra o
            seu lugar.
          </p>
        </div>
        <div className="ef5-product-stage">
          <div
            className="ef5-product-toolbar"
            role="tablist"
            aria-label="Prévia das interfaces do EWS Field"
          >
            {PRODUCT_TABS.map((item) => (
              <button
                key={item.id}
                id={`ef5-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={active === item.id}
                aria-controls="ef5-product-panel"
                tabIndex={active === item.id ? 0 : -1}
                onClick={() => setActive(item.id)}
                onKeyDown={(e) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  )
                    return;
                  e.preventDefault();
                  const current = PRODUCT_TABS.findIndex(
                    (x) => x.id === active,
                  );
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? PRODUCT_TABS.length - 1
                        : (current +
                            (e.key === "ArrowRight" ? 1 : -1) +
                            PRODUCT_TABS.length) %
                          PRODUCT_TABS.length;
                  setActive(PRODUCT_TABS[next].id);
                  document
                    .getElementById(`ef5-tab-${PRODUCT_TABS[next].id}`)
                    ?.focus();
                }}
              >
                {item.label}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
          <div
            className="ef5-product-panel"
            role="tabpanel"
            id="ef5-product-panel"
            aria-labelledby={`ef5-tab-${active}`}
            key={active}
          >
            <div className="ef5-product-info">
              <div className="ef5-product-info-top">
                <span className="ef5-product-small">
                  {tab.eyebrow} / VISUALIZAÇÃO
                </span>
                <span className="ef5-product-tab-counter">
                  0{PRODUCT_TABS.findIndex((x) => x.id === active) + 1} / 03
                </span>
              </div>
              <div className="ef5-product-info-body">
                <span className="ef5-product-symbol">
                  <CheckCircle2 size={21} />
                </span>
                <h3>{tab.title}</h3>
                <p>{tab.description}</p>
                <a href="#contato">
                  Conhecer na prática <ArrowRight size={17} />
                </a>
              </div>
              <div className="ef5-product-info-foot">
                <span>PARA GESTORES E EQUIPES</span>
                <span>↗</span>
              </div>
            </div>
            <div className={`ef5-product-illustration is-${active}`}>
              <span className="ef5-product-illustration-label">
                EWS FIELD / DEMONSTRAÇÃO
              </span>
              {active === "gestao" && (
                <div className="ef5-product-dash">
                  <DashboardVisual />
                </div>
              )}
              {active === "campo" && (
                <div className="ef5-product-mobile">
                  <MobileVisual />
                </div>
              )}
              {active === "relatorio" && (
                <div className="ef5-product-report">
                  <ReportVisual />
                </div>
              )}
              <span className="ef5-product-illustration-foot">
                CAPTURAS REAIS · APP NO EXPO WEB · DADOS FICTÍCIOS
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="ef5-capture-actions">
        <button type="button" onClick={() => capture.current.showModal()}>
          Ampliar captura ↗
        </button>
      </div>
      <dialog
        ref={capture}
        className="ef5-capture-dialog"
        aria-label="Captura ampliada do produto"
      >
        <button type="button" onClick={() => capture.current.close()}>
          Fechar captura
        </button>
        <p>Captura real com dados fictícios. Deslize para explorar.</p>
        <div>
          <img
            src={
              active === "campo"
                ? "/landing/mobile-ordem.webp"
                : active === "relatorio"
                  ? "/landing/painel-relatorio.webp"
                  : "/landing/painel-gestao.webp"
            }
            width={active === "campo" ? 780 : 1440}
            height={active === "campo" ? 1688 : 960}
            style={{ width: active === "campo" ? 780 : 1440, height: "auto" }}
            alt="Interface EWS Field ampliada"
          />
        </div>
      </dialog>
    </section>
  );
}
