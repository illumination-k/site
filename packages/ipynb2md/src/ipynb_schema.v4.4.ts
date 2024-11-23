// To parse this data:
//
//   import { Convert, IpynbSchemaV44 } from "./file";
//
//   const ipynbSchemaV44 = Convert.toIpynbSchemaV44(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * Jupyter Notebook v4.4 JSON schema.
 */
export interface IpynbSchemaV44 {
  /**
   * Array of cells of the current notebook.
   */
  cells: Cell[];
  /**
   * Notebook root-level metadata.
   */
  metadata: IpynbSchemaV44_Metadata;
  /**
   * Notebook format (major number). Incremented between backwards incompatible changes to the
   * notebook format.
   */
  nbformat: number;
  /**
   * Notebook format (minor number). Incremented for backward compatible changes to the
   * notebook format.
   */
  nbformat_minor: number;
}

/**
 * Notebook raw nbconvert cell.
 *
 * Notebook markdown cell.
 *
 * Notebook code cell.
 */
export interface Cell {
  attachments?: { [key: string]: { [key: string]: string[] | string } };
  /**
   * String identifying the type of cell.
   */
  cell_type: CellType;
  /**
   * Cell-level metadata.
   */
  metadata: CellMetadata;
  source: string[] | string;
  /**
   * The code cell's prompt number. Will be null if the cell has not been run.
   */
  execution_count?: number | null;
  /**
   * Execution, display, or stream outputs.
   */
  outputs?: Output[];
}

/**
 * String identifying the type of cell.
 */
export enum CellType {
  Code = "code",
  Markdown = "markdown",
  Raw = "raw",
}

/**
 * Cell-level metadata.
 */
export interface CellMetadata {
  /**
   * Raw cell metadata format for nbconvert.
   */
  format?: string;
  /**
   * Official Jupyter Metadata for Raw Cells
   *
   * Official Jupyter Metadata for Markdown Cells
   *
   * Official Jupyter Metadata for Code Cells
   */
  jupyter?: { [key: string]: any };
  name?: string;
  tags?: string[];
  /**
   * Whether the cell's output is collapsed/expanded.
   */
  collapsed?: boolean;
  /**
   * Execution time for the code in the cell. This tracks time at which messages are received
   * from iopub or shell channels
   */
  execution?: Execution;
  /**
   * Whether the cell's output is scrolled, unscrolled, or autoscrolled.
   */
  scrolled?: boolean | ScrolledEnum;
  [property: string]: any;
}

/**
 * Execution time for the code in the cell. This tracks time at which messages are received
 * from iopub or shell channels
 */
export interface Execution {
  /**
   * header.date (in ISO 8601 format) of iopub channel's execute_input message. It indicates
   * the time at which the kernel broadcasts an execute_input message to connected frontends
   */
  "iopub.execute_input"?: string;
  /**
   * header.date (in ISO 8601 format) of iopub channel's kernel status message when the status
   * is 'busy'
   */
  "iopub.status.busy"?: string;
  /**
   * header.date (in ISO 8601 format) of iopub channel's kernel status message when the status
   * is 'idle'. It indicates the time at which kernel finished processing the associated
   * request
   */
  "iopub.status.idle"?: string;
  /**
   * header.date (in ISO 8601 format) of the shell channel's execute_reply message. It
   * indicates the time at which the execute_reply message was created
   */
  "shell.execute_reply"?: string;
  [property: string]: any;
}

export enum ScrolledEnum {
  Auto = "auto",
}

/**
 * Result of executing a code cell.
 *
 * Data displayed as a result of code cell execution.
 *
 * Stream output from a code cell.
 *
 * Output of an error that occurred during code cell execution.
 */
export interface Output {
  data?: { [key: string]: string[] | string };
  /**
   * A result's prompt number.
   */
  execution_count?: number | null;
  metadata?: { [key: string]: any };
  /**
   * Type of cell output.
   */
  output_type: OutputType;
  /**
   * The name of the stream (stdout, stderr).
   */
  name?: string;
  /**
   * The stream's text output, represented as an array of strings.
   */
  text?: string[] | string;
  /**
   * The name of the error.
   */
  ename?: string;
  /**
   * The value, or message, of the error.
   */
  evalue?: string;
  /**
   * The error's traceback, represented as an array of strings.
   */
  traceback?: string[];
}

/**
 * Type of cell output.
 */
export enum OutputType {
  DisplayData = "display_data",
  Error = "error",
  ExecuteResult = "execute_result",
  Stream = "stream",
}

/**
 * Notebook root-level metadata.
 */
export interface IpynbSchemaV44_Metadata {
  /**
   * The author(s) of the notebook document
   */
  authors?: any[];
  /**
   * Kernel information.
   */
  kernelspec?: Kernelspec;
  /**
   * Kernel information.
   */
  language_info?: LanguageInfo;
  /**
   * Original notebook format (major number) before converting the notebook between versions.
   * This should never be written to a file.
   */
  orig_nbformat?: number;
  /**
   * The title of the notebook document
   */
  title?: string;
  [property: string]: any;
}

/**
 * Kernel information.
 */
export interface Kernelspec {
  /**
   * Name to display in UI.
   */
  display_name: string;
  /**
   * Name of the kernel specification.
   */
  name: string;
  [property: string]: any;
}

/**
 * Kernel information.
 */
export interface LanguageInfo {
  /**
   * The codemirror mode to use for code in this language.
   */
  codemirror_mode?: { [key: string]: any } | string;
  /**
   * The file extension for files in this language.
   */
  file_extension?: string;
  /**
   * The mimetype corresponding to files in this language.
   */
  mimetype?: string;
  /**
   * The programming language which this kernel runs.
   */
  name: string;
  /**
   * The pygments lexer to use for code in this language.
   */
  pygments_lexer?: string;
  [property: string]: any;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toIpynbSchemaV44(json: string): IpynbSchemaV44 {
    return cast(JSON.parse(json), r("IpynbSchemaV44"));
  }

  public static ipynbSchemaV44ToJson(value: IpynbSchemaV44): string {
    return JSON.stringify(uncast(value, r("IpynbSchemaV44")), null, 2);
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ""): never {
  const prettyTyp = prettyTypeName(typ);
  const parentText = parent ? ` on ${parent}` : "";
  const keyText = key ? ` for key "${key}"` : "";
  throw Error(
    `Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`,
  );
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`;
    } else {
      return `one of [${typ
        .map((a) => {
          return prettyTypeName(a);
        })
        .join(", ")}]`;
    }
  } else if (typeof typ === "object" && typ.literal !== undefined) {
    return typ.literal;
  } else {
    return typeof typ;
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }));
    typ.jsonToJS = map;
  }
  return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }));
    typ.jsToJSON = map;
  }
  return typ.jsToJSON;
}

function transform(
  val: any,
  typ: any,
  getProps: any,
  key: any = "",
  parent: any = "",
): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val;
    return invalidValue(typ, val, key, parent);
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length;
    for (let i = 0; i < l; i++) {
      const typ = typs[i];
      try {
        return transform(val, typ, getProps);
      } catch (_) {}
    }
    return invalidValue(typs, val, key, parent);
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val;
    return invalidValue(
      cases.map((a) => {
        return l(a);
      }),
      val,
      key,
      parent,
    );
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
    return val.map((el) => transform(el, typ, getProps));
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null;
    }
    const d = new Date(val);
    if (isNaN(d.valueOf())) {
      return invalidValue(l("Date"), val, key, parent);
    }
    return d;
  }

  function transformObject(
    props: { [k: string]: any },
    additional: any,
    val: any,
  ): any {
    if (val === null || typeof val !== "object" || Array.isArray(val)) {
      return invalidValue(l(ref || "object"), val, key, parent);
    }
    const result: any = {};
    Object.getOwnPropertyNames(props).forEach((key) => {
      const prop = props[key];
      const v = Object.prototype.hasOwnProperty.call(val, key)
        ? val[key]
        : undefined;
      result[prop.key] = transform(v, prop.typ, getProps, key, ref);
    });
    Object.getOwnPropertyNames(val).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key, ref);
      }
    });
    return result;
  }

  if (typ === "any") return val;
  if (typ === null) {
    if (val === null) return val;
    return invalidValue(typ, val, key, parent);
  }
  if (typ === false) return invalidValue(typ, val, key, parent);
  let ref: any = undefined;
  while (typeof typ === "object" && typ.ref !== undefined) {
    ref = typ.ref;
    typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === "object") {
    return typ.hasOwnProperty("unionMembers")
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty("arrayItems")
        ? transformArray(typ.arrayItems, val)
        : typ.hasOwnProperty("props")
          ? transformObject(getProps(typ), typ.additional, val)
          : invalidValue(typ, val, key, parent);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== "number") return transformDate(val);
  return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
  return { literal: typ };
}

function a(typ: any) {
  return { arrayItems: typ };
}

function u(...typs: any[]) {
  return { unionMembers: typs };
}

function o(props: any[], additional: any) {
  return { props, additional };
}

function m(additional: any) {
  return { props: [], additional };
}

function r(name: string) {
  return { ref: name };
}

const typeMap: any = {
  IpynbSchemaV44: o(
    [
      { json: "cells", js: "cells", typ: a(r("Cell")) },
      { json: "metadata", js: "metadata", typ: r("IpynbSchemaV44_Metadata") },
      { json: "nbformat", js: "nbformat", typ: 0 },
      { json: "nbformat_minor", js: "nbformat_minor", typ: 0 },
    ],
    false,
  ),
  Cell: o(
    [
      {
        json: "attachments",
        js: "attachments",
        typ: u(undefined, m(m(u(a(""), "")))),
      },
      { json: "cell_type", js: "cell_type", typ: r("CellType") },
      { json: "metadata", js: "metadata", typ: r("CellMetadata") },
      { json: "source", js: "source", typ: u(a(""), "") },
      {
        json: "execution_count",
        js: "execution_count",
        typ: u(undefined, u(0, null)),
      },
      { json: "outputs", js: "outputs", typ: u(undefined, a(r("Output"))) },
    ],
    false,
  ),
  CellMetadata: o(
    [
      { json: "format", js: "format", typ: u(undefined, "") },
      { json: "jupyter", js: "jupyter", typ: u(undefined, m("any")) },
      { json: "name", js: "name", typ: u(undefined, "") },
      { json: "tags", js: "tags", typ: u(undefined, a("")) },
      { json: "collapsed", js: "collapsed", typ: u(undefined, true) },
      { json: "execution", js: "execution", typ: u(undefined, r("Execution")) },
      {
        json: "scrolled",
        js: "scrolled",
        typ: u(undefined, u(true, r("ScrolledEnum"))),
      },
    ],
    "any",
  ),
  Execution: o(
    [
      {
        json: "iopub.execute_input",
        js: "iopub.execute_input",
        typ: u(undefined, ""),
      },
      {
        json: "iopub.status.busy",
        js: "iopub.status.busy",
        typ: u(undefined, ""),
      },
      {
        json: "iopub.status.idle",
        js: "iopub.status.idle",
        typ: u(undefined, ""),
      },
      {
        json: "shell.execute_reply",
        js: "shell.execute_reply",
        typ: u(undefined, ""),
      },
    ],
    "any",
  ),
  Output: o(
    [
      { json: "data", js: "data", typ: u(undefined, m(u(a(""), ""))) },
      {
        json: "execution_count",
        js: "execution_count",
        typ: u(undefined, u(0, null)),
      },
      { json: "metadata", js: "metadata", typ: u(undefined, m("any")) },
      { json: "output_type", js: "output_type", typ: r("OutputType") },
      { json: "name", js: "name", typ: u(undefined, "") },
      { json: "text", js: "text", typ: u(undefined, u(a(""), "")) },
      { json: "ename", js: "ename", typ: u(undefined, "") },
      { json: "evalue", js: "evalue", typ: u(undefined, "") },
      { json: "traceback", js: "traceback", typ: u(undefined, a("")) },
    ],
    false,
  ),
  IpynbSchemaV44_Metadata: o(
    [
      { json: "authors", js: "authors", typ: u(undefined, a("any")) },
      {
        json: "kernelspec",
        js: "kernelspec",
        typ: u(undefined, r("Kernelspec")),
      },
      {
        json: "language_info",
        js: "language_info",
        typ: u(undefined, r("LanguageInfo")),
      },
      { json: "orig_nbformat", js: "orig_nbformat", typ: u(undefined, 0) },
      { json: "title", js: "title", typ: u(undefined, "") },
    ],
    "any",
  ),
  Kernelspec: o(
    [
      { json: "display_name", js: "display_name", typ: "" },
      { json: "name", js: "name", typ: "" },
    ],
    "any",
  ),
  LanguageInfo: o(
    [
      {
        json: "codemirror_mode",
        js: "codemirror_mode",
        typ: u(undefined, u(m("any"), "")),
      },
      { json: "file_extension", js: "file_extension", typ: u(undefined, "") },
      { json: "mimetype", js: "mimetype", typ: u(undefined, "") },
      { json: "name", js: "name", typ: "" },
      { json: "pygments_lexer", js: "pygments_lexer", typ: u(undefined, "") },
    ],
    "any",
  ),
  CellType: ["code", "markdown", "raw"],
  ScrolledEnum: ["auto"],
  OutputType: ["display_data", "error", "execute_result", "stream"],
};
