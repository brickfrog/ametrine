import { useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CanvasData } from "../../pages/static/contentIndex.json";
import { getCanvasColor } from "../../utils/canvas";
import { TableView } from "./TableView";

interface FileNodeData {
  type: "note" | "base" | "image" | "not-found";
  note?: any;
  baseName?: string;
  view?: any;
  notes?: any[];
  path?: string;
}

interface CanvasViewerProps {
  canvasData: CanvasData;
  canvasName: string;
  fileData: Record<string, FileNodeData>;
}

// Custom node component for text nodes
function TextNode({ data }: { data: any }) {
  const color = getCanvasColor(data.color);
  return (
    <>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <div
        className="p-2 rounded-md min-w-[100px] min-h-[50px] text-sm font-medium whitespace-pre-wrap"
        style={{
          background: "var(--color-light)",
          border: `3px solid ${color}`,
          color: "var(--color-dark)",
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {data.text}
      </div>
    </>
  );
}

// Note preview component
function NotePreview({ slug }: { slug: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`/${slug}`);
        if (response.ok) {
          const htmlText = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, "text/html");
          const article = doc.querySelector("article");
          if (article) {
            setHtml(article.innerHTML);
          }
        }
      } catch (error) {
        console.error("Failed to load note content:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [slug]);

  if (loading) {
    return (
      <div className="p-3 text-sm" style={{ color: "var(--color-gray)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Custom node component for file nodes
function FileNode({ data }: { data: any }) {
  const color = getCanvasColor(data.color);
  const fileInfo = data.fileData;

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <div
        className="rounded-md overflow-hidden min-w-[200px] h-full"
        style={{
          background: "var(--color-light)",
          border: `3px solid ${color}`,
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {fileInfo?.type === "image" ? (
          <img
            src={`/src/content/vault/${fileInfo.path}`}
            className="w-full h-full object-cover block"
            alt=""
          />
        ) : (
          <div
            className={`nowheel h-full overflow-auto max-h-[400px] ${fileInfo?.type === "base" ? "p-0" : "p-3"}`}
            onWheel={(e) => e.stopPropagation()}
          >
            {fileInfo?.type === "note" && fileInfo.note?.slug && (
              <NotePreview slug={fileInfo.note.slug} />
            )}
            {fileInfo?.type === "base" && (
              <div className="min-w-max canvas-base-table">
                <style>{`
                  .canvas-base-table table {
                    margin: 0 !important;
                    margin-top: 0 !important;
                    margin-bottom: 0 !important;
                  }
                `}</style>
                <TableView
                  notes={fileInfo.notes as any[]}
                  view={fileInfo.view}
                  baseName={fileInfo.baseName || "Base"}
                />
              </div>
            )}
            {fileInfo?.type === "not-found" && (
              <div
                className="text-center p-5"
                style={{ color: "var(--color-gray)" }}
              >
                <div className="text-3xl mb-2">⚠️</div>
                <div className="text-xs font-medium">File not found</div>
                <div className="text-[10px]">{fileInfo.path}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const nodeTypes = {
  text: TextNode,
  file: FileNode,
};

export function CanvasViewer({
  canvasData,
  canvasName: _canvasName,
  fileData,
}: CanvasViewerProps) {
  // Convert Obsidian canvas data to React Flow format
  const initialNodes: Node[] = (canvasData.nodes || []).map((node) => {
    const nodeType = node.type === "text" ? "text" : "file";

    return {
      id: node.id,
      type: nodeType,
      position: { x: node.x, y: node.y },
      data: {
        text: node.text,
        color: node.color,
        fileData: fileData[node.id],
      },
      style: {
        width: node.width,
        height: node.height,
      },
    };
  });

  const initialEdges: Edge[] = (canvasData.edges || []).map((edge) => {
    const strokeColor = edge.color
      ? getCanvasColor(edge.color)
      : "var(--color-dark)";

    const edgeConfig: any = {
      id: edge.id,
      source: edge.fromNode,
      target: edge.toNode,
      sourceHandle: edge.fromSide,
      targetHandle: edge.toSide,
      type: "smoothstep",
      animated: false,
      style: {
        stroke: strokeColor,
        strokeWidth: 2.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: strokeColor,
        width: 20,
        height: 20,
      },
    };

    if (edge.label) {
      edgeConfig.label = edge.label;
    }

    return edgeConfig;
  });

  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div
      className="w-full h-[800px] rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--color-lightgray)" }}
    >
      <style>{`
        .react-flow__controls {
          background: var(--color-light);
          border: 1px solid var(--color-lightgray);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .react-flow__controls-button {
          background: var(--color-light);
          border-bottom: 1px solid var(--color-lightgray);
          color: var(--color-dark);
        }
        .react-flow__controls-button:hover {
          background: var(--color-lightgray);
        }
        .react-flow__minimap {
          background: var(--color-light);
          border: 1px solid var(--color-lightgray);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .react-flow__edge-path {
          stroke-width: 2.5;
        }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke-width: 3.5;
          filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
        }
        .react-flow__attribution {
          display: none !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        connectOnClick={false}
        elementsSelectable={true}
        noWheelClassName="nowheel"
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
      >
        <Background
          color="var(--color-gray)"
          gap={20}
          size={1}
          style={{ opacity: 0.3 }}
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            return getCanvasColor(data?.color) || "var(--color-lightgray)";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
