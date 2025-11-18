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
import type { Note } from "../../utils/filterNotes";
import type { BaseView } from "../../utils/bases/types";
import { getCanvasColor } from "../../utils/canvas";
import { logger } from "../../utils/logger";
import { TableView } from "./TableView";
import { ArrowUpRight } from "lucide-react";

interface FileNodeData {
  type: "note" | "base" | "image" | "not-found";
  note?: Note;
  baseName?: string;
  view?: BaseView;
  notes?: Note[];
  path?: string;
  file?: string; // Original file path for navigation
}

interface TextNodeData {
  text: string;
  color?: string;
}

interface CanvasViewerProps {
  canvasData: CanvasData;
  canvasName: string;
  fileData: Record<string, FileNodeData>;
}

// Custom node component for text nodes
function TextNode({ data }: { data: TextNodeData }) {
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
        const response = await fetch(`${import.meta.env.BASE_URL}/${slug}`);
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
        logger.error("Failed to load note content:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [slug]);

  if (loading) {
    return <div className="p-3 text-sm text-theme-gray">Loading...</div>;
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface FileNodeProps {
  color?: string;
  fileData: FileNodeData;
  file: string;
}

// Helper function to generate navigation URL based on file type
function getNavigationUrl(fileData: FileNodeData): string | null {
  const baseUrl = import.meta.env.BASE_URL;

  if (fileData.type === "note" && fileData.note?.slug) {
    return `${baseUrl}/${fileData.note.slug}`;
  }

  if (fileData.type === "base" && fileData.baseName && fileData.view?.name) {
    const viewSlug = fileData.view.name.toLowerCase().replace(/\s+/g, "-");
    return `${baseUrl}/base/${fileData.baseName}/${viewSlug}`;
  }

  if (fileData.type === "image" && fileData.file) {
    // Extract filename without extension and directory
    const fileName = fileData.file.split("/").pop() || fileData.file;
    const nameWithoutExt = fileName.replace(
      /\.(png|jpg|jpeg|webp|gif|svg|avif)$/i,
      "",
    );
    return `${baseUrl}/image/${nameWithoutExt}`;
  }

  return null;
}

// Custom node component for file nodes
function FileNode({ data }: { data: FileNodeProps }) {
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
        className="rounded-md overflow-hidden min-w-[200px] h-full relative"
        style={{
          background: "var(--color-light)",
          border: `3px solid ${color}`,
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {(() => {
          const navUrl = getNavigationUrl(fileInfo);
          if (!navUrl) return null;

          const label =
            fileInfo.type === "note"
              ? "Open note in full view"
              : fileInfo.type === "base"
                ? "Open base view"
                : fileInfo.type === "image"
                  ? "Open image in full view"
                  : "Open file";

          return (
            <a
              href={navUrl}
              className="absolute top-2 right-2 z-50 flex items-center justify-center w-7 h-7 rounded-md bg-theme-light hover:bg-theme-lightgray text-theme-secondary hover:text-theme-tertiary transition-colors shadow-md border border-theme-lightgray"
              title={label}
              aria-label={label}
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowUpRight size={16} />
            </a>
          );
        })()}
        {fileInfo?.type === "image" ? (
          <img
            src={fileInfo.path}
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
            {fileInfo?.type === "base" && fileInfo.view && (
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
              <div className="text-center p-5 text-theme-gray">
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
  logger.debug("[CanvasViewer] canvasData:", canvasData);
  logger.debug("[CanvasViewer] fileData:", fileData);

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

    const edgeConfig: Edge = {
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
      label: edge.label,
    };

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
