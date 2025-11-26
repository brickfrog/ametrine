/**
 * TypeScript interfaces for Jupyter Notebook format (nbformat v4)
 * Based on https://nbformat.readthedocs.io/en/latest/format_description.html
 */

// Cell output types
export interface ExecuteResultOutput {
  output_type: "execute_result";
  execution_count: number | null;
  data: Record<string, string | string[]>; // mime-type -> content
  metadata?: Record<string, unknown>;
}

export interface DisplayDataOutput {
  output_type: "display_data";
  data: Record<string, string | string[]>;
  metadata?: Record<string, unknown>;
}

export interface StreamOutput {
  output_type: "stream";
  name: "stdout" | "stderr";
  text: string | string[];
}

export interface ErrorOutput {
  output_type: "error";
  ename: string;
  evalue: string;
  traceback: string[];
}

export type CellOutput =
  | ExecuteResultOutput
  | DisplayDataOutput
  | StreamOutput
  | ErrorOutput;

// Cell types
export interface BaseCell {
  cell_type: string;
  source: string | string[];
  metadata: Record<string, unknown>;
}

export interface CodeCell extends BaseCell {
  cell_type: "code";
  execution_count: number | null;
  outputs: CellOutput[];
}

export interface MarkdownCell extends BaseCell {
  cell_type: "markdown";
  attachments?: Record<string, Record<string, string>>;
}

export interface RawCell extends BaseCell {
  cell_type: "raw";
}

export type NotebookCell = CodeCell | MarkdownCell | RawCell;

// Notebook metadata for ametrine integration
export interface AmetrineMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  draft?: boolean;
  created?: string;
  modified?: string;
  author?: string | string[];
  aliases?: string[];
}

// Full notebook structure
export interface Notebook {
  metadata: {
    kernelspec?: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info?: {
      name: string;
      version?: string;
      mimetype?: string;
      file_extension?: string;
    };
    ametrine?: AmetrineMetadata;
    [key: string]: unknown;
  };
  nbformat: number;
  nbformat_minor: number;
  cells: NotebookCell[];
}

// Rendered output
export interface RenderedNotebook {
  html: string;
  toc: TocEntry[];
  links: string[];
}

export interface TocEntry {
  depth: number;
  text: string;
  slug: string;
}
