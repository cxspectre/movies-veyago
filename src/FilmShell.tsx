import React from 'react';
import {continueRender, delayRender} from 'remotion';
import {loadFilmFonts} from './fonts';

/** Holds the render until every film font is loaded. Wrap each registered composition in this. */
export const FilmShell: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = React.useState(() => delayRender('film-fonts'));
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    loadFilmFonts()
      .catch((error: unknown) => {
        console.error('Font loading failed', error);
      })
      .finally(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready ? <>{children}</> : null;
};

export const shelled =
  (Inner: React.ComponentType): React.FC =>
  () => (
    <FilmShell>
      <Inner />
    </FilmShell>
  );
