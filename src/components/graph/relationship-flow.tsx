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

import {
  CharacterNode,
  type CharacterNodeData
} from "@/components/graph/character-node";
import type { Character, Relationship } from "@/types/database";

type RelationshipFlowProps = {
  characters: Character[];
  relationships: Relationship[];
};

const NODE_WIDTH = 190;
const PROTAGONIST_NODE_WIDTH = 210;
const NODE_HEIGHT = 88;
const CENTER_X = 480;
const CENTER_Y = 360;
const RING_RADIUS = 300;

const nodeTypes = {
  character: CharacterNode
};

const PROTAGONIST_ROLE_PATTERN =
  /주인공|주연|protagonist|hero|main\s*character|\bmc\b|히로인|여주|남주/i;

function connectionCount(
  characterId: string,
  relationships: Relationship[],
  visibleIds: Set<string>
) {
  return relationships.filter(
    (relationship) =>
      visibleIds.has(relationship.source_character_id) &&
      visibleIds.has(relationship.target_character_id) &&
      (relationship.source_character_id === characterId ||
        relationship.target_character_id === characterId)
  ).length;
}

function pickProtagonist(
  characters: Character[],
  relationships: Relationship[]
): Character {
  const visibleIds = new Set(characters.map((character) => character.id));

  const scored = characters.map((character, index) => {
    const role = character.role ?? "";
    const roleScore = PROTAGONIST_ROLE_PATTERN.test(role) ? 1000 : 0;
    const links = connectionCount(character.id, relationships, visibleIds);

    return {
      character,
      score: roleScore + links * 10 + Math.max(0, 50 - index)
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.character ?? characters[0];
}

function layoutPositions(
  characters: Character[],
  protagonistId: string
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const others = characters.filter((character) => character.id !== protagonistId);

  positions.set(protagonistId, {
    x: CENTER_X - PROTAGONIST_NODE_WIDTH / 2,
    y: CENTER_Y - NODE_HEIGHT / 2
  });

  if (others.length === 0) {
    return positions;
  }

  if (others.length === 1) {
    positions.set(others[0].id, {
      x: CENTER_X + RING_RADIUS - NODE_WIDTH / 2,
      y: CENTER_Y - NODE_HEIGHT / 2
    });
    return positions;
  }

  others.forEach((character, index) => {
    const angle = -Math.PI / 2 + (index / others.length) * Math.PI * 2;
    positions.set(character.id, {
      x: CENTER_X + Math.cos(angle) * RING_RADIUS - NODE_WIDTH / 2,
      y: CENTER_Y + Math.sin(angle) * RING_RADIUS - NODE_HEIGHT / 2
    });
  });

  return positions;
}

function nodeCenter(
  position: { x: number; y: number },
  isProtagonist: boolean
) {
  const width = isProtagonist ? PROTAGONIST_NODE_WIDTH : NODE_WIDTH;
  return {
    x: position.x + width / 2,
    y: position.y + NODE_HEIGHT / 2
  };
}

/**
 * Pick source/target handles so the edge leaves/enters on the side
 * facing the other node — avoids loops through top-only default handles.
 */
function pickHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  sourceIsProtagonist: boolean,
  targetIsProtagonist: boolean
) {
  const sc = nodeCenter(sourcePos, sourceIsProtagonist);
  const tc = nodeCenter(targetPos, targetIsProtagonist);
  const dx = tc.x - sc.x;
  const dy = tc.y - sc.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    // Prefer horizontal connection
    if (dx >= 0) {
      return { sourceHandle: "source-right", targetHandle: "target-left" };
    }
    return { sourceHandle: "source-left", targetHandle: "target-right" };
  }

  if (dy >= 0) {
    return { sourceHandle: "source-bottom", targetHandle: "target-top" };
  }
  return { sourceHandle: "source-top", targetHandle: "target-bottom" };
}

export function RelationshipFlow({
  characters,
  relationships
}: RelationshipFlowProps) {
  const { nodes, edges, protagonistName } = useMemo(() => {
    if (characters.length === 0) {
      return {
        nodes: [] as Node[],
        edges: [] as Edge[],
        protagonistName: null as string | null
      };
    }

    const protagonist = pickProtagonist(characters, relationships);
    const positions = layoutPositions(characters, protagonist.id);
    const protagonistId = protagonist.id;

    const builtNodes: Node<CharacterNodeData>[] = characters.map((character) => {
      const isProtagonist = character.id === protagonistId;
      const position = positions.get(character.id) ?? {
        x: CENTER_X,
        y: CENTER_Y
      };

      return {
        id: character.id,
        type: "character",
        position,
        data: {
          name: character.name,
          role: character.role || "역할 미입력",
          isProtagonist
        },
        draggable: true
      };
    });

    const visibleCharacterIds = new Set(characters.map((character) => character.id));
    const positionById = positions;

    const builtEdges: Edge[] = relationships
      .filter(
        (relationship) =>
          visibleCharacterIds.has(relationship.source_character_id) &&
          visibleCharacterIds.has(relationship.target_character_id) &&
          relationship.source_character_id !== relationship.target_character_id
      )
      .map((relationship) => {
        const sourcePos = positionById.get(relationship.source_character_id);
        const targetPos = positionById.get(relationship.target_character_id);
        const sourceIsProtagonist =
          relationship.source_character_id === protagonistId;
        const targetIsProtagonist =
          relationship.target_character_id === protagonistId;

        const handles =
          sourcePos && targetPos
            ? pickHandles(
                sourcePos,
                targetPos,
                sourceIsProtagonist,
                targetIsProtagonist
              )
            : {
                sourceHandle: "source-right",
                targetHandle: "target-left"
              };

        const touchesProtagonist = sourceIsProtagonist || targetIsProtagonist;

        return {
          id: relationship.id,
          source: relationship.source_character_id,
          target: relationship.target_character_id,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          type: "straight",
          label: relationship.label || relationship.relationship_type,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: "#e71a0f"
          },
          style: {
            strokeWidth: touchesProtagonist ? 2.5 : 2,
            stroke: touchesProtagonist ? "#e71a0f" : "rgba(231, 26, 15, 0.7)"
          },
          labelStyle: {
            fill: "#f5f5f7",
            fontSize: 11,
            fontWeight: 700
          },
          labelBgStyle: {
            fill: "#1c1c22",
            fillOpacity: 0.95
          },
          labelBgPadding: [8, 4] as [number, number],
          labelBgBorderRadius: 6
        };
      });

    return {
      nodes: builtNodes,
      edges: builtEdges,
      protagonistName: protagonist.name
    };
  }, [characters, relationships]);

  if (nodes.length === 0) {
    return (
      <div className="cinema-card grid min-h-[420px] place-items-center rounded-2xl p-8 text-center text-muted-foreground">
        현재 진행도에서 공개된 인물이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {protagonistName ? (
        <p className="text-sm text-muted-foreground">
          중앙 배치:{" "}
          <span className="font-semibold text-primary">{protagonistName}</span>
          <span>
            {" "}
            · 역할에 「주인공」이 있으면 우선, 없으면 관계가 가장 많은 인물
          </span>
        </p>
      ) : null}
      <div className="h-[70vh] min-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          nodesDraggable
          nodesConnectable={false}
          edgesFocusable={false}
          elementsSelectable
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "straight",
            animated: false
          }}
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
            nodeColor={(node) =>
              (node.data as CharacterNodeData | undefined)?.isProtagonist
                ? "#e71a0f"
                : "#5a5a66"
            }
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
    </div>
  );
}
