"use client";

import { useMemo } from "react";
import {
  Background,
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
              <span className="font-semibold">{character.name}</span>
              <span className="text-xs text-muted-foreground">
                {character.role || "역할 미입력"}
              </span>
            </div>
          )
        },
        style: {
          width: NODE_WIDTH,
          border: "1px solid rgb(203 213 225)",
          borderRadius: 8,
          background: "rgb(255 255 255)",
          padding: 12
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
          type: MarkerType.ArrowClosed
        },
        style: {
          strokeWidth: 2,
          stroke: "rgb(20 83 45)"
        },
        labelStyle: {
          fill: "rgb(15 23 42)",
          fontSize: 12,
          fontWeight: 600
        },
        labelBgStyle: {
          fill: "rgb(248 250 252)",
          fillOpacity: 0.9
        }
      }));

    return { nodes: builtNodes, edges: builtEdges };
  }, [characters, relationships]);

  if (nodes.length === 0) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-lg border bg-card p-8 text-center text-muted-foreground">
        현재 진행도에서 공개된 인물이 없습니다.
      </div>
    );
  }

  return (
    <div className="h-[70vh] min-h-[520px] overflow-hidden rounded-lg border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        nodesDraggable
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
