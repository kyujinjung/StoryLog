"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";

import type { Character, Relationship } from "@/types/database";

type RelationshipFlowProps = {
  characters: Character[];
  relationships: Relationship[];
};

const NODE_WIDTH = 180;
const COLUMN_GAP = 260;
const ROW_GAP = 140;

export function RelationshipFlow({
  characters,
  relationships
}: RelationshipFlowProps) {
  const { nodes, edges } = useMemo(() => {
    const columns = Math.max(1, Math.ceil(Math.sqrt(characters.length)));
    const builtNodes: Node[] = characters.map((character, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);

      return {
        id: character.id,
        position: {
          x: column * COLUMN_GAP,
          y: row * ROW_GAP
        },
        data: {
          label: (
            <div className="grid gap-1 text-left">
              <span
                className="text-sm font-bold leading-snug"
                style={{ color: "#f5f5f7" }}
              >
                {character.name}
              </span>
              <span className="text-xs" style={{ color: "#a1a1aa" }}>
                {character.role || "역할 미입력"}
              </span>
            </div>
          )
        },
        style: {
          width: NODE_WIDTH,
          border: "1px solid rgba(231, 26, 15, 0.55)",
          borderRadius: 12,
          background: "linear-gradient(180deg, #2a2a32 0%, #16161a 100%)",
          color: "#f5f5f7",
          padding: 12,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)"
        }
      };
    });

    const visibleCharacterIds = new Set(characters.map((character) => character.id));
    const builtEdges: Edge[] = relationships
      .filter(
        (relationship) =>
          visibleCharacterIds.has(relationship.source_character_id) &&
          visibleCharacterIds.has(relationship.target_character_id)
      )
      .map((relationship) => ({
        id: relationship.id,
        source: relationship.source_character_id,
        target: relationship.target_character_id,
        label: relationship.label || relationship.relationship_type,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#e71a0f"
        },
        style: {
          strokeWidth: 2,
          stroke: "#e71a0f"
        },
        labelStyle: {
          fill: "#f5f5f7",
          fontSize: 12,
          fontWeight: 700
        },
        labelBgStyle: {
          fill: "#1c1c22",
          fillOpacity: 0.95
        },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 6
      }));

    return { nodes: builtNodes, edges: builtEdges };
  }, [characters, relationships]);

  if (nodes.length === 0) {
    return (
      <div className="cinema-card grid min-h-[420px] place-items-center rounded-2xl p-8 text-center text-muted-foreground">
        현재 진행도에서 공개된 인물이 없습니다.
      </div>
    );
  }

  return (
    <div className="h-[70vh] min-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable
        nodesConnectable={false}
        edgesFocusable={false}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="rgba(255,255,255,0.08)"
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(0,0,0,0.65)"
          nodeColor="#e71a0f"
          style={{
            background: "#16161a",
            border: "1px solid rgba(255,255,255,0.1)"
          }}
        />
        <Controls
          style={{
            background: "#1c1c22",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8
          }}
        />
      </ReactFlow>
    </div>
  );
}
