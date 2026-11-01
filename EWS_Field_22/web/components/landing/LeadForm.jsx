"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

const empty = {
  name: "",
  company: "",
  email: "",
  phone: "",
  teamSize: "1–5 técnicos",
  message: "",
  consent: false,
  website: "",
};
export default function LeadForm() {
  const pending = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [form, setForm] = useState(empty);
  const [state, setState] = useState({ status: "idle", message: "" });
  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  async function send(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    setState({ status: "sending", message: "" });
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          result.error || "Não foi possível enviar. Tente novamente.",
        );
      setState({
        status: "success",
        message:
          "Solicitação recebida e registrada! Nossa equipe poderá entrar em contato pelos dados informados.",
      });
      setForm(empty);
    } catch (error) {
      setState({
        status: "error",
        message:
          error.name === "AbortError"
            ? "O envio demorou demais. Tente novamente."
            : error.message || "Ocorreu um erro. Tente novamente.",
      });
    } finally {
      clearTimeout(timer);
      pending.current = false;
    }
  }
  return (
    <form className="ef5-contact-form" onSubmit={send}>
      <div className="ef5-form-heading">
        <div>
          <span className="ef5-form-brow">CONTATO COMERCIAL</span>
          <h3>Vamos conversar?</h3>
          <p>Conte um pouco sobre sua operação.</p>
        </div>
        <span className="ef5-form-star">✳</span>
      </div>
      <div className="ef5-form-fields">
        <label>
          Seu nome{" "}
          <input
            required
            type="text"
            autoComplete="name"
            placeholder="Como podemos chamar você?"
            minLength={2}
            maxLength={120}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>
        <label>
          Empresa{" "}
          <input
            required
            type="text"
            autoComplete="organization"
            placeholder="Nome da sua empresa"
            minLength={2}
            maxLength={150}
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
          />
        </label>
        <label>
          E-mail corporativo{" "}
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com.br"
            maxLength={180}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </label>
        <label>
          Telefone / WhatsApp{" "}
          <input
            type="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            maxLength={30}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </label>
      </div>
      <label className="ef5-form-full">
        Tamanho da equipe{" "}
        <select
          value={form.teamSize}
          onChange={(e) => update("teamSize", e.target.value)}
        >
          <option>1–5 técnicos</option>
          <option>6–15 técnicos</option>
          <option>16–50 técnicos</option>
          <option>Mais de 50 técnicos</option>
          <option>Ainda estou estruturando</option>
        </select>
      </label>
      <label className="ef5-form-full">
        Qual desafio você quer resolver?{" "}
        <textarea
          placeholder="Conte sobre sua operação (opcional)"
          rows={3}
          maxLength={1500}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </label>
      <div className="ef5-form-honeypot" aria-hidden="true">
        <label>
          Website{" "}
          <input
            type="text"
            autoComplete="off"
            tabIndex={-1}
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </label>
      </div>
      <label className="ef5-form-consent">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          required
        />
        <span>
          Autorizo a EWS Tech a usar meus dados para responder a solicitação.
          Consulte a <Link href="/privacidade">Política de Privacidade</Link>.
        </span>
      </label>
      {state.message && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`ef5-form-feedback ${state.status}`}
        >
          {state.status === "success" && <CheckCircle2 size={18} />}{" "}
          {state.message}
        </div>
      )}
      <button
        type="submit"
        className="ef5-form-submit"
        disabled={!ready || state.status === "sending"}
      >
        {state.status === "sending"
          ? "Enviando solicitação..."
          : "Solicitar demonstração"}{" "}
        <ArrowUpRight size={20} />
      </button>
      <span className="ef5-form-hint">
        Sem compromisso. Uma conversa para conhecer sua operação.
      </span>
    </form>
  );
}
