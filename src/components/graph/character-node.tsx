"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export type CharacterNodeData = {
  name: string;
  role: string;
  isProtagonist: boolean;
};

const handleStyle = {
  width: 8,
  height: 8,
  background: "#e71a0f",
  border: "2px solid #1a1a20"
};

export function CharacterNode({ data }: NodeProps) {
  const nodeData = data as CharacterNodeData;
  const isProtagonist = nodeData.isProtagonist;

  return (
    <div
      className="relative rounded-xl px-3 py-2.5 shadow-lg"
      style={{
        minWidth: isProtagonist ? 200 : 180,
        maxWidth: isProtagonist ? 220 : 200,
        border: isProtagonist
          ? "2px solid #e71a0f"
          : "1px solid rgba(231, 26, 15, 0.45)",
        background: isProtagonist
          ? "linear-gradient(160deg, rgba(231, 26, 15, 0.35) 0%, #1a1a20 55%, #121216 100%)"
          : "linear-gradient(180deg, #2a2a32 0%, #16161a 100%)",
        boxShadow: isProtagonist
          ? "0 0 28px rgba(231, 26, 15, 0.35), 0 10px 28px rgba(0,0,0,0.5)"
          : "0 8px 24px rgba(0, 0, 0, 0.45)",
        color: "#f5f5f7"
      }}
    >
      {/* Target handles (incoming) */}
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        style={handleStyle}
      />
      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        style={handleStyle}
      />
      <Handle
        id="target-bottom"
        type="target"
        position={Position.Bottom}
        style={handleStyle}
      />
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        style={handleStyle}
      />

      {/* Source handles (outgoing) */}
      <Handle
        id="source-top"
        type="source"
        position={Position.Top}
        style={handleStyle}
      />
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        style={handleStyle}
      />
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        style={handleStyle}
      />
      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        style={handleStyle}
      />

      <div className="grid gap-1 text-left">
        {isProtagonist ? (
          <span
            className="w-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
            style={{
              background: "rgba(231, 26, 15, 0.25)",
              color: "#ff8a80",
              border: "1px solid rgba(231, 26, 15, 0.55)"
            }}
          >
            주인공
          </span>
        ) : null}
        <span className="text-sm font-bold leading-snug" style={{ color: "#f5f5f7" }}>
          {nodeData.name}
        </span>
        <span className="text-xs" style={{ color: "#a1a1aa" }}>
          {nodeData.role || "역할 미입력"}
        </span>
      </div>
    </div>
  );
}
