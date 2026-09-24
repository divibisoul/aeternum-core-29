import React, { useEffect, useState } from "react";
import { aeternumBus } from "../EventBus";

type ForgeState = {
  name?: string;
  stage?: string;
  status?: string;
  capabilityId?: string;
};

export const NeuralForgeUI: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ForgeState | null>(null);
  const [items, setItems] = useState<ForgeState[]>([]);

  useEffect(() => {
    const offOpen = aeternumBus.on<{ module: string }>("evolution.module.activated", (event) => {
      if (event.module === "M7.neural-forge") setVisible(true);
    });
    const offClose = aeternumBus.on<{ module: string }>("evolution.module.deactivated", (event) => {
      if (event.module === "M7.neural-forge") setVisible(false);
    });
    const offProgress = aeternumBus.on<ForgeState>("evolution.forge.progress", setCurrent);
    const offCreated = aeternumBus.on<ForgeState>("evolution.forge.created", (result) => {
      setItems((previous) => [...previous, result].slice(-50));
      setCurrent(null);
    });
    const offUnbound = aeternumBus.on<ForgeState>("evolution.forge.unbound", () => {
      setCurrent({ status: "handler_not_bound" });
    });

    return () => {
      offOpen();
      offClose();
      offProgress();
      offCreated();
      offUnbound();
    };
  }, []);

  if (!visible) return null;

  return (
    <aside className="fixed right-0 top-0 z-40 h-full w-96 border-l border-orange-500/30 bg-black/95 p-4 text-white backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-sm font-bold text-orange-400">⚒️ FORJA NEURAL · M7</h3>
        <button
          type="button"
          onClick={() => void aeternumBus.emit("evolution.forge.deactivate", {})}
          className="rounded bg-red-500/20 px-2 py-1 text-xs"
        >
          Desativar
        </button>
      </div>

      {current ? (
        <div className="mb-4 rounded border border-orange-500/20 bg-white/5 p-3 text-xs">
          {current.name ?? "Forja"} · {current.stage ?? current.status ?? "estado"}
        </div>
      ) : null}

      <div className="space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            Nenhuma capacidade produzida por executor real.
          </div>
        ) : (
          items.map((item, index) => (
            <div key={item.capabilityId ?? index} className="rounded border border-orange-500/10 bg-white/5 p-3 text-xs">
              <div className="font-medium text-orange-300">{item.name ?? item.capabilityId ?? "Capacidade"}</div>
              <div className="mt-1 text-gray-300">{item.status ?? "completed"}</div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
