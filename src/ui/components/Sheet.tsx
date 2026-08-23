import React from 'react';

/**
 * The specimen sheet: the light surface every destination renders onto.
 *
 * It owns the head and the one scroll container. Before this each view carried
 * its own scroller with 80px of bottom padding reserved for a fixed action bar,
 * and its own `<h2>` — so the page title, the scrollbar and the footer moved with
 * the view instead of staying put. Hoisting all three here is what makes the rail
 * possible: the frame is constant and only the specimen inside it changes.
 */

interface SheetProps {
  title: string;
  sub: string;
  /** Right-hand note in the head — a count, in mono. Omitted where there is nothing true to say. */
  meta?: string;
  /**
   * Banners, rendered between the head and the scrolling body.
   *
   * A slot rather than something the caller drops into `children`, because a
   * notice must not scroll away with the specimen: an error you can lose by
   * flicking the wheel is an error the user never reads. It cannot go in the
   * shell either — that is a two-column grid, and a third child there becomes a
   * third column.
   */
  notice?: React.ReactNode;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ title, sub, meta, notice, children }) => (
  <section className="dsk-sheet">
    <header className="dsk-sheet-head">
      <div>
        <h1 className="dsk-sheet-title">{title}</h1>
        <p className="dsk-sheet-sub">{sub}</p>
      </div>
      {meta !== undefined && <span className="dsk-sheet-meta dsk-data">{meta}</span>}
    </header>

    {notice}

    <div className="dsk-sheet-body">{children}</div>
  </section>
);
