import { refractor } from "refractor/lib/core.js";

import js from "refractor/lang/javascript.js";
refractor.register(js);
refractor.alias({ javascript: ["js"] });

import tsx from "refractor/lang/tsx.js";
import ts from "refractor/lang/typescript.js";
refractor.register(ts);
refractor.register(tsx);
refractor.alias({ typescript: ["ts"] });

import md from "refractor/lang/markdown.js";
refractor.register(md);
refractor.alias({ markdown: ["md", "mdx"] });

import html from "refractor/lang/markup.js";
refractor.register(html);
refractor.alias({ markup: ["html"] });

import ruby from "refractor/lang/ruby.js";
refractor.register(ruby);

import python from "refractor/lang/python.js";
refractor.register(python);
refractor.alias({ python: ["py"] });

import r from "refractor/lang/r.js";
refractor.register(r);

import rust from "refractor/lang/rust.js";
refractor.register(rust);
refractor.alias({ rust: ["rs"] });

import go from "refractor/lang/go.js";
refractor.register(go);

import scala from "refractor/lang/scala.js";
refractor.register(scala);

import scss from "refractor/lang/scss.js";
refractor.register(scss);

import css from "refractor/lang/css.js";
refractor.register(css);

import c from "refractor/lang/c.js";
refractor.register(c);

import cpp from "refractor/lang/cpp.js";
refractor.register(cpp);

import d from "refractor/lang/d.js";
refractor.register(d);

import dart from "refractor/lang/dart.js";
refractor.register(dart);

import java from "refractor/lang/java.js";
refractor.register(java);

import kotlin from "refractor/lang/kotlin.js";
refractor.register(kotlin);

import bash from "refractor/lang/bash.js";
refractor.register(bash);

import docker from "refractor/lang/docker.js";
refractor.register(docker);

import sql from "refractor/lang/sql.js";
refractor.register(sql);

import wasm from "refractor/lang/wasm.js";
refractor.register(wasm);

import yaml from "refractor/lang/yaml.js";
refractor.register(yaml);

import nim from "refractor/lang/nim.js";
refractor.register(nim);

import powershell from "refractor/lang/powershell.js";
refractor.register(powershell);

import json from "refractor/lang/json.js";
refractor.register(json);

import graphql from "refractor/lang/graphql.js";
refractor.register(graphql);

import toml from "refractor/lang/toml.js";
refractor.register(toml);

export default refractor;
