import Mermaid from "mermaid";
import Murmur from "./murmurhash3_gc.js";
import "./index.css";

const htmlEntities = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const MermaidChart = async (code, title = "") => {
  try {
    var needsUniqueId = "render" + Murmur(code, 42).toString();
    if (await Mermaid.mermaidAPI.parse(code)) {
      const { svg } = await Mermaid.mermaidAPI.render(needsUniqueId, code);
      if (title && String(title).length) {
        title = `<div class="mermaid-title">${htmlEntities(title)}</div>`;
      }
      return `<div class="mermaid">${title}${svg}</div>`;
    }
  } catch (err) {
    return `<pre style="color: rgb(220 38 38)" class="mermaid-error">${htmlEntities(
      err.name
    )}: ${htmlEntities(err.message)}</pre>`;
  }
};

const MermaidPlugIn = (md, opts) => {
  document.addEventListener("DOMContentLoaded", function () {
    Mermaid.initialize(Object.assign(MermaidPlugIn.default, opts));
  });

  const defaultRenderer = md.renderer.rules.fence.bind(md.renderer.rules);
  const domParser = new DOMParser();

  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx];
    const code = token.content.trim();
    if (token.info.startsWith("mermaid")) {
      const placeholderId = Math.random();
      let title;
      const spc = token.info.indexOf(" ", 7);
      if (spc > 0) {
        title = token.info.slice(spc + 1);
      }
      MermaidChart(code, title).then((value) => {
        const intervalId = setInterval(() => {
          let placeholderDiv = document.getElementById(placeholderId);
          if (placeholderDiv == null)
            placeholderDiv = document.getElementById(placeholderId);
          else {
            const parentDiv = placeholderDiv.parentNode;
            const docDiagram = domParser.parseFromString(value, "text/html");
            const diagramDiv = docDiagram.body.firstChild;
            parentDiv.replaceChild(diagramDiv, placeholderDiv);
            clearInterval(intervalId);
          }
        }, 100);
      });
      return `<div id="${placeholderId}">${code}</div>`;
    }
    return defaultRenderer(tokens, idx, opts, env, self);
  };
};

MermaidPlugIn.default = {
  startOnLoad: false,
  securityLevel: "strict",
  theme: "default",
  flowchart: {
    htmlLabels: false,
    useMaxWidth: true,
  },
  gantt: { axisFormat: "%d/%m/%Y" },
};

export default MermaidPlugIn;
