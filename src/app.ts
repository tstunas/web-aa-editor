import { buildSaitamaarCompositeFont } from "./saitamaarFont";
import { Editor } from "./editor";
import { TextBoxObject } from "./textBoxObject";

async function main() {
  const canvas = document.getElementById("c");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element #c not found");
  }

  try {
    const cf = await buildSaitamaarCompositeFont();

    const editor = new Editor({ canvas, compositeFont: cf });

    editor.addObject(
      new TextBoxObject({
        id: "t1",
        text: "Saitamaar ABC 한글 테스트 123",
        fontSize: 56,
        x: 60,
        baselineY: 140,
        box: { x: 40, y: 40, w: 520, h: 140 },
        letterSpacingPx: 1,
        useKerning: true,
        lineHeightPx: 70,
        originBaseline: 140,
      }),
    );

    editor.addObject(
      new TextBoxObject({
        id: "t2",
        text: "두 번째 박스: 오른쪽 overflow 허용",
        fontSize: 36,
        x: 80,
        baselineY: 260,
        box: { x: 40, y: 220, w: 420, h: 100 },
        letterSpacingPx: 0,
        useKerning: true,
        lineHeightPx: 48,
        originBaseline: 260,
      }),
    );

    editor.render();
  } catch (error) {
    console.error(error);
    document.body.insertAdjacentHTML(
      "beforeend",
      `<pre style="color:#b91c1c;padding:16px;">${String(error)}</pre>`,
    );
  }
}

void main();
