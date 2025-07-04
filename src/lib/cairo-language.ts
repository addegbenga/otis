import type * as monaco from "monaco-editor";

export const cairoLanguageDefinition = {
  id: "cairo",
  extensions: [".cairo"],
  aliases: ["Cairo", "cairo"],
  mimetypes: ["text/x-cairo"],
};

export const cairoTokensProvider: monaco.languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".cairo",

  keywords: [
    "fn",
    "let",
    "mut",
    "if",
    "else",
    "match",
    "loop",
    "while",
    "for",
    "in",
    "return",
    "break",
    "continue",
    "struct",
    "enum",
    "impl",
    "trait",
    "mod",
    "use",
    "pub",
    "const",
    "static",
    "type",
    "where",
    "as",
    "ref",
    "move",
    "box",
    "self",
    "Self",
    "super",
    "crate",
    "extern",
    "unsafe",
    "async",
    "await",
    "dyn",
    "abstract",
    "become",
    "do",
    "final",
    "macro",
    "override",
    "priv",
    "typeof",
    "unsized",
    "virtual",
    "yield",
    "try",
  ],

  typeKeywords: [
    "u8",
    "u16",
    "u32",
    "u64",
    "u128",
    "u256",
    "usize",
    "i8",
    "i16",
    "i32",
    "i64",
    "i128",
    "isize",
    "felt252",
    "bool",
    "char",
    "str",
    "ContractAddress",
    "ClassHash",
    "StorageAddress",
    "Array",
    "Span",
    "Option",
    "Result",
  ],

  constants: ["true", "false"],

  operators: [
    "=",
    ">",
    "<",
    "!",
    "~",
    "?",
    ":",
    "==",
    "<=",
    ">=",
    "!=",
    "&&",
    "||",
    "++",
    "--",
    "+",
    "-",
    "*",
    "/",
    "&",
    "|",
    "^",
    "%",
    "<<",
    ">>",
    ">>>",
    "+=",
    "-=",
    "*=",
    "/=",
    "&=",
    "|=",
    "^=",
    "%=",
    "<<=",
    ">>=",
    ">>>=",
  ],

  symbols: /[=><!~?:&|+\-*/^%]+/,

  escapes:
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Identifiers and keywords
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            "@typeKeywords": "type",
            "@keywords": "keyword",
            "@constants": "constant",
            "@default": "identifier",
          },
        },
      ],
      [/[A-Z][\w$]*/, "type.identifier"],

      // Whitespace
      { include: "@whitespace" },

      // Delimiters and operators
      [/[{}()[\]]/, "@brackets"],
      [/[<>](?!@symbols)/, "@brackets"],
      [
        /@symbols/,
        {
          cases: {
            "@operators": "operator",
            "@default": "",
          },
        },
      ],

      // Numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F]+/, "number.hex"],
      [/\d+/, "number"],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, "delimiter"],

      // Strings
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

      // Characters
      [/'[^\\']'/, "string"],
      [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
      [/'/, "string.invalid"],

      // Attributes
      [/#\[.*?\]/, "annotation"],
    ],

    comment: [
      [/[^/*]+/, "comment"],
      [/\/\*/, "comment", "@push"],
      ["\\*/", "comment", "@pop"],
      [/[/*]/, "comment"],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],
  },
};

export const cairoTheme: monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "569cd6", fontStyle: "bold" },
    { token: "type", foreground: "4ec9b0" },
    { token: "type.identifier", foreground: "4ec9b0" },
    { token: "constant", foreground: "569cd6" },
    { token: "string", foreground: "ce9178" },
    { token: "string.escape", foreground: "d7ba7d" },
    { token: "comment", foreground: "6a9955", fontStyle: "italic" },
    { token: "annotation", foreground: "dcdcaa" },
    { token: "number", foreground: "b5cea8" },
    { token: "number.hex", foreground: "b5cea8" },
    { token: "number.float", foreground: "b5cea8" },
    { token: "operator", foreground: "d4d4d4" },
    { token: "delimiter", foreground: "d4d4d4" },
    { token: "identifier", foreground: "9cdcfe" },
  ],
  colors: {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "editorLineNumber.foreground": "#858585",
    "editorLineNumber.activeForeground": "#c6c6c6",
    "editor.selectionBackground": "#264f78",
    "editor.inactiveSelectionBackground": "#3a3d41",
  },
};
