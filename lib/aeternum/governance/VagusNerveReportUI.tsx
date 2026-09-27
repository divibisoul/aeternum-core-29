import React, { useEffect, useState } from "react";
import { aeternumBus } from "../EventBus";
import type { VagusTrafficReport } from "./VagusNerveReportModule";

export const VagusNerveReportUI: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [report, setReport] = useState<VagusTrafficReport | null>(null);

  useEffect(() => {
    const offOpen = aeternumBus.on<{ module: string }>("module.activated", ({ module }) => {
      if (module === "M8.vagus-nerve-report") setVisible(true);
    });
    const offClose = aeternumBus.on<{ module: string }>("module.deactivated", ({ module }) => {
      if (module === "M8.vagus-nerve-report") setVisible(false);
    });
    const offReport = aeternumBus.on<VagusTrafficReport>(
      "governance.vagus.report.generated",
      setReport,
    );

    return () => {
      offOpen();
      offClose();
      offReport();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    void aeternumBus.emit("governance.vagus.report.generate", {});
    const timer = setInterval(() => {
      void aeternumBus.emit("governance.vagus.report.generate", {});
    }, 3000);
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <aside className="fixed right-0 top-0 z-40 flex h-full w-96 flex-col border-l border-cyan-500/30 bg-black/95 text-white backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <div className="text-sm font-bold text-cyan-400">💓 NERVO VAGO · M8</div>
          <div className="text-[11px] text-gray-500">
            {report ? report.health : "UNASSESSED"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void aeternumBus.emit("governance.vagus.report.deactivate", {})}
          className="rounded bg-red-500/20 px-2 py-1 text-xs"
        >
          Desativar
        </button>
      </header>

      {report ? (
        <div className="grid grid-cols-2 gap-2 border-b border-white/10 p-4 text-xs">
          <div className="rounded bg-white/5 p-2">
            <div className="text-gray-400">Eventos</div>
            <div className="font-bold text-cyan-400">{report.totalEvents}</div>
          </div>
          <div className="rounded bg-white/5 p-2">
            <div className="text-gray-400">Eventos/min</div>
            <div className="font-bold text-cyan-400">{report.eventsPerMinute}</div>
          </div>
          <div className="rounded bg-white/5 p-2">
            <div className="text-gray-400">Intervalo médio</div>
            <div className="font-bold text-cyan-400">
              {report.averageInterEventGapMs === null
                ? "n/a"
                : `${report.averageInterEventGapMs.toFixed(2)} ms`}
            </div>
          </div>
          <div className="rounded bg-white/5 p-2">
            <div className="text-gray-400">Base</div>
            <div className="font-bold text-cyan-400">EventBus</div>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-4 text-xs">
        <div className="mb-2 text-gray-400">Top eventos observados</div>
        <div className="space-y-1">
          {(report?.topEvents ?? []).map((entry) => (
            <div key={entry.event} className="flex justify-between rounded bg-white/5 p-2">
              <span className="truncate text-white/70">{entry.event}</span>
              <span className="text-cyan-400">{entry.count}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
