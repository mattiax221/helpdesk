"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BENCH_CASES,
  BENCH_KIND_LABEL,
  FAULT_DHCP_CAUSES,
  FAULT_DHCP_EVIDENCE,
  FAULT_DHCP_NEXT,
  FAULT_HOSTS_CAUSES,
  FAULT_HOSTS_EVIDENCE,
  FAULT_HOSTS_NEXT,
  gradeAddressPlan,
  gradeDnsCutover,
  gradeFault,
  gradeProvision,
  lookupPreview,
  pingPreview,
  webPreview,
  type BenchGrade,
  type BenchKind,
  type DnsCutoverInput,
  type FaultInput,
  type PlanInput,
  type ProvisionInput,
} from "@/lib/lab-bench";

type Props = { onComplete: (score: number, meta?: Record<string, unknown>) => void };

const emptyProvision = (): ProvisionInput => ({
  hostname: "",
  ip: "",
  mask: "",
  gateway: "",
  dns: "",
  proxyOn: false,
  pingChecked: false,
  webChecked: false,
});

export function LabBench({ onComplete }: Props) {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [report, setReport] = useState("");
  const [grade, setGrade] = useState<BenchGrade | null>(null);
  const [provision, setProvision] = useState<ProvisionInput>(emptyProvision);
  const [cutover, setCutover] = useState<DnsCutoverInput>({ dns: "", flushed: false, lookupChecked: false });
  const [fault, setFault] = useState<FaultInput>({ causeId: "", nextId: "" });
  const [plan, setPlan] = useState<PlanInput>({ lab: "", segreteria: "", ospiti: "" });
  const [pingOut, setPingOut] = useState("");
  const [webOut, setWebOut] = useState("");
  const [lookupOut, setLookupOut] = useState("");

  const selected = BENCH_CASES.find((c) => c.id === caseId) ?? null;

  function reset(id: string) {
    setCaseId(id);
    setReport("");
    setGrade(null);
    setProvision(emptyProvision());
    setCutover({ dns: "", flushed: false, lookupChecked: false });
    setFault({ causeId: "", nextId: "" });
    setPlan({ lab: "", segreteria: "", ospiti: "" });
    setPingOut("");
    setWebOut("");
    setLookupOut("");
  }

  function submit(next: BenchGrade, title: string) {
    setGrade(next);
    onComplete(next.score, {
      scenarioId: caseId,
      scenarioTitle: title,
      report,
      actions: next.checks.map((c) => ({ id: c.id, label: c.label, ok: c.ok })),
      keywordsHit: next.keywordsHit,
      keywordsMiss: next.keywordsMiss,
      notes: next.notes,
      actionScore: next.actionScore,
      reportScore: next.reportScore,
    });
  }

  if (!selected) {
    const groups = (["procedure", "fault", "config"] as BenchKind[]).map((kind) => ({
      kind,
      cases: BENCH_CASES.filter((c) => c.kind === kind),
    }));
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Non è un quiz a tempo. Leggi il ticket, fai i controlli, poi scrivi l’intervento come lo consegneresti al docente.
        </p>
        {groups.map((group) => (
          <div key={group.kind} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {BENCH_KIND_LABEL[group.kind]}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {group.cases.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => reset(item.id)}
                  className="rounded-lg border bg-background p-3 text-left hover:border-teal-600"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.ticket}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{BENCH_KIND_LABEL[selected.kind]}</p>
          <p className="text-sm font-medium">{selected.title}</p>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{selected.ticket}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setCaseId(null)}>
          Cambia intervento
        </Button>
      </div>
      <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{selected.brief}</p>

      {selected.id === "provision-pc" && (
        <ProvisionForm
          value={provision}
          pingOut={pingOut}
          webOut={webOut}
          locked={Boolean(grade)}
          onChange={(next) => {
            setProvision(next);
            setPingOut("");
            setWebOut("");
          }}
          onPing={() => {
            const next = { ...provision, pingChecked: true };
            setProvision(next);
            setPingOut(pingPreview(next));
          }}
          onWeb={() => {
            const next = { ...provision, webChecked: true };
            setProvision(next);
            setWebOut(webPreview(next));
          }}
        />
      )}

      {selected.id === "dns-cutover" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-dns">Server DNS</Label>
            <Input
              id="new-dns"
              value={cutover.dns}
              disabled={Boolean(grade)}
              onChange={(e) => setCutover({ ...cutover, dns: e.target.value, lookupChecked: false })}
              placeholder="Indirizzo del nuovo DNS"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cutover.flushed}
                disabled={Boolean(grade)}
                onChange={(e) => setCutover({ ...cutover, flushed: e.target.checked, lookupChecked: false })}
              />
              Ho svuotato la cache DNS
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(grade)}
              onClick={() => {
                const next = { ...cutover, lookupChecked: true };
                setCutover(next);
                setLookupOut(lookupPreview(next));
              }}
            >
              Esegui nslookup
            </Button>
          </div>
          <pre className="min-h-28 whitespace-pre-wrap rounded-md bg-zinc-950 p-3 font-mono text-xs text-emerald-100">
            {lookupOut || "L’output di nslookup compare qui."}
          </pre>
        </div>
      )}

      {selected.id === "fault-dhcp" && (
        <FaultForm
          evidence={FAULT_DHCP_EVIDENCE}
          causes={FAULT_DHCP_CAUSES}
          nextSteps={FAULT_DHCP_NEXT}
          value={fault}
          locked={Boolean(grade)}
          onChange={setFault}
        />
      )}
      {selected.id === "fault-hosts" && (
        <FaultForm
          evidence={FAULT_HOSTS_EVIDENCE}
          causes={FAULT_HOSTS_CAUSES}
          nextSteps={FAULT_HOSTS_NEXT}
          value={fault}
          locked={Boolean(grade)}
          onChange={setFault}
        />
      )}

      {selected.id === "plan-vlsm" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["lab", "Laboratorio (≥ 60 host)", plan.lab],
              ["segreteria", "Segreteria (≥ 30 host)", plan.segreteria],
              ["ospiti", "Ospiti (≥ 10 host)", plan.ospiti],
            ] as const
          ).map(([key, label, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={value}
                disabled={Boolean(grade)}
                placeholder="10.20.0.0/25"
                onChange={(e) => setPlan({ ...plan, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="bench-report">Report di intervento</Label>
        <Textarea
          id="bench-report"
          rows={5}
          value={report}
          disabled={Boolean(grade)}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Cosa hai letto, cosa hai cambiato e come hai verificato che funzionasse."
        />
        <Button
          type="button"
          className="bg-teal-700 hover:bg-teal-800"
          disabled={Boolean(grade)}
          onClick={() => {
            if (selected.id === "provision-pc") submit(gradeProvision(provision, report), selected.title);
            else if (selected.id === "dns-cutover") submit(gradeDnsCutover(cutover, report), selected.title);
            else if (selected.id === "fault-dhcp" || selected.id === "fault-hosts") {
              submit(gradeFault(selected.id, fault, report), selected.title);
            } else submit(gradeAddressPlan(plan, report), selected.title);
          }}
        >
          Consegna intervento
        </Button>
      </div>

      {grade && <GradePanel grade={grade} />}
    </div>
  );
}

function GradePanel({ grade }: { grade: BenchGrade }) {
  const passed = useMemo(() => grade.checks.filter((c) => c.ok).length, [grade.checks]);
  return (
    <div className="space-y-2 rounded-lg border p-3 text-sm">
      <p className="text-base font-semibold">Valutazione: {grade.score}/100</p>
      <p className="text-muted-foreground">
        Controlli {grade.actionScore}/70 ({passed}/{grade.checks.length}) · Report {grade.reportScore}/30
      </p>
      <ul className="space-y-1">
        {grade.checks.map((check) => (
          <li key={check.id} className={check.ok ? "text-teal-700 dark:text-teal-300" : "text-muted-foreground"}>
            {check.ok ? "Superato" : "Non superato"} — {check.label}
          </li>
        ))}
      </ul>
      {grade.notes.map((note) => (
        <p key={note} className="text-xs text-muted-foreground">
          {note}
        </p>
      ))}
    </div>
  );
}

function ProvisionForm({
  value,
  pingOut,
  webOut,
  locked,
  onChange,
  onPing,
  onWeb,
}: {
  value: ProvisionInput;
  pingOut: string;
  webOut: string;
  locked: boolean;
  onChange: (next: ProvisionInput) => void;
  onPing: () => void;
  onWeb: () => void;
}) {
  const field = (key: "hostname" | "ip" | "mask" | "gateway" | "dns", label: string, placeholder: string) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={value[key]}
        disabled={locked}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...value, [key]: e.target.value, pingChecked: false, webChecked: false })}
      />
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("hostname", "Nome computer", "PC-AULA-04")}
        {field("ip", "Indirizzo IP", "10.20.30.44")}
        {field("mask", "Maschera", "255.255.255.0")}
        {field("gateway", "Gateway", "10.20.30.1")}
        {field("dns", "DNS", "10.20.0.2")}
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={value.proxyOn}
            disabled={locked}
            onChange={(e) => onChange({ ...value, proxyOn: e.target.checked, pingChecked: false, webChecked: false })}
          />
          Proxy attivo
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={locked} onClick={onPing}>
          Verifica ping al gateway
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={locked} onClick={onWeb}>
          Apri la intranet
        </Button>
      </div>
      {(pingOut || webOut) && (
        <pre className="whitespace-pre-wrap rounded-md bg-zinc-950 p-3 font-mono text-xs text-emerald-100">
          {[pingOut && `ping\n${pingOut}`, webOut && `browser\n${webOut}`].filter(Boolean).join("\n\n")}
        </pre>
      )}
    </div>
  );
}

function FaultForm({
  evidence,
  causes,
  nextSteps,
  value,
  locked,
  onChange,
}: {
  evidence: string[];
  causes: { id: string; label: string }[];
  nextSteps: { id: string; label: string }[];
  value: FaultInput;
  locked: boolean;
  onChange: (next: FaultInput) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <pre className="whitespace-pre-wrap rounded-md bg-zinc-950 p-3 font-mono text-xs text-emerald-100">
        {evidence.join("\n")}
      </pre>
      <div className="space-y-4 text-sm">
        <fieldset className="space-y-2">
          <legend className="font-medium">Causa</legend>
          {causes.map((option) => (
            <label key={option.id} className="flex items-start gap-2">
              <input
                type="radio"
                name="cause"
                className="mt-1"
                disabled={locked}
                checked={value.causeId === option.id}
                onChange={() => onChange({ ...value, causeId: option.id })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="font-medium">Prossimo controllo</legend>
          {nextSteps.map((option) => (
            <label key={option.id} className="flex items-start gap-2">
              <input
                type="radio"
                name="next"
                className="mt-1"
                disabled={locked}
                checked={value.nextId === option.id}
                onChange={() => onChange({ ...value, nextId: option.id })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
