"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ClipboardCheck,
  FileCheck2,
  MapPin,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import { JOURNEY } from "./data";

const icons = [ClipboardCheck, MapPin, FileCheck2, Monitor];
export default function JourneySection() {
  const [active, setActive] = useState(0);
  const step = JOURNEY[active];
  const ActiveIcon = icons[active];
  return (
    <section
      className="ef5-journey ef5-section"
      id="como-funciona"
      aria-labelledby="ef5-journey-title"
    >
      <div className="ef5-container">
        <div className="ef5-journey-head ef5-reveal">
          <div>
            <span className="ef5-eyebrow">
              <span className="ef5-index">04</span> / O FLUXO EM CAMPO
            </span>
            <h2 id="ef5-journey-title">
              Do primeiro chamado
              <br />
              <em>ao último registro.</em>
            </h2>
          </div>
          <p>
            Uma operação eficiente começa quando cada etapa está conectada à
            próxima.
          </p>
        </div>
        <div className="ef5-journey-grid">
          <div className="ef5-journey-steps">
            {JOURNEY.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={`ef5-journey-step${active === i ? " active" : ""}`}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
              >
                <span className="ef5-journey-step-number">{item.index}</span>
                <span className="ef5-journey-step-text">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
          <div className="ef5-journey-stage">
            <div className="ef5-journey-stage-head">
              <span>FIELD OPERATIONS / ETAPA {step.index}</span>
              <span className="ef5-journey-live">
                <i /> FLUXO CONECTADO
              </span>
            </div>
            <div className="ef5-journey-stage-body" key={active}>
              <span className="ef5-journey-stage-orbit" />
              <div className="ef5-journey-bigicon">
                <ActiveIcon size={58} strokeWidth={1.4} />
              </div>
              <div className="ef5-journey-signal">
                <span>REGISTRO DE OPERAÇÃO</span>
                <strong>{step.indicator}</strong>
                <small>Exemplo demonstrativo</small>
              </div>
              <div className="ef5-journey-timeline">
                {JOURNEY.map((s, i) => (
                  <div className={i <= active ? "active" : ""} key={s.id}>
                    <span>{i < active ? <Check size={13} /> : s.index}</span>
                    <small>
                      {["Planejar", "Executar", "Documentar", "Acompanhar"][i]}
                    </small>
                  </div>
                ))}
              </div>
            </div>
            <div className="ef5-journey-stage-foot">
              <span>
                <ShieldCheck size={15} /> REGISTROS ASSOCIADOS À ORDEM
              </span>
              <span>0{active + 1} — 04</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
