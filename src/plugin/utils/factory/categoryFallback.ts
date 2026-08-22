// Fallback renderer for any component without an explicit template.
// Produces a labeled, token-styled container (never a bare grey box).
import { Template } from './templates';
import { text, setFill, setStroke, rect, pad } from '../primitives';
import { colorShade, radiusPx } from '../tokenAccess';
import { colorStyleKey } from '../styleKeys';

export const fallbackTemplate: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 8;
  pad(root, 16);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.resize(200, 84);
  root.appendChild(
    text({
      characters: ctx.def.name,
      fontFamily: ctx.config.fontFamily.heading,
      weight: 600,
      fontSize: 14,
      fill: colorShade(ctx.tokens, 'neutral', 800),
    })
  );
  root.appendChild(rect('placeholder', 168, 20, colorShade(ctx.tokens, 'neutral', 100)));
  return root;
};
